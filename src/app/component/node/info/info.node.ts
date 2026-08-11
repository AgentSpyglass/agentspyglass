import { Component } from '@angular/core';
import {CustomNodeComponent, HandleComponent} from 'ngx-vflow';
import {NodeData} from "../../../model/definitions";

@Component({
    selector: 'info-node',
    standalone: true,
    templateUrl: './info.node.html',
    imports: [
        HandleComponent
    ]
})
export class InfoNode extends CustomNodeComponent<NodeData> {

    getData() {
        if (this.data()) return this.data() as NodeData

        return {} as NodeData
    }
}