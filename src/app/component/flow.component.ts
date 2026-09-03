import {ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal, untracked, viewChild, WritableSignal} from "@angular/core";
import {ComponentNode, Edge, VflowComponent} from "ngx-vflow";
import {Agent, MCP} from "@agentspyglass/core";
import {NodeData, NodeType} from "../model/definitions";
import {resolveNodeComponent} from "./node/node-types";
import {EntityStoreService} from "../service/entity-store.service";
import {PresentationService} from "../service/presentation.service";
import {layoutMacroGraph, MacroLayoutOptions, MacroNodeKind} from "../layout/graph-layout";
import gsap from "gsap";

type Point = { x: number; y: number };

type DeferredEdge = {
    target: string;
};

const PROVISIONAL_POINT: Point = {x: 650, y: 150};

const USER_NODE_PREFIX = "user-";

const MACRO_LAYOUT: MacroLayoutOptions = {
    origin: {x: 650, y: 150, side: ''},
    anchorGap: 160,
    mcpGap: 400,
    mcpStackGap: 180,
    subGap: 400,
    groupGap: 180,
};

@Component({
    selector: "flow",
    imports: [
        VflowComponent
    ],
    template: `
	    <vflow
                #vflow
                view="auto"
			    [nodes]="visibleNodes()"
                [edges]="visibleEdges()"
			    [minZoom]="0.1"
			    [maxZoom]="1.5"
			    [snapGrid]="[25, 25]"
			    [elevateEdgesOnSelect]="false"
			    [background]="{ type: 'dots', gap: 25, color: 'rgba(100,100,50,0.3)', backgroundColor: '#040504' }"
	    />
    `,
    styles: [`:host { display: block; width: 100%; height: 100%; }`],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlowComponent {
    vflow = viewChild.required(VflowComponent);
    private vflowEl = viewChild.required('vflow', {read: ElementRef<HTMLElement>});
    nodes: WritableSignal<ComponentNode[]> = signal([]);
    edges: WritableSignal<Edge[]> = signal([]);

    readonly visibleNodes = computed(() => this.filterNodes(this.nodes()));
    readonly visibleEdges = computed(() => this.filterEdges(this.edges()));

    private entityStore = inject(EntityStoreService);
    private presentation = inject(PresentationService);

    private readonly deferredEdges = new Map<string, DeferredEdge[]>();

    readonly currentViewport = computed(() => this.vflow().viewport() ?? {zoom: 1, x: 0, y: 0});

    constructor() {
        effect(() => {
            const nodes = this.visibleNodes();
            const edges = this.visibleEdges();
            if (nodes.length === 0) return;

            const kinds = new Map<string, MacroNodeKind>();
            for (const node of nodes) {
                kinds.set(node.id, node.data?.().type === 'mcp'
                    ? 'mcp'
                    : node.id.startsWith(USER_NODE_PREFIX) ? 'anchor' : 'agent');
            }

            const positions = layoutMacroGraph(nodes, edges, kinds, MACRO_LAYOUT);

            untracked(() => {
                for (const node of nodes) {
                    const next = positions.get(node.id);
                    if (!next) continue;
                    const current = node.point();
                    const positionChanged = current.x !== next.x || current.y !== next.y;
                    if (positionChanged) {
                        node.point.set(next);
                    }

                    if (node.data?.()?.type !== 'mcp') continue;
                    const mcp = this.entityStore.getMcp(node.id);
                    if (!mcp) continue;

                    const layoutSide = next.side as 'left' | 'right' | undefined;
                    if (layoutSide && mcp.side !== layoutSide) {
                        mcp.side = layoutSide;
                        this.entityStore.upsertMcp(mcp);
                    }
                    // Ensure edge handles match the resolved side (created before layout)
                    this.syncMcpEdgeHandles(node.id, mcp.side);
                }
            });
        });

        effect(() => {
            const focusedId = this.presentation.focusedNodeId();
            const nodeList = this.nodes();

            untracked(() => {
                for (const node of nodeList) {
                    const dataSignal = node.data;
                    if (!dataSignal) continue;
                    const data = dataSignal();
                    const focused = focusedId === node.id;
                    if (data.focused === focused) continue;
                    dataSignal.set({...data, focused});
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

    /** Center the viewport on the node with the given id (smooth). */
    focusNode(nodeId: string): void {
        const vflow = this.vflow();
        const node = vflow.getNode(nodeId);
        if (!node) return;
        const point = node.point();
        const rect = this.vflowEl().nativeElement.getBoundingClientRect();
        const width = rect.width || 800;
        const height = rect.height || 600;
        const nodeWidth = (node as { width?: WritableSignal<number> }).width?.() ?? 100;
        const nodeHeight = (node as { height?: WritableSignal<number> }).height?.() ?? 100;
        const targetZoom = 0.8;
        const target = {
            x: width / 2 - (point.x + nodeWidth / 2) * targetZoom,
            y: height / 2 - (point.y + nodeHeight / 2) * targetZoom,
        };
        this.animateViewport(target.x, target.y, targetZoom);
    }

    /** Smoothly animate the viewport to a target (x, y) and zoom. */
    private animateViewport(targetX: number, targetY: number, targetZoom: number): void {
        const vp = this.vflow().viewport();
        const proxy = {x: vp.x, y: vp.y, zoom: vp.zoom};
        gsap.to(proxy, {
            x: targetX,
            y: targetY,
            zoom: targetZoom,
            duration: 0.3,
            ease: 'power2.out',
            onUpdate: () => this.vflow().viewportTo({x: proxy.x, y: proxy.y, zoom: proxy.zoom}),
        });
    }

    public addAgent(agent: Agent) {
        const groupKey = this.entityStore.resolveGroupKey(agent.sessionId);
        if (!groupKey) return;

        this.addNode('agent', groupKey, {type: 'agent', entityId: groupKey}, PROVISIONAL_POINT);

        if (agent.targetSessionId) {
            const parentKey = this.entityStore.resolveGroupKey(agent.targetSessionId);
            if (!parentKey) {
                this.deferEdge(agent.targetSessionId, {target: groupKey});
            } else if (parentKey !== groupKey) {
                this.addEdge(parentKey, groupKey, 's-bottom', 't-top');
            }
        } else {
            const anchored = this.edges().some(e => e.target === groupKey && e.source.startsWith(USER_NODE_PREFIX));
            if (!anchored) {
                const userId = `${USER_NODE_PREFIX}${agent.sessionId}`;
                this.addNode('agent', userId, {type: 'agent', entityId: 'user'}, PROVISIONAL_POINT);
                this.addEdge(userId, groupKey, 's-bottom', 't-top');
            }
        }
        this.flushDeferredEdges(groupKey);
    }

    public addMcp(from: string, mcp: MCP) {
        this.entityStore.associateMcp(from, mcp.name);

        this.addNode('mcp', mcp.name, {type: 'mcp', entityId: mcp.name}, PROVISIONAL_POINT);
        const ownerKey = this.entityStore.resolveGroupKey(from);
        if (ownerKey) {
            this.connectMcp(ownerKey, mcp.name);
        } else {
            this.deferEdge(from, {target: mcp.name});
        }
    }

    private ensureMcpSide(ownerKey: string, mcpName: string): void {
        const mcp = this.entityStore.getMcp(mcpName);
        if (!mcp) return;
        // Layout assigns side by parity: index 0 -> right, 1 -> left, etc.
        // Replicate deterministically before edge creation so handles are correct immediately.
        if (this.edges().some(e => e.source === ownerKey && e.target === mcpName)) return;
        const existingMcpCount = this.edges().filter(e => e.source === ownerKey && this.isMcpNode(e.target)).length;
        const expectedSide: 'left' | 'right' = existingMcpCount % 2 === 0 ? 'right' : 'left';
        if (mcp.side !== expectedSide) {
            mcp.side = expectedSide;
            this.entityStore.upsertMcp(mcp);
        }
    }

    private syncMcpEdgeHandles(mcpName: string, side: 'left' | 'right'): void {
        const {sourceHandle, targetHandle} = this.mcpHandles(side);
        let mutated = false;
        const nextEdges = this.edges().map(e => {
            if (e.target !== mcpName || !this.isMcpNode(e.target)) return e;
            if (e.sourceHandle === sourceHandle && e.targetHandle === targetHandle) return e;
            mutated = true;
            return {...e, sourceHandle, targetHandle};
        });
        if (mutated) this.edges.set(nextEdges);
    }

    private connectMcp(ownerKey: string, mcpName: string): void {
        if (this.edges().some(e => e.source === ownerKey && e.target === mcpName)) return;
        // Ensure side is determined BEFORE edge creation (fixes stale default 'left')
        this.ensureMcpSide(ownerKey, mcpName);
        const mcp = this.entityStore.getMcp(mcpName);
        if (!mcp) return;

        const {sourceHandle, targetHandle} = this.mcpHandles(mcp.side);
        this.addEdge(ownerKey, mcp.name, sourceHandle, targetHandle);
    }

    private isMcpNode(nodeId: string): boolean {
        return this.nodes().find(n => n.id === nodeId)?.data?.().type === 'mcp';
    }

    private mcpHandles(side: 'left' | 'right'): {sourceHandle: string; targetHandle: string} {
        return side === 'left'
            ? {sourceHandle: 's-left', targetHandle: 't-right'}
            : {sourceHandle: 's-right', targetHandle: 't-left'};
    }

    private deferEdge(parentSessionId: string, edge: DeferredEdge): void {
        const bucket = this.deferredEdges.get(parentSessionId);
        if (bucket) bucket.push(edge);
        else this.deferredEdges.set(parentSessionId, [edge]);
    }

    private flushDeferredEdges(groupKey: string): void {
        for (const [parentSessionId, deferred] of this.deferredEdges) {
            if (this.entityStore.resolveGroupKey(parentSessionId) !== groupKey) continue;
            this.deferredEdges.delete(parentSessionId);
            for (const edge of deferred) {
                if (edge.target === groupKey) continue;
                if (this.isMcpNode(edge.target)) {
                    this.connectMcp(groupKey, edge.target);
                } else {
                    this.addEdge(groupKey, edge.target, 's-bottom', 't-top');
                }
            }
        }
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

    private filterNodes(nodes: ComponentNode[]): ComponentNode[] {
        const visible = this.presentation.visibleNodeIds();
        if (!visible) return nodes;
        return nodes.filter(n => visible.has(n.id));
    }

    private filterEdges(edges: Edge[]): Edge[] {
        const visible = this.presentation.visibleNodeIds();
        if (!visible) return edges;
        return edges.filter(e => visible.has(e.source) && visible.has(e.target));
    }
}
