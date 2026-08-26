import {AgentEvent, ToolEvent, StatusEvent, TodoEvent} from '@agentspyglass/core';

export type StatusData = {
    cost: number;
    contextUsed: number;
    tokenBreakdown?: {
        input: number;
        output: number;
        cacheRead?: number;
        cacheCreation?: number;
    };
};

export type NodeData = {
    type: 'agent' | 'mcp' | 'info';
    entityId: string;
    inModal?: boolean;
    mcpSide?: 'left' | 'right';
};

export type NodeType = 'agent' | 'mcp' | 'info';

export const USER_AGENT = {
    sessionId: 'user',
    name: 'User',
    role: 'user' as const,
    model: 'user',
    brand: {name: 'User', logoUrl: ''},
};

export type PresentationEvent = {
    type: 'agent' | 'tool' | 'status' | 'todo';
    nodeId: string | null;
    view: 'macro' | 'micro';
    timestamp: number;
    data: AgentEvent | ToolEvent | StatusEvent | TodoEvent;
};
