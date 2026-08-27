import {ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, untracked, viewChild, WritableSignal} from '@angular/core';
import {LowerCasePipe} from "@angular/common";
import {ComponentNode, Edge, VflowComponent} from 'ngx-vflow';
import {HugeiconsIconComponent} from "@hugeicons/angular";
import {Cancel01Icon} from "@hugeicons/core-free-icons";
import {AgentModalService} from "../../service/agent-modal.service";
import {EntityStoreService} from "../../service/entity-store.service";
import {GsapAnimationService} from "../../service/gsap-animation.service";
import {PresentationService} from "../../service/presentation.service";
import {NodeData, USER_AGENT} from "../../model/definitions";
import {resolveNodeComponent} from "../node/node-types";
import {layoutMicroGraph, MicroLayoutOptions} from "../../layout/graph-layout";
import {NameCasePipe} from "../../pipe/namecase.pipe";
import {DefaultImageDirective} from "../../directive/default-image.directive";
import gsap from 'gsap';

const MICRO_LAYOUT: MicroLayoutOptions = {
    origin: {x: 0, y: 0},
    layerGap: 220,
    rowGap: 220,
    colGap: 440,
    maxPerRow: 5,
};

@Component({
    selector: 'agent-modal',
    standalone: true,
    templateUrl: './agent-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        HugeiconsIconComponent,
        VflowComponent,
        NameCasePipe,
        LowerCasePipe,
        DefaultImageDirective
    ],
    host: {
        '(document:keydown.escape)': 'close()'
    }
})
export class AgentModalComponent {
    private modal = inject(AgentModalService);
    private entityStore = inject(EntityStoreService);
    private gsap = inject(GsapAnimationService);
    private presentation = inject(PresentationService);
    private hostEl = inject<ElementRef<HTMLElement>>(ElementRef);

    readonly open = this.modal.isOpen;

    private overlayEl = viewChild<ElementRef<HTMLElement>>('overlay');
    private panelEl = viewChild<ElementRef<HTMLElement>>('panel');
    private vflow = viewChild(VflowComponent);
    private vflowEl = viewChild('vflow', {read: ElementRef<HTMLElement>});

    private skipNextFitView = false;

    readonly nodes: WritableSignal<ComponentNode[]> = signal([]);
    readonly edges: WritableSignal<Edge[]> = signal([]);

    readonly visibleNodes = computed(() => this.filterNodes(this.nodes()));
    readonly visibleEdges = computed(() => this.filterEdges(this.edges()));

    readonly activeAgentId = this.modal.activeAgentId;

    agent = computed(() => {
        const id = this.activeAgentId();
        if (!id) return undefined;
        return this.entityStore.getAgent(id);
    });

