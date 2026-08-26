import {Injectable, computed, signal} from '@angular/core';
import {Agent, MCP} from '@agentspyglass/core';

type AgentGroup = {
    identity: string;
    sessions: string[];
};

@Injectable({providedIn: 'root'})
export class EntityStoreService {
    private readonly agents = signal<Map<string, Agent>>(new Map());
    private readonly mcps = signal<Map<string, MCP>>(new Map());
    private readonly mcpsBySession = signal<Map<string, Set<string>>>(new Map());
    private readonly sessionToGroup = signal<Map<string, string>>(new Map());

    readonly agentList = computed(() => Array.from(this.agents().values()));

    readonly agentGroups = computed((): AgentGroup[] => {
        const groups = new Map<string, AgentGroup>();
        for (const agent of this.agents().values()) {
            const key = this.resolveGroupKey(agent.sessionId) ?? agent.sessionId;
            if (!groups.has(key)) {
                groups.set(key, {identity: agent.name, sessions: []});
            }
            const group = groups.get(key)!;
            if (!group.sessions.includes(agent.sessionId)) {
                group.sessions.push(agent.sessionId);
            }
        }
        return Array.from(groups.values());
    });

    upsertAgent(agent: Agent): void {
        this.agents.update(map => {
            const next = new Map(map);
            next.set(agent.sessionId, agent);
            return next;
        });
        if (!this.sessionToGroup().has(agent.sessionId)) {
            this.sessionToGroup.update(map => {
                const next = new Map(map);
                next.set(agent.sessionId, agent.sessionId);
                return next;
            });
        }
    }

    getAgent(sessionId: string): Agent | undefined {
        return this.agents().get(sessionId);
    }

    resolveGroupKey(sessionId: string): string | undefined {
        return this.sessionToGroup().get(sessionId);
    }

    upsertMcp(mcp: MCP): void {
        this.mcps.update(map => {
            const next = new Map(map);
            next.set(mcp.name, mcp);
            return next;
        });
    }

    getMcp(name: string): MCP | undefined {
        return this.mcps().get(name);
    }

    associateMcp(sessionId: string, mcpName: string): void {
        this.mcpsBySession.update(map => {
            const next = new Map(map);
            if (!next.has(sessionId)) {
                next.set(sessionId, new Set());
            }
            next.get(sessionId)!.add(mcpName);
            return next;
        });
    }

    getMcpNamesFor(sessionId: string): string[] {
        return Array.from(this.mcpsBySession().get(sessionId) ?? []);
    }

    isSubagent(sessionId: string): boolean {
        const agent = this.getAgent(sessionId);
        return !!agent?.targetSessionId;
    }
}
