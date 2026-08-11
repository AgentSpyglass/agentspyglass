export type Agent = {
    sessionId: string;
    role: 'primary' | 'subagent';
    name: string;
    prompt: string;
    status?: 'reasoning' | 'completed';
    brand: Brand;
}

export type Tool = {
    callId: string;
    name: string;
    input: any;
    status: 'running' | 'completed';
}

export type MCP = {
    name: string;
    brand: Brand;
    tools: Tool[];
}

export type Brand = {
    logo: string | null;
    model: string;
    name: string;
}

export type NodeData = {
    from?: Agent | Tool | MCP | string | null;
    to?: Agent | Tool | MCP | null;
    content?: string;
}

export type Todo = {
    content: string;
    status: 'pending' | 'completed';
    priority: 'high' | 'medium' | 'low';
}
