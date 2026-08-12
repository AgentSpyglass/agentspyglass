import {computed, Injectable, signal} from "@angular/core";
import {Agent, MCP} from "@agentspyglass/core";

@Injectable({providedIn: 'root'})
export class EntityStoreService {
    private readonly agents = signal<Map<string, Agent>>(new Map());
    private readonly mcps = signal<Map<string, MCP>>(new Map());

    readonly agentList = computed(() => Array.from(this.agents().values()));
    readonly mcpList = computed(() => Array.from(this.mcps().values()));

    getAgent(sessionId: string): Agent | undefined {
        return this.agents().get(sessionId);
    }

    getMcp(name: string): MCP | undefined {
        return this.mcps().get(name);
    }

    upsertAgent(agent: Agent): void {
        this.agents.update(map => {
            const next = new Map(map);
            next.set(agent.sessionId, agent);
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

    findPrimaryAgent(): Agent | undefined {
        return this.agentList().find(a => a.role === 'primary');
    }
}