    constructor() {
        effect(() => {
            const id = this.modal.activeAgentId();

            if (!id) {
                this.nodes.set([]);
                this.edges.set([]);
                return;
            }

            untracked(() => this.rebuildGraph(id));
        });

        effect(() => {
            const overlay = this.overlayEl()?.nativeElement;
            const panel = this.panelEl()?.nativeElement;
            if (!overlay || !panel) return;

            this.gsap.fadeIn(overlay, {duration: 0.15});
            this.gsap.entrance([panel], {y: 16, duration: 0.3});
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

    close(): void {
        this.modal.close();
    }

    /** Center the modal's viewport on the node with the given id (waits for the node, then smooth). */
    focusNode(nodeId: string): void {
        if (!this.open()) return;

        this.skipNextFitView = true;
        let attempts = 0;
        const step = () => {
            const vflow = this.vflow();
            if (vflow?.getNode(nodeId)) {
                this.animateTo(vflow, nodeId);
                return;
            }
            if (attempts++ < 60) requestAnimationFrame(step);
        };
        step();
    }

    private animateTo(vflow: VflowComponent, nodeId: string): void {
        const node = vflow.getNode(nodeId);
        if (!node) return;
        const point = node.point();
        const rect = this.vflowEl()?.nativeElement.getBoundingClientRect()
            ?? this.hostEl.nativeElement.getBoundingClientRect();
        const width = rect.width || 800;
        const height = rect.height || 600;
        const nodeWidth = (node as { width?: WritableSignal<number> }).width?.() ?? 100;
        const nodeHeight = (node as { height?: WritableSignal<number> }).height?.() ?? 100;
        const targetZoom = 0.8;
        const target = {
            x: width / 2 - (point.x + nodeWidth / 2) * targetZoom,
            y: height / 2 - (point.y + nodeHeight / 2) * targetZoom,
        };
        const vp = vflow.viewport();
        const proxy = {x: vp.x, y: vp.y, zoom: vp.zoom};
        gsap.to(proxy, {
            x: target.x,
            y: target.y,
            zoom: targetZoom,
            duration: 0.3,
            ease: 'power2.out',
            onUpdate: () => vflow.viewportTo({x: proxy.x, y: proxy.y, zoom: proxy.zoom}),
        });
    }

    private rebuildGraph(activeId: string): void {
        const agent = this.entityStore.getAgent(activeId);
        const parentId = agent?.targetSessionId;
        const topId = parentId ? `parent-${parentId}` : 'user';

        const nodeList: ComponentNode[] = [{
            id: topId,
            type: resolveNodeComponent('agent'),
            point: signal({x: 0, y: 0}),
            data: signal({
                type: 'agent',
                entityId: parentId ?? USER_AGENT.sessionId,
                inModal: true,
            } satisfies NodeData),
        }];

        const edgeList: Edge[] = [];
        const seen = new Set<string>();
        const connect = (source: string, target: string): void => {
            const key = `${source}->${target}`;
            if (seen.has(key)) return;
            seen.add(key);
            edgeList.push({id: key, source, target, sourceHandle: 's-bottom', targetHandle: 't-top'});
        };

        if (agent) {
            nodeList.push({
                id: agent.sessionId,
                type: resolveNodeComponent('agent'),
                point: signal({x: 0, y: MICRO_LAYOUT.layerGap}),
                data: signal({type: 'agent', entityId: agent.sessionId, inModal: true} satisfies NodeData),
            });
            connect(topId, agent.sessionId);

            for (const name of this.entityStore.getMcpNamesFor(agent.sessionId)) {
                if (!this.entityStore.getMcp(name)) continue;
                nodeList.push({
                    id: name,
                    type: resolveNodeComponent('mcp'),
                    point: signal({x: 0, y: MICRO_LAYOUT.layerGap * 2}),
                    data: signal({type: 'mcp', entityId: name, inModal: true, mcpSide: 'left'} satisfies NodeData),
                });
                connect(agent.sessionId, name);
            }

            for (const sub of this.entityStore.agentList()) {
                if (sub.targetSessionId !== agent.sessionId) continue;
                nodeList.push({
                    id: sub.sessionId,
                    type: resolveNodeComponent('agent'),
                    point: signal({x: 0, y: MICRO_LAYOUT.layerGap * 2}),
                    data: signal({type: 'agent', entityId: sub.sessionId, inModal: true} satisfies NodeData),
                });
                connect(agent.sessionId, sub.sessionId);
            }
        }

        const positions = layoutMicroGraph(nodeList, MICRO_LAYOUT);
        for (const node of nodeList) {
            const point = positions.get(node.id);
            if (point) node.point.set(point);
        }

        this.nodes.set(nodeList);
        this.edges.set(edgeList);
        this.scheduleFitView(agent?.sessionId ?? null);
    }

    private scheduleFitView(openedFor: string | null): void {
        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (this.skipNextFitView) {
                this.skipNextFitView = false;
                return;
            }
            if (this.modal.activeAgentId() === null) return;
            if (openedFor !== null && openedFor !== this.modal.activeAgentId()) return;
            this.vflow()?.fitView({padding: 0.2, duration: 200});
        }));
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

    protected readonly Cancel01Icon = Cancel01Icon;
}
