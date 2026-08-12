import {ChangeDetectionStrategy, Component, inject, signal, ViewChild, WritableSignal} from "@angular/core";
import {ComponentNode, Edge, Node, VflowComponent} from "ngx-vflow";
import {Agent, MCP} from "@agentspyglass/core";
import {NodeData, NodeType} from "../model/definitions";
import {InfoNode} from "./node/info/info.node";
import {AgentNode} from "./node/agent/agent.node";
import {MessageNode} from "./node/message/message.node";
import {McpNode} from "./node/mcp/mcp.node";
import {EntityStoreService} from "../service/entity-store.service";
import {isComponentNode} from "ngx-vflow";

@Component({
    selector: "flow",
    imports: [
        VflowComponent
    ],
    template: `
	    <vflow
                #vflow
			    view="auto"
                [nodes]="nodes()"
                [edges]="edges()"
			    [minZoom]="0.1"
			    [maxZoom]="1.5"
			    [snapGrid]="[25, 25]"
			    [background]="{ type: 'dots', gap: 25, color: 'rgba(100,100,50,0.3)', backgroundColor: '#040504' }"
	    />
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlowComponent {
    @ViewChild(VflowComponent) vflow!: VflowComponent;
    nodes: WritableSignal<Node[]> = signal([]);
    edges: WritableSignal<Edge[]> = signal([]);

    private entityStore = inject(EntityStoreService);

    fitView(): void {
        this.vflow.fitView({padding: 0.3, duration: 200});
    }

    zoomIn(): void {
        this.vflow.zoomTo(Math.min(this.vflow.viewport().zoom * 1.2, 1.5));
    }

    zoomOut(): void {
        this.vflow.zoomTo(Math.max(this.vflow.viewport().zoom / 1.2, 0.1));
    }

    viewport() {
        return this.vflow.viewport();
    }

    public addAgent(agent: Agent) {
        this.entityStore.upsertAgent(agent);
        this.addNode('agent', agent.sessionId, {
            type: 'agent',
            entityId: agent.sessionId,
        });
    }

    public addMessage(sessionId: string, content: string) {
        const nodeId = `message-${sessionId}`;
        const primary = this.entityStore.findPrimaryAgent();
        this.addNode('message', nodeId, {
            type: 'message',
            entityId: nodeId,
            content,
            senderId: sessionId,
            receiverId: primary?.sessionId,
        });
        this.addEdge(nodeId, sessionId);
        if (primary) {
            this.addEdge(nodeId, primary.sessionId);
        }
    }

    public addMcp(from: string, mcp: MCP) {
        this.entityStore.upsertMcp(mcp);
        this.addNode('mcp', mcp.name, {
            type: 'mcp',
            entityId: mcp.name,
        });
        this.addEdge(from, mcp.name);
    }

    private addNode(type: NodeType, nodeId: string, data: NodeData) {
        const existing = this.nodes().find(n => n.id === nodeId);
        if (existing && isComponentNode(existing) && existing.data) {
            if (existing.data() != data) {
                existing.data.update(() => data);
            }
            return;
        }

        const node: ComponentNode = {
            id: nodeId,
            type: this.getType(type),
            point: this.calculatePosition(type),
            data: signal(data)
        };
        this.nodes.set([...this.nodes(), node]);
    }

    private addEdge(source: string, target: string) {
        const exists = this.edges().find(e => e.source === source && e.target === target);
        if (!exists) {
            this.edges.set([...this.edges(), {
                id: `${source} -> ${target}`,
                source,
                target
            }]);
        }
    }

    getType(type: NodeType) {
        switch (type) {
            case 'agent':
                return AgentNode;
            case 'mcp':
                return McpNode;
            case 'message':
                return MessageNode;
        }

        return InfoNode;
    }

    private calculatePosition(type: NodeType) {
        let x = 0;
        let y = 0;

        const agentCount = this.nodes().filter(n => n.type === AgentNode).length;
        const mcpCount = this.nodes().filter(n => n.type === McpNode).length;
        const messageCount = this.nodes().filter(n => n.type === MessageNode).length;

        if (type == 'agent') {
            y = 200 * agentCount;
        }

        if (type == 'message') {
            x = 350;
            y = -100 + 200 * messageCount;
        }

        if (type == 'mcp') {
            x = -450;
            y = 150 * mcpCount;
        }

        return signal({
            x: 600 + x,
            y: 280 + y
        });
    }
}
