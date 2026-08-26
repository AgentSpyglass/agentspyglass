import {Injectable} from "@angular/core"
import {Event, AgentEvent, ToolEvent, StatusEvent, TodoEvent} from "@agentspyglass/core";
import {Subject} from "rxjs";

@Injectable({providedIn: "root"})
export class BridgeService {
    private socket?: WebSocket

    agentEvent = new Subject<AgentEvent>();
    toolEvent = new Subject<ToolEvent>();
    statusEvent = new Subject<StatusEvent>();
    todoEvent = new Subject<TodoEvent>();

    connect(url = "ws://127.0.0.1:51763") {
        if (this.socket) return
        this.socket = new WebSocket(url)
        this.socket.onmessage = (msg) => {
            const event = JSON.parse(msg.data) as Event
            switch (event.type) {
                case 'agent':
                    this.agentEvent.next(event as AgentEvent);
                    break;
                case 'tool':
                    this.toolEvent.next(event as ToolEvent);
                    break;
                case 'status':
                    this.statusEvent.next(event as StatusEvent);
                    break;
                case 'todo':
                    this.todoEvent.next(event as TodoEvent);
                    break;
            }
        }

        this.socket.onclose = () => {
            this.socket = undefined
            setTimeout(() => this.connect(url), 1000)
        }
    }
}
