import { Component } from '@angular/core';
import {CustomNodeComponent, HandleComponent} from 'ngx-vflow';
import {MCP, Tool} from "@agentspyglass/core";
import {NodeData} from "../../../model/definitions";
import {TextContainerComponent} from "../../text-container.component";
import {NameCasePipe} from "../../../pipe/namecase.pipe";

@Component({
    selector: 'mcp-node',
    standalone: true,
    templateUrl: './mcp.node.html',
    imports: [
        HandleComponent,
        TextContainerComponent,
        NameCasePipe
    ]
})
export class McpNode extends CustomNodeComponent<NodeData> {

    getData() {
        return (this.data() ?? {}) as NodeData
    }

    getTo() {
        return (this.getData().to ?? {}) as MCP
    }

    generateToolMessage(tool: Tool) {
        return `<span class="font-medium ${this.getColor(tool)}">${tool.name}</span> <span class="text-xs font-light ${this.getColor(tool)}">${JSON.stringify(tool.input)}</span>`
    }

    getColor(tool: Tool) {
        if (tool.status == 'completed') return 'text-gray-600';
        return 'text-text';
    }
}