import { Agent, Tool, MCP } from '@agentspyglass/core';

export type NodeData = {
    from?: Agent | Tool | MCP | string | null;
    to?: Agent | Tool | MCP | null;
    content?: string;
}
