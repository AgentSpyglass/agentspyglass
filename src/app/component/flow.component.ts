import {ChangeDetectionStrategy, Component, computed, inject, signal, viewChild, WritableSignal} from "@angular/core";
import {ComponentNode, Edge, Node, VflowComponent} from "ngx-vflow";
import {Agent, MCP} from "@agentspyglass/core";
import {NodeData, NodeType} from "../model/definitions";
import {InfoNode} from "./node/info/info.node";
import {AgentNode} from "./node/agent/agent.node";
import {McpNode} from "./node/mcp/mcp.node";
import {EntityStoreService} from "../service/entity-store.service";

type Point = { x: number; y: number };

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

    /**
     * Agent-centered relational layout.
     *
     *       User
     *        |
     * MCPs <-> Agent <-> Subagents
     *
     * Each primary agent starts a cluster in the center column; whole clusters stack vertically.
     */
    private readonly LAYOUT = {
        cluster: { centerX: 650, baseY: 150, spacingY: 750 },
        user: { offsetY: -230 },
        mcp: { offsetX: -400, spacingY: 240 },
        subagent: { offsetX: 400, spacingY: 240 },
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
        if (agent.targetSessionId) {
            const parentId = agent.targetSessionId;
            const parentPoint = this.nodes().find(n => n.id === parentId)?.point();
            const index = this.subagentCount(parentId);
            const point = parentPoint
                ? this.placeRightOf(parentPoint, index)
                : this.placeRightOf({x: this.LAYOUT.cluster.centerX, y: this.LAYOUT.cluster.baseY}, index);

            this.addNode('agent', agent.sessionId, {type: 'agent', entityId: agent.sessionId}, point);
            this.addEdge(parentId, agent.sessionId, 's-right', 't-left');
            return;
        }

        this.addNode('agent', agent.sessionId, {type: 'agent', entityId: agent.sessionId}, this.placeRootAgent());

        const agentPoint = this.nodes().find(n => n.id === agent.sessionId)?.point();
        if (agentPoint) {
            const userId = `user-${agent.sessionId}`;
            this.addNode('agent', userId, {type: 'agent', entityId: 'user'}, this.placeAbove(agentPoint));
            this.addEdge(userId, agent.sessionId, 's-bottom', 't-top');
        }
    }

    public addMcp(from: string, mcp: MCP) {
        const ownerPoint = this.nodes().find(n => n.id === from)?.point();
        const index = this.entityStore.getMcpNamesFor(from).length;
        this.entityStore.associateMcp(from, mcp.name);

        const point = ownerPoint
            ? this.placeLeftOf(ownerPoint, index)
            : this.placeLeftOf({x: this.LAYOUT.cluster.centerX, y: this.LAYOUT.cluster.baseY}, index);

        this.addNode('mcp', mcp.name, {type: 'mcp', entityId: mcp.name}, point);
        this.addEdge(from, mcp.name, 's-left', 't-right');
    }

    private addNode(type: NodeType, nodeId: string, data: NodeData, point: Point) {
        if (this.nodes().find(n => n.id === nodeId)) return;

        const node: ComponentNode = {
            id: nodeId,
            type: this.getType(type),
            point: signal(point),
            data: signal(data)
        };
        this.nodes.set([...this.nodes(), node]);
    }

    /**
     * Handle ids refer to `<handle id="...">` declarations inside the node templates
     * (agent.node.html / mcp.node.html). ngx-vflow binds edges to the first handle of a
     * matching type when no id is given, so ids are required now that the agent node has
     * multiple source/target handles.
     */
    private addEdge(source: string, target: string, sourceHandle: string, targetHandle: string) {
        const exists = this.edges().find(e => e.source === source && e.target === target);
        if (!exists) {
            this.edges.set([...this.edges(), {
                id: `${source} -> ${target}`,
                source,
                target,
                sourceHandle,
                targetHandle
            }]);
        }
    }

    getType(type: NodeType) {
        switch (type) {
            case 'agent':
                return AgentNode;
            case 'mcp':
                return McpNode;
        }

        return InfoNode;
    }

    private rootCount(): number {
        return this.nodes().filter(n => {
            if (n.type !== AgentNode) return false;
            const agent = this.entityStore.getAgent(n.id);
            return !!agent && !agent.targetSessionId;
        }).length;
    }

    private subagentCount(parentId: string): number {
        return this.nodes().filter(n => n.type === AgentNode && this.entityStore.getAgent(n.id)?.targetSessionId === parentId).length;
    }

    private placeRootAgent(): Point {
        return {
            x: this.LAYOUT.cluster.centerX,
            y: this.LAYOUT.cluster.baseY + this.rootCount() * this.LAYOUT.cluster.spacingY
        };
    }

    private placeAbove(point: Point): Point {
        return {x: point.x, y: point.y + this.LAYOUT.user.offsetY};
    }

    private placeLeftOf(point: Point, index: number): Point {
        return {x: point.x + this.LAYOUT.mcp.offsetX, y: point.y + index * this.LAYOUT.mcp.spacingY};
    }

    private placeRightOf(point: Point, index: number): Point {
        return {x: point.x + this.LAYOUT.subagent.offsetX, y: point.y + index * this.LAYOUT.subagent.spacingY};
    }
}
