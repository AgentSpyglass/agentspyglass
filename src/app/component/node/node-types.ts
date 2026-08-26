import {NodeType} from "../../model/definitions";
import {InfoNode} from "./info/info.node";
import {AgentNode} from "./agent/agent.node";
import {McpNode} from "./mcp/mcp.node";

export function resolveNodeComponent(type: NodeType) {
    switch (type) {
        case 'agent':
            return AgentNode;
        case 'mcp':
            return McpNode;
    }

    return InfoNode;
}
