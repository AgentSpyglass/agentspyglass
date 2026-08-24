import {Component, ElementRef, computed, effect, inject, viewChild} from '@angular/core';
import {HugeiconsIconComponent} from "@hugeicons/angular";
import {ArrowDown01Icon, Cancel01Icon, Coins01Icon, CpuIcon, WorkflowSquareIcon} from "@hugeicons/core-free-icons";
import {MCP, Tool} from "@agentspyglass/core";
import {AgentModalService} from "../../service/agent-modal.service";
import {EntityStoreService} from "../../service/entity-store.service";
import {GsapAnimationService} from "../../service/gsap-animation.service";
import {USER_AGENT} from "../../model/definitions";
import {LowerCasePipe} from "@angular/common";
import {NameCasePipe} from "../../pipe/namecase.pipe";
import {CompactNumberPipe} from "../../pipe/compact-number.pipe";
import {DefaultImageDirective} from "../../directive/default-image.directive";

@Component({
    selector: 'agent-modal',
    standalone: true,
    templateUrl: './agent-modal.component.html',
    imports: [
        HugeiconsIconComponent,
        LowerCasePipe,
        NameCasePipe,
        CompactNumberPipe,
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

    constructor() {
        effect(() => {
            if (!this.modal.activeAgentId()) return;

            const overlay = this.overlayEl()?.nativeElement;
            const panel = this.panelEl()?.nativeElement;
            if (overlay) this.gsap.fadeIn(overlay, {duration: 0.15});
            if (panel) this.gsap.entrance([panel], {y: 16, duration: 0.3});
        });
    }

    readonly activeAgentId = this.modal.activeAgentId;

    agent = computed(() => {
        const id = this.activeAgentId();
        if (!id) return undefined;
        return this.entityStore.getAgent(id);
    });

    /** Top card: the user above a primary agent, or the parent agent of a subagent. */
    topCard = computed(() => {
        const agent = this.agent();
        if (!agent) return undefined;
        if (agent.role === 'primary') return USER_AGENT;
        return agent.targetSessionId ? this.entityStore.getAgent(agent.targetSessionId) : undefined;
    });

    topCardIsUser = computed(() => this.topCard()?.sessionId === USER_AGENT.sessionId);

    mcps = computed<MCP[]>(() => {
        const id = this.activeAgentId();
        if (!id) return [];
        return this.entityStore.getMcpNamesFor(id)
            .map(name => this.entityStore.getMcp(name))
            .filter((mcp): mcp is MCP => mcp !== undefined);
    });

    subagents = computed(() => {
        const id = this.activeAgentId();
        if (!id) return [];
        return this.entityStore.agentList().filter(a => a.targetSessionId === id);
    });

    close(): void {
        this.modal.close();
    }

    toolColor(tool: Tool): string {
        return tool.status === 'completed' ? 'text-gray-600' : 'text-text';
    }

    protected readonly Cancel01Icon = Cancel01Icon;
    protected readonly WorkflowSquareIcon = WorkflowSquareIcon;
    protected readonly ArrowDown01Icon = ArrowDown01Icon;
    protected readonly Coins01Icon = Coins01Icon;
    protected readonly CpuIcon = CpuIcon;
}
