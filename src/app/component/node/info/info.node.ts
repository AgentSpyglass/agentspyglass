import {ChangeDetectionStrategy, Component, computed} from '@angular/core';
import {CustomNodeComponent, HandleComponent} from 'ngx-vflow';
import {NodeData} from "../../../model/definitions";

@Component({
    selector: 'info-node',
    standalone: true,
    templateUrl: './info.node.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        HandleComponent
    ]
})
export class InfoNode extends CustomNodeComponent<NodeData> {
    resolvedData = computed((): NodeData => this.data() ?? ({} as NodeData));
}
