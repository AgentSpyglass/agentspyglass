import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {CustomNodeComponent, HandleComponent} from 'ngx-vflow';
import {NodeData} from "../../../model/definitions";
import {LowerCasePipe} from "@angular/common";
import {NameCasePipe} from "../../../pipe/namecase.pipe";
import {EntityStoreService} from "../../../service/entity-store.service";
import {TextContainerComponent} from "../../text-container.component";
import {DefaultImageDirective} from "../../../directive/default-image.directive";

@Component({
    selector: 'message-node',
    standalone: true,
    templateUrl: './message.node.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        LowerCasePipe,
        HandleComponent,
        NameCasePipe,
        TextContainerComponent,
        DefaultImageDirective
    ]
})
export class MessageNode extends CustomNodeComponent<NodeData> {
    private entityStore = inject(EntityStoreService);

    sender = computed(() => {
        const data = this.data();
        if (!data?.senderId) return undefined;
        if (data.senderId == 'user') {
            return {
                sessionId: 'user',
                name: 'User',
                model: 'Human',
                brand: {
                    name: 'User',
                    logo: 'assets/user.svg',
                }
            }
        }

        return this.entityStore.getAgent(data.senderId);
    });

    receiver = computed(() => {
        const data = this.data();
        if (!data?.receiverId) return undefined;
        return this.entityStore.getAgent(data.receiverId);
    });

    content = computed(() => this.data()?.content ?? '');
}
