import { Agent, AgentEvent, ToolEvent, StatusEvent, TodoEvent, TokenBreakdown } from '@agentspyglass/core';

export type NodeType = 'agent' | 'mcp' | 'info';

export type NodeData = {
    type: NodeType;
    entityId?: string;
    content?: string;
    inModal?: boolean;
    mcpSide?: 'left' | 'right';
    focused?: boolean;
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
    type: 'agent' | 'tool';
    nodeId: string | null;
    timestamp: number;
    data: AgentEvent | ToolEvent;
}
