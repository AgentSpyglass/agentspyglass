import {ChangeDetectionStrategy, Component} from '@angular/core';
import {CustomNodeComponent, HandleComponent} from 'ngx-vflow';
import {Agent} from "@agentspyglass/core";
import {NodeData} from "../../../model/definitions";
import {LowerCasePipe} from "@angular/common";
import {TextContainerComponent} from "../../text-container.component";
import {NameCasePipe} from "../../../pipe/namecase.pipe";

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

    getData() {
        return (this.data() ?? {}) as NodeData
    }

    getFrom() {
        return (this.getData().from ?? {}) as Agent
    }

    decorateAgent() {

    }
}