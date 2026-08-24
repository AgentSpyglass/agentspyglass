import {computed, Injectable, signal} from "@angular/core";
import {Agent, MCP} from "@agentspyglass/core";

@Injectable({providedIn: 'root'})
export class EntityStoreService {
    private readonly agents = signal<Map<string, Agent>>(new Map());
    private readonly mcps = signal<Map<string, MCP>>(new Map());
    /** Session → MCP server names relation, recorded when an MCP first acts within a session. */
    private readonly mcpsBySession = signal<Map<string, Set<string>>>(new Map());

    readonly agentList = computed(() => Array.from(this.agents().values()));

    getAgent(sessionId: string): Agent | undefined {
        return this.agents().get(sessionId);
    }

    getMcp(name: string): MCP | undefined {
        return this.mcps().get(name);
    }

    upsertAgent(agent: Agent): void {
        this.agents.update(map => {
            // Event cost/tokens are incremental per step; accumulate onto existing totals.
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

    /** Idempotently links an MCP server to a session. */
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
}
