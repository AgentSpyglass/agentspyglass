import {ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked, viewChild, WritableSignal} from "@angular/core";
import {ComponentNode, Edge, VflowComponent} from "ngx-vflow";
import {Agent, MCP} from "@agentspyglass/core";
import {NodeData, NodeType} from "../model/definitions";
import {McpNode} from "./node/mcp/mcp.node";
import {resolveNodeComponent} from "./node/node-types";
import {EntityStoreService} from "../service/entity-store.service";
import {layoutGraph} from "../layout/graph-layout";

type Point = { x: number; y: number };

/** Provisional slot until the relayout effect assigns final positions. */
const PROVISIONAL_POINT: Point = {x: 650, y: 150};

/** Id prefix of the synthetic user node hanging above each primary agent. */
const USER_NODE_PREFIX = "user-";

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
    nodes: WritableSignal<ComponentNode[]> = signal([]);
    edges: WritableSignal<Edge[]> = signal([]);

    private entityStore = inject(EntityStoreService);

    /** Reactive viewport state — safe to read before vflow initializes. */
    readonly currentViewport = computed(() => this.vflow().viewport() ?? {zoom: 1, x: 0, y: 0});

    constructor() {
        /**
         * Reactive relayout over the whole graph (see layoutGraph):
         *
         *   User
         *    |
         * MCPs <- Agent -> Subagents   (clusters stack vertically)
         *
         * Every nodes()/edges() mutation re-runs the layered layout and glides
         * existing points to their new spot. Points are read/written inside
         * untracked() so this effect reacts to graph topology only — never to
         * its own position writes (loop prevention).
         */
        effect(() => {
            const nodes = this.nodes();
            const edges = this.edges();
            if (nodes.length === 0) return;

            const pinnedIds = new Set(nodes.filter(n => n.id.startsWith(USER_NODE_PREFIX)).map(n => n.id));
            const inverseSideIds = new Set(nodes.filter(n => n.type === McpNode).map(n => n.id));

            /**
             * Macro spacing. layerGap cannot drop below ~408 without overlap:
             * MCP cards are fixed w-96 (384px) and sit one layer left of the
             * agent column, so 400 already leaves only ~16px clearance.
             * Compaction therefore comes from the cross axis: siblingGap and
             * pinOffset shrink the vertical sprawl of MCP/subagent stacks and
             * the pinned user node.
             */
            const positions = layoutGraph(nodes, edges, {
                orientation: 'LR',
                layerGap: 400,
                siblingGap: 180,
                origin: {x: 650, y: 150},
                pinnedIds,
                inverseSideIds,
                pinOffset: 160,
            });

            untracked(() => {
                for (const node of nodes) {
                    const next = positions.get(node.id);
                    if (!next) continue;
                    const current = node.point();
                    if (current.x === next.x && current.y === next.y) continue;
                    node.point.set(next);
                }
            });
        });
    }

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
        this.addNode('agent', agent.sessionId, {type: 'agent', entityId: agent.sessionId}, PROVISIONAL_POINT);

        if (agent.targetSessionId) {
            this.addEdge(agent.targetSessionId, agent.sessionId, 's-right', 't-left');
            return;
        }

        const userId = `${USER_NODE_PREFIX}${agent.sessionId}`;
        this.addNode('agent', userId, {type: 'agent', entityId: 'user'}, PROVISIONAL_POINT);
        this.addEdge(userId, agent.sessionId, 's-bottom', 't-top');
    }

    public addMcp(from: string, mcp: MCP) {
        this.entityStore.associateMcp(from, mcp.name);

        this.addNode('mcp', mcp.name, {type: 'mcp', entityId: mcp.name}, PROVISIONAL_POINT);
        this.addEdge(from, mcp.name, 's-left', 't-right');
    }

    private addNode(type: NodeType, nodeId: string, data: NodeData, point: Point) {
        if (this.nodes().find(n => n.id === nodeId)) return;

        const node: ComponentNode = {
            id: nodeId,
            type: resolveNodeComponent(type),
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
}
