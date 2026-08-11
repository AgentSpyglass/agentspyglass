import {AfterViewInit, Component, computed, effect, inject, signal, ViewChild} from "@angular/core";
import {BridgeService} from "./service/bridge.service";
import {HugeiconsIconComponent} from "@hugeicons/angular";
import {BinocularsIcon, Expand, Telescope01Icon, ZoomIn, ZoomOut} from "@hugeicons/core-free-icons";
import {FlowComponent} from "./component/flow.component";
import {BrandService} from "./service/brand.service";
import {MCP, Todo, Tool} from "@agentspyglass/core";
import {TodoComponent} from "./component/todo/todo.component";

@Component({
  selector: "app-root",
    imports: [
        HugeiconsIconComponent,
        FlowComponent,
        TodoComponent
    ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent  implements AfterViewInit {
    @ViewChild(FlowComponent) flow!: FlowComponent;
    bridge = inject(BridgeService);
    brand = inject(BrandService);

    todoList = signal<Todo[]>([]);
    mcps = new Map<string, MCP>();

    readonly atMaxZoom = computed(() => (this.flow?.viewport()?.zoom ?? 0) >= 1.5);
    readonly atMinZoom = computed(() => (this.flow?.viewport()?.zoom ?? 0) <= 0.1);

    constructor() {
        this.bridge.connect();
        effect(() => {
            this.bridge.agentEvent.subscribe(agentEvent => {
                this.flow.addAgent({
                    role: agentEvent.role,
                    name: agentEvent.name,
                    prompt: agentEvent.prompt,
                    sessionId: agentEvent.sessionId,
                    brand: this.brand.resolveBrand(
                        agentEvent.model,
                        agentEvent.provider
                    ),
                });
            });

            this.bridge.toolEvent.subscribe(toolEvent => {
                const name = toolEvent.name.split("_")[0];
                let mcp = this.mcps.get(name);
                if (!mcp) {
                    mcp = {
                        name,
                        brand: this.brand.resolveMcpBrand(name),
                        tools: []
                    };
                }

                const tool = toolEvent as Tool;
                const existingIndex = mcp.tools.findIndex(t => t.callId === tool.callId);
                if (existingIndex !== -1) {
                    mcp.tools[existingIndex] = tool;
                } else {
                    mcp.tools.push(tool);
                    if (mcp.tools.length > 3) {
                        mcp.tools.shift();
                    }
                }

                this.mcps.set(name, mcp);
                this.flow.addMcp(toolEvent.sessionId, mcp);
            });

            this.bridge.messageEvent.subscribe(messageEvent => {
                this.flow.addMessage(messageEvent.sessionId, messageEvent.content);
            });
        });
    }

    ngAfterViewInit() {}

    fitView(): void {
        this.flow.fitView();
    }

    zoomIn(): void {
        this.flow.zoomIn();
    }

    zoomOut(): void {
        this.flow.zoomOut();
    }

    protected readonly BinocularsIcon = BinocularsIcon;
    protected readonly ZoomIn = ZoomIn;
    protected readonly ZoomOut = ZoomOut;
    protected readonly Expand = Expand;
    protected readonly Telescope01Icon = Telescope01Icon;
}
