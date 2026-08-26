import {ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked, viewChild, WritableSignal} from "@angular/core";
import {ComponentNode, Edge, VflowComponent} from "ngx-vflow";
import {Agent, MCP} from "@agentspyglass/core";
import {NodeData, NodeType} from "../model/definitions";
import {resolveNodeComponent} from "./node/node-types";
import {EntityStoreService} from "../service/entity-store.service";
import {layoutMacroGraph, MacroLayoutOptions, MacroNodeKind} from "../layout/graph-layout";

type Point = { x: number; y: number };

type DeferredEdge = {
    target: string;
};

const PROVISIONAL_POINT: Point = {x: 650, y: 150};

const USER_NODE_PREFIX = "user-";

const MACRO_LAYOUT: MacroLayoutOptions = {
    origin: {x: 650, y: 150},
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

    private readonly deferredEdges = new Map<string, DeferredEdge[]>();

    readonly currentViewport = computed(() => this.vflow().viewport() ?? {zoom: 1, x: 0, y: 0});

    constructor() {
        effect(() => {
            const nodes = this.nodes();
            const edges = this.edges();
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
            const {sourceHandle, targetHandle} = this.mcpHandles(this.countMcpEdges(ownerKey));
            this.addEdge(ownerKey, mcp.name, sourceHandle, targetHandle);
        } else {
            this.deferEdge(from, {target: mcp.name});
        }
    }

    private isMcpNode(nodeId: string): boolean {
        return this.nodes().find(n => n.id === nodeId)?.data?.().type === 'mcp';
    }

    private countMcpEdges(groupKey: string): number {
        return this.edges().filter(e => e.source === groupKey && this.isMcpNode(e.target)).length;
    }

    private mcpHandles(index: number): {sourceHandle: string; targetHandle: string} {
        return index % 2 === 0
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
                    const {sourceHandle, targetHandle} = this.mcpHandles(this.countMcpEdges(groupKey));
                    this.addEdge(groupKey, edge.target, sourceHandle, targetHandle);
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
}
