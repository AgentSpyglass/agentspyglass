import { Component } from '@angular/core';
import {CustomNodeComponent, HandleComponent} from 'ngx-vflow';
import {Agent} from "@agentspyglass/core";
import {NodeData} from "../../../model/definitions";
import {LowerCasePipe} from "@angular/common";
import {NameCasePipe} from "../../../pipe/namecase.pipe";

@Component({
    selector: 'message-node',
    standalone: true,
    templateUrl: './message.node.html',
    imports: [
        LowerCasePipe,
        HandleComponent,
        NameCasePipe
    ]
})
export class MessageNode extends CustomNodeComponent<NodeData> {

    getData() {
        return (this.data() ?? {}) as NodeData
    }

    getFrom() {
        return (this.getData().from ?? {}) as Agent
    }

    getTo() {
        return (this.getData().to ?? {}) as Agent
    }
}