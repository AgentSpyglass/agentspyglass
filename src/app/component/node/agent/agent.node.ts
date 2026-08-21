import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {CustomNodeComponent, HandleComponent} from 'ngx-vflow';
import {NodeData} from "../../../model/definitions";
import {LowerCasePipe} from "@angular/common";
import {TextContainerComponent} from "../../text-container.component";
import {NameCasePipe} from "../../../pipe/namecase.pipe";
import {CompactNumberPipe} from "../../../pipe/compact-number.pipe";
import {EntityStoreService} from "../../../service/entity-store.service";
import {HugeiconsIconComponent} from "@hugeicons/angular";
import {Coins01Icon, CpuIcon} from "@hugeicons/core-free-icons";
import {DefaultImageDirective} from "../../../directive/default-image.directive";

@Component({
    selector: 'agent-node',
    standalone: true,
    templateUrl: './agent.node.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        LowerCasePipe,
        HandleComponent,
        TextContainerComponent,
        NameCasePipe,
        CompactNumberPipe,
        HugeiconsIconComponent,
        DefaultImageDirective
    ]
})
export class AgentNode extends CustomNodeComponent<NodeData> {
    private entityStore = inject(EntityStoreService);

    agent = computed(() => {
        const data = this.data();
        if (!data?.entityId) return undefined;
        return this.entityStore.getAgent(data.entityId);
    });

    protected readonly Coins01Icon = Coins01Icon;
    protected readonly CpuIcon = CpuIcon;
}
