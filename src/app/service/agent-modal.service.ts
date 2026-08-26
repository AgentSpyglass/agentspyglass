import {Injectable, signal} from "@angular/core";

@Injectable({providedIn: 'root'})
export class AgentModalService {
    readonly activeAgentId = signal<string | null>(null);

    open(id: string): void {
        this.activeAgentId.set(id);
    }

    close(): void {
        this.activeAgentId.set(null);
    }
}
