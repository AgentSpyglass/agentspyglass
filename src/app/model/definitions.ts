import { Agent, TokenBreakdown } from '@agentspyglass/core';

export type NodeType = 'agent' | 'mcp' | 'info';

export type NodeData = {
    type: NodeType;
    entityId?: string;
    content?: string;
}

/** Synthetic user representation rendered as an agent node above primary agents. UI-only. */
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
