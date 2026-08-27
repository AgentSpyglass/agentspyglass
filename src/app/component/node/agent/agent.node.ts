import {ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, viewChild} from '@angular/core';
import {CustomNodeComponent, HandleComponent} from 'ngx-vflow';
import {Agent} from '@agentspyglass/core';
import {NodeData, USER_AGENT} from "../../../model/definitions";
import {LowerCasePipe, SlicePipe} from "@angular/common";
import {NameCasePipe} from "../../../pipe/namecase.pipe";
import {CompactNumberPipe} from "../../../pipe/compact-number.pipe";
import {EntityStoreService} from "../../../service/entity-store.service";
import {AgentModalService} from "../../../service/agent-modal.service";
import {PresentationService} from "../../../service/presentation.service";
import {HugeiconsIconComponent} from "@hugeicons/angular";
import {ArrowExpandDiagonal01Icon, Coins01Icon, CpuIcon} from "@hugeicons/core-free-icons";
import {DefaultImageDirective} from "../../../directive/default-image.directive";
import gsap from 'gsap';

@Component({
    selector: 'agent-node',
    standalone: true,
    templateUrl: './agent.node.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        LowerCasePipe,
        SlicePipe,
        HandleComponent,
        NameCasePipe,
        CompactNumberPipe,
        HugeiconsIconComponent,
        DefaultImageDirective
    ]
})
export class AgentNode extends CustomNodeComponent<NodeData> {
    private entityStore = inject(EntityStoreService);
    private modal = inject(AgentModalService);
    private presentation = inject(PresentationService);
    private destroyRef = inject(DestroyRef);
    private contentEl = viewChild<ElementRef<HTMLElement>>('content');

    readonly sessions = computed<Agent[]>(() => {
        const data = this.data();
        const id = data?.entityId;
        if (!id) return [];
        if (id === USER_AGENT.sessionId) return [USER_AGENT];
        if (data.inModal === true) {
            const agent = this.entityStore.getAgent(id);
            return agent ? [agent] : [];
        }
        return this.entityStore.getSessions(id);
    });

    agent = computed(() => this.sessions()[0]);
    isSubagent = computed(() => this.agent()?.role === 'subagent');
    isUser = computed(() => this.agent()?.sessionId === USER_AGENT.sessionId);
    inModal = computed(() => this.data()?.inModal === true);
    focused = computed(() => this.presentation.enabled() && this.data()?.focused === true);

    readonly totalCost = computed(() => this.sessions().reduce((sum, s) => sum + (s.cost ?? 0), 0));
    readonly totalTokens = computed(() => this.sessions().reduce((sum, s) => sum + (s.tokens ?? 0), 0));

    private pulse?: gsap.core.Timeline;

    constructor() {
        super();

        effect(() => {
            const el = this.contentEl()?.nativeElement;
            if (!el) return;

            if (this.focused()) {
                this.pulse?.kill();
                gsap.set(el, {transformOrigin: 'center center'});
                this.pulse = gsap.timeline({repeat: -1, yoyo: true})
                    .to(el, {scale: 1.05, duration: 0.6, ease: 'power1.inOut'})
                    .to(el, {scale: 1, duration: 0.6, ease: 'power1.inOut'});
            } else {
                this.pulse?.kill();
                this.pulse = undefined;
                gsap.to(el, {scale: 1, duration: 0.2, ease: 'power2.out'});
            }
        });

        this.destroyRef.onDestroy(() => this.pulse?.kill());
    }

    openModal(sessionId?: string): void {
        if (this.isUser() || this.inModal()) return;
        const target = sessionId ?? this.sessions()[0]?.sessionId;
        if (target) this.modal.open(target);
    }

    protected readonly Coins01Icon = Coins01Icon;
    protected readonly CpuIcon = CpuIcon;
    protected readonly ArrowExpandDiagonal01Icon = ArrowExpandDiagonal01Icon;
}
