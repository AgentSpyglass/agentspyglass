import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {CustomNodeComponent, HandleComponent} from 'ngx-vflow';
import {NodeData, USER_AGENT} from "../../../model/definitions";
import {LowerCasePipe} from "@angular/common";
import {NameCasePipe} from "../../../pipe/namecase.pipe";
import {CompactNumberPipe} from "../../../pipe/compact-number.pipe";
import {EntityStoreService} from "../../../service/entity-store.service";
import {AgentModalService} from "../../../service/agent-modal.service";
import {HugeiconsIconComponent} from "@hugeicons/angular";
import {Coins01Icon, CpuIcon, FullScreenIcon} from "@hugeicons/core-free-icons";
import {DefaultImageDirective} from "../../../directive/default-image.directive";

@Component({
    selector: 'agent-node',
    standalone: true,
    templateUrl: './agent.node.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        LowerCasePipe,
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

    agent = computed(() => {
        const data = this.data();
        if (!data?.entityId) return undefined;
        if (data.entityId === USER_AGENT.sessionId) return USER_AGENT;
        return this.entityStore.getAgent(data.entityId);
    });
    isSubagent = computed(() => this.agent()?.role === 'subagent');
    isUser = computed(() => this.agent()?.sessionId === USER_AGENT.sessionId);

    openModal(): void {
        const id = this.data()?.entityId;
        if (id && !this.isUser()) this.modal.open(id);
    }

    protected readonly Coins01Icon = Coins01Icon;
    protected readonly CpuIcon = CpuIcon;
    protected readonly FullScreenIcon = FullScreenIcon;
}
