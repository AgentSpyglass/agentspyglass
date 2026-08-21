import {ChangeDetectionStrategy, Component, computed, inject, signal, viewChild, WritableSignal} from "@angular/core";
import {ComponentNode, Edge, Node, VflowComponent} from "ngx-vflow";
import {Agent, MCP} from "@agentspyglass/core";
import {NodeData, NodeType} from "../model/definitions";
import {InfoNode} from "./node/info/info.node";
import {AgentNode} from "./node/agent/agent.node";
import {MessageNode} from "./node/message/message.node";
import {McpNode} from "./node/mcp/mcp.node";
import {EntityStoreService} from "../service/entity-store.service";

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
    vflow = viewChild.required(VflowComponent);
    nodes: WritableSignal<Node[]> = signal([]);
    edges: WritableSignal<Edge[]> = signal([]);

    private entityStore = inject(EntityStoreService);

    /** Reactive viewport state — safe to read before vflow initializes. */
    readonly currentViewport = computed(() => this.vflow().viewport() ?? {zoom: 1, x: 0, y: 0});

    private readonly LAYOUT = {
        agent: { baseX: 600, baseY: 100, spacingY: 250 },
        mcp: { baseX: 150, baseY: 150, spacingY: 200 },
        message: { offsetX: 350, offsetY: 0, fallbackX: 950, fallbackY: 100 },
        info: { x: 400, y: 400 }
    };

    fitView(): void {
        this.vflow().fitView({padding: 0.3, duration: 200});
    }

    zoomIn(): void {
        this.vflow().zoomTo(Math.min(this.vflow().viewport().zoom * 1.2, 1.5));
    }

    zoomOut(): void {
        this.vflow().zoomTo(Math.max(this.vflow().viewport().zoom / 1.2, 0.1));
    }

    viewport() {
        return this.vflow().viewport();
    }

    public addAgent(agent: Agent) {
        this.addNode('agent', agent.sessionId, {
            type: 'agent',
            entityId: agent.sessionId,
        });

        if (agent.targetSessionId) {
            const parentId = agent.targetSessionId;
            const childId = agent.sessionId;
            const messageId = `spawn-${parentId}-${childId}`;
            this.addNode('message', messageId, {
                type: 'message',
                entityId: messageId,
                senderId: parentId,
                receiverId: childId,
            }, parentId);
            this.addEdge(parentId, messageId);
            this.addEdge(messageId, childId);
        }
    }

    public addMessage(sessionId: string, content: string, role: 'user' | 'assistant', parentID?: string) {
        const primary = this.entityStore.findPrimaryAgent();
        const nodeId = `message-${sessionId}`;
        this.addNode('message', nodeId, {
            type: 'message',
            entityId: nodeId,
            content,
            senderId: role === 'user' ? 'user' : (parentID ?? primary?.sessionId),
            receiverId: sessionId,
        }, sessionId);
        this.addEdge(nodeId, sessionId);
        if (primary) {
            this.addEdge(nodeId, primary.sessionId);
        }
    }

    public addMcp(from: string, mcp: MCP) {
        this.addNode('mcp', mcp.name, {
            type: 'mcp',
            entityId: mcp.name,
        });
        this.addEdge(from, mcp.name);
    }

    private addNode(type: NodeType, nodeId: string, data: NodeData, senderId?: string) {
        if (this.nodes().find(n => n.id === nodeId)) return;

        const node: ComponentNode = {
            id: nodeId,
            type: this.getType(type),
            point: signal(this.calculatePosition(type, senderId)),
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

    private calculatePosition(type: NodeType, senderId?: string) {
        const nodes = this.nodes();

        switch (type) {
            case 'agent': {
                const count = nodes.filter(n => n.type === AgentNode).length;
                return {
                    x: this.LAYOUT.agent.baseX,
                    y: this.LAYOUT.agent.baseY + (count * this.LAYOUT.agent.spacingY)
                };
            }
            case 'mcp': {
                const count = nodes.filter(n => n.type === McpNode).length;
                return {
                    x: this.LAYOUT.mcp.baseX,
                    y: this.LAYOUT.mcp.baseY + (count * this.LAYOUT.mcp.spacingY)
                };
            }
            case 'message': {
                const sender = senderId ? nodes.find(n => n.id === senderId) : null;
                const senderPos = sender ? sender.point() : null;
                const baseX = senderPos ? senderPos.x + this.LAYOUT.message.offsetX : this.LAYOUT.message.fallbackX;
                const baseY = senderPos ? senderPos.y + this.LAYOUT.message.offsetY : this.LAYOUT.message.fallbackY;
                return { x: baseX, y: baseY };
            }
            default:
                return this.LAYOUT.info;
        }
    }
}
