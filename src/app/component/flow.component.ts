import {ChangeDetectionStrategy, Component, signal, ViewChild, WritableSignal} from "@angular/core";
import {Edge, Node, VflowComponent} from "ngx-vflow";
import {Agent, MCP, NodeData, Tool} from "../model/definitions";
import {InfoNode} from "./node/info/info.node";
import {AgentNode} from "./node/agent/agent.node";
import {MessageNode} from "./node/message/message.node";
import {McpNode} from "./node/mcp/mcp.node";
// @ts-ignore
import {ComponentNode} from "ngx-vflow/lib/vflow/interfaces/node.interface";

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

    agentCount = 0;
    mcpCount = 0;

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

    public addAgent(from: Agent) {
        this.addNode('agent', from.sessionId, {from} as NodeData);
        this.agentCount++
    }

    public addMessage(sessionId: string, content: string) {
        const nodeId = `message-${sessionId}`;
        this.addNode('message', nodeId, {from: this.findNode(sessionId)?.data().from, to: this.findPrimary()?.data().from, content} as NodeData);
        this.addEdge(nodeId, sessionId);
        this.addEdge(nodeId, this.findPrimary()?.id);
    }

    public addMcp(from: string, to: MCP) {
        this.addNode('mcp', to.name, {to} as NodeData);
        this.mcpCount++

        this.addEdge(from, to.name);
    }

    private addNode(type: NodeType, nodeId: string, data: NodeData) {
        const existing = this.nodes().find(n => n.id === nodeId);
        if (existing) {
            const component = existing as ComponentNode;
            if (component.data() != data) {
                console.log('Updating data:', data);
                component.data?.update(() => data);
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
        console.log('Adding edge:', source, target);
        this.edges.set([...this.edges(), {
            id: `${source} -> ${target}`,
            source,
            target
        }]);
    }

    private findNode(id: string) {
        return this.nodes()
            .map(n => n as ComponentNode)
            .find(n => n.id === id);
    }

    private findPrimary() {
        return this.nodes()
            .map(n => n as ComponentNode)
            .find(n => n.data().from.role == 'primary');
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
        if (type == 'agent') {
            y = 200 * this.agentCount;
        }

        if (type == 'message') {
            x = 350;
            y = -100;
        }

        if (type == 'mcp') {
            x = -450;
            y = 150 * this.mcpCount;
        }

        return signal({
            x: 600 + x,
            y: 280 + y
        });
    }
}

type NodeType = "agent" | "mcp" | "message" | "info";