import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {CustomNodeComponent, HandleComponent} from 'ngx-vflow';
import {Tool} from "@agentspyglass/core";
import {NodeData} from "../../../model/definitions";
import {TextContainerComponent} from "../../text-container.component";
import {NameCasePipe} from "../../../pipe/namecase.pipe";
import {EntityStoreService} from "../../../service/entity-store.service";
import {DefaultImageDirective} from "../../../directive/default-image.directive";

@Component({
    selector: 'mcp-node',
    standalone: true,
    templateUrl: './mcp.node.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        HandleComponent,
        TextContainerComponent,
        NameCasePipe,
        DefaultImageDirective
    ]
})
export class McpNode extends CustomNodeComponent<NodeData> {
    private entityStore = inject(EntityStoreService);

    mcp = computed(() => {
        const data = this.data();
        if (!data?.entityId) return undefined;
        return this.entityStore.getMcp(data.entityId);
    });

    generateToolMessage(tool: Tool) {
        return `<span class="font-medium ${this.getColor(tool)}">${tool.name}</span> <span class="text-xs font-light ${this.getColor(tool)}">${JSON.stringify(tool.input)}</span>`
    }

    getColor(tool: Tool) {
        if (tool.status == 'completed') return 'text-gray-600';
        return 'text-text';
    }
}
