export type NodeType = 'agent' | 'mcp' | 'message' | 'info';

export type NodeData = {
    type: NodeType;
    entityId?: string;
    content?: string;
    senderId?: string;
    receiverId?: string;
}
