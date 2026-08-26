import { Agent, AgentEvent, ToolEvent, StatusEvent, TodoEvent, TokenBreakdown } from '@agentspyglass/core';

export type NodeType = 'agent' | 'mcp' | 'info';

export type NodeData = {
    type: NodeType;
    entityId?: string;
    content?: string;
    inModal?: boolean;
    mcpSide?: 'left' | 'right';
}

export const USER_AGENT: Agent = {
    sessionId: 'user',
    role: 'primary',
    name: 'User',
    model: 'Human',
    brand: {
        name: 'User',
        logo: 'assets/user.svg',
    },
}

export type StatusData = {
    cost: number;
    contextUsed: number;
    tokenBreakdown?: TokenBreakdown;
}

export type PresentationEvent = {
    type: 'agent' | 'tool' | 'status' | 'todo';
    nodeId: string | null;
    view: 'macro' | 'micro';
    timestamp: number;
    /** Whether this event advances the slide index. Agent = always, tool = new MCP only, status/todo = never. */
    isSlide: boolean;
    data: AgentEvent | ToolEvent | StatusEvent | TodoEvent;
}
