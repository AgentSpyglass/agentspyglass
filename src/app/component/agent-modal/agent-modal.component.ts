import {ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, untracked, viewChild, WritableSignal} from '@angular/core';
import {LowerCasePipe} from "@angular/common";
import {ComponentNode, Edge, VflowComponent} from 'ngx-vflow';
import {HugeiconsIconComponent} from "@hugeicons/angular";
import {Cancel01Icon} from "@hugeicons/core-free-icons";
import {AgentModalService} from "../../service/agent-modal.service";
import {EntityStoreService} from "../../service/entity-store.service";
import {GsapAnimationService} from "../../service/gsap-animation.service";
import {NodeData, USER_AGENT} from "../../model/definitions";
import {resolveNodeComponent} from "../node/node-types";
import {layoutMicroGraph, MicroLayoutOptions} from "../../layout/graph-layout";
import {NameCasePipe} from "../../pipe/namecase.pipe";
import {DefaultImageDirective} from "../../directive/default-image.directive";

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

    private overlayEl = viewChild<ElementRef<HTMLElement>>('overlay');
    private panelEl = viewChild<ElementRef<HTMLElement>>('panel');
    private vflow = viewChild(VflowComponent);

    readonly nodes: WritableSignal<ComponentNode[]> = signal([]);
    readonly edges: WritableSignal<Edge[]> = signal([]);

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
    }

    close(): void {
        this.modal.close();
    }

    focusNode(nodeId: string): void {
        const attemptFocus = () => {
            const node = this.nodes().find(n => n.id === nodeId);
            if (!node) {
                requestAnimationFrame(attemptFocus);
                return;
            }

            const point = node.point();
            const vflowInstance = this.vflow();
            if (!vflowInstance) return;

            const viewport = vflowInstance.viewport();
            const centerX = 400;
            const centerY = 300;

            const x = centerX - point.x * viewport.zoom;
            const y = centerY - point.y * viewport.zoom;

            vflowInstance.panTo({x, y});
        };

        attemptFocus();
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
            if (this.modal.activeAgentId() === null) return;
            if (openedFor !== null && openedFor !== this.modal.activeAgentId()) return;
            this.vflow()?.fitView({padding: 0.2, duration: 200});
        }));
    }

    protected readonly Cancel01Icon = Cancel01Icon;
}
