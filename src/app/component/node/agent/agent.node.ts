import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {CustomNodeComponent, HandleComponent} from 'ngx-vflow';
import {NodeData} from "../../../model/definitions";
import {LowerCasePipe} from "@angular/common";
import {TextContainerComponent} from "../../text-container.component";
import {NameCasePipe} from "../../../pipe/namecase.pipe";
import {EntityStoreService} from "../../../service/entity-store.service";

@Component({
    selector: 'agent-node',
    standalone: true,
    templateUrl: './agent.node.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        LowerCasePipe,
        HandleComponent,
        TextContainerComponent,
        NameCasePipe
    ]
})
export class AgentNode extends CustomNodeComponent<NodeData> {
    private entityStore = inject(EntityStoreService);

    agent = computed(() => {
        const data = this.data();
        if (!data?.entityId) return undefined;
        return this.entityStore.getAgent(data.entityId);
    });
}
