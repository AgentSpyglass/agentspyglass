import {NodeType} from "../../model/definitions";
import {InfoNode} from "./info/info.node";
import {AgentNode} from "./agent/agent.node";
import {McpNode} from "./mcp/mcp.node";

/** Maps a UI node kind to its ngx-vflow custom node component. Single source of truth. */
export function resolveNodeComponent(type: NodeType) {
    switch (type) {
        case 'agent':
            return AgentNode;
        case 'mcp':
            return McpNode;
    }

    return InfoNode;
}
