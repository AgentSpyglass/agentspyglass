import {AfterViewInit, Component, effect, inject, Injector, signal, ViewChild, DestroyRef} from "@angular/core";
import {BridgeService} from "./service/bridge.service";
import {HugeiconsIconComponent} from "@hugeicons/angular";
import {BinocularsIcon, Expand, Setting06Icon, Telescope01Icon, ZoomIn, ZoomOut} from "@hugeicons/core-free-icons";
import {FlowComponent} from "./component/flow.component";
import {BrandService} from "./service/brand.service";
import {MCP, Todo, Tool} from "@agentspyglass/core";
import {TodoComponent} from "./component/todo/todo.component";
import {EntityStoreService} from "./service/entity-store.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {SettingsComponent} from "./component/settings/settings.component";

@Component({
  selector: "app-root",
    imports: [
        HugeiconsIconComponent,
        FlowComponent,
        TodoComponent,
        SettingsComponent
    ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements AfterViewInit {
    @ViewChild(FlowComponent) flow!: FlowComponent;
    bridge = inject(BridgeService);
    brand = inject(BrandService);
    entityStore = inject(EntityStoreService);
    private destroyRef = inject(DestroyRef);

    todoList = signal<Todo[]>([]);
    usage = signal<{ tokens: number; cost: number; contextUsed: number } | null>(null);

    readonly atMaxZoom = signal(false);
    readonly atMinZoom = signal(false);

    settingsOpen = signal(false);

    constructor(private injector: Injector) {
        this.bridge.connect();

        this.bridge.agentEvent.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(agentEvent => {
            const agent = {
                role: agentEvent.role,
                name: agentEvent.name,
                prompt: agentEvent.prompt,
                sessionId: agentEvent.sessionId,
                model: agentEvent.model,
                brand: this.brand.resolveBrand(
                    agentEvent.model,
                    agentEvent.provider
                ),
            };
            this.entityStore.upsertAgent(agent);
            this.flow.addAgent(agent);
        });

        this.bridge.toolEvent.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(toolEvent => {
            const name = toolEvent.name.split("_")[0];
            let mcp = this.entityStore.getMcp(name);
            if (!mcp) {
                mcp = {
                    name,
                    brand: this.brand.resolveMcpBrand(name),
                    tools: []
                };
            }

            const tool: Tool = {
                callId: toolEvent.callId,
                name: toolEvent.name,
                input: toolEvent.input ?? {},
                status: toolEvent.status
            };

            const existingIndex = mcp.tools.findIndex(t => t.callId === tool.callId);
            if (existingIndex !== -1) {
                mcp.tools[existingIndex] = tool;
            } else {
                mcp.tools.push(tool);
                if (mcp.tools.length > 3) {
                    mcp.tools.shift();
                }
            }

            this.entityStore.upsertMcp(mcp);
            this.flow.addMcp(toolEvent.sessionId, mcp);
        });

        this.bridge.messageEvent.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(messageEvent => {
            this.flow.addMessage(messageEvent.sessionId, messageEvent.content);
        });

        this.bridge.usageEvent.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(usageEvent => {
            this.usage.set({
                tokens: usageEvent.tokens,
                cost: usageEvent.cost,
                contextUsed: usageEvent.contextUsed,
            });
        });
    }

    ngAfterViewInit() {
        effect(() => {
            const zoom = this.flow.currentViewport().zoom;
            this.atMaxZoom.set(zoom >= 1.5);
            this.atMinZoom.set(zoom <= 0.1);
        }, { injector: this.injector });
    }

    fitView(): void {
        this.flow.fitView();
    }

    zoomIn(): void {
        this.flow.zoomIn();
    }

    zoomOut(): void {
        this.flow.zoomOut();
    }

    toggleSettings(): void {
        this.settingsOpen.update(v => !v);
    }

    protected readonly BinocularsIcon = BinocularsIcon;
    protected readonly ZoomIn = ZoomIn;
    protected readonly ZoomOut = ZoomOut;
    protected readonly Expand = Expand;
    protected readonly Telescope01Icon = Telescope01Icon;
    protected readonly Setting06Icon = Setting06Icon;
}
