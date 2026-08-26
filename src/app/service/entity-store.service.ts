import {computed, Injectable, signal} from "@angular/core";
import {Agent, MCP} from "@agentspyglass/core";

const identityKey = (agent: Pick<Agent, 'brand' | 'name' | 'model'>): string =>
    `${agent.brand?.name ?? ''}|${agent.name}|${agent.model}`;

@Injectable({providedIn: 'root'})
export class EntityStoreService {
    private readonly agents = signal<Map<string, Agent>>(new Map());
    private readonly mcps = signal<Map<string, MCP>>(new Map());
    private readonly mcpsBySession = signal<Map<string, Set<string>>>(new Map());

    readonly agentList = computed(() => Array.from(this.agents().values()));

    private readonly agentGroups = computed(() => {
        const groups = new Map<string, Agent[]>();
        for (const agent of this.agentList()) {
            const key = identityKey(agent);
            const bucket = groups.get(key);
            if (bucket) bucket.push(agent);
            else groups.set(key, [agent]);
        }
        return groups;
    });

    getAgent(sessionId: string): Agent | undefined {
        return this.agents().get(sessionId);
    }

    getMcp(name: string): MCP | undefined {
        return this.mcps().get(name);
    }

    resolveGroupKey(sessionId: string): string | undefined {
        const agent = this.agents().get(sessionId);
        return agent ? identityKey(agent) : undefined;
    }

    getSessions(groupKey: string): Agent[] {
        return this.agentGroups().get(groupKey) ?? [];
    }

    upsertAgent(agent: Agent): void {
        this.agents.update(map => {
            const previous = map.get(agent.sessionId);
            const next = new Map(map);
            next.set(agent.sessionId, {
                ...agent,
                cost: (previous?.cost ?? 0) + (agent.cost ?? 0),
                tokens: (previous?.tokens ?? 0) + (agent.tokens ?? 0),
            });
            return next;
        });
    }

    upsertMcp(mcp: MCP): void {
        this.mcps.update(map => {
            const next = new Map(map);
            next.set(mcp.name, mcp);
            return next;
        });
    }

    associateMcp(sessionId: string, mcpName: string): void {
        this.mcpsBySession.update(map => {
            const existing = map.get(sessionId);
            if (existing?.has(mcpName)) return map;
            const next = new Map(map);
            next.set(sessionId, new Set(existing).add(mcpName));
            return next;
        });
    }

    getMcpNamesFor(sessionId: string): string[] {
        return Array.from(this.mcpsBySession().get(sessionId) ?? []);
    }

    findPrimaryAgent(): Agent | undefined {
        return this.agentList().find(a => a.role === 'primary');
    }

    isSubagent(sessionId: string): boolean {
        const agent = this.agents().get(sessionId);
        return !!agent && (agent.role === 'subagent' || !!agent.targetSessionId);
    }
}
