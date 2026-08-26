import {AfterViewInit, Component, DestroyRef, effect, inject, Injector, signal, ViewChild} from "@angular/core";
import {BridgeService} from "./service/bridge.service";
import {HugeiconsIconComponent} from "@hugeicons/angular";
import {ArrowExpandIcon, SearchAddIcon, SearchMinusIcon, Telescope01Icon} from "@hugeicons/core-free-icons";
import {FlowComponent} from "./component/flow.component";
import {BrandService} from "./service/brand.service";
import {AgentEvent, Todo, ToolEvent, StatusEvent, TodoEvent} from "@agentspyglass/core";
import {SessionInfoComponent} from "./component/session-info/session-info.component";
import {EntityStoreService} from "./service/entity-store.service";
import {AgentModalComponent} from "./component/agent-modal/agent-modal.component";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {StatusData, PresentationEvent} from "./model/definitions";
import {DefaultImageDirective} from "./directive/default-image.directive";
import {PresentationService} from "./service/presentation.service";
import {AgentModalService} from "./service/agent-modal.service";
import {PresentationControlsComponent} from "./component/presentation-controls/presentation-controls.component";

@Component({
    selector: "app-root",
    imports: [
        HugeiconsIconComponent,
        FlowComponent,
        SessionInfoComponent,
        AgentModalComponent,
        DefaultImageDirective,
        PresentationControlsComponent
    ],
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.css",
})
export class AppComponent implements AfterViewInit {
    @ViewChild(FlowComponent) flow!: FlowComponent;
    bridge = inject(BridgeService);
    brand = inject(BrandService);
    entityStore = inject(EntityStoreService);
    presentation = inject(PresentationService);
    agentModal = inject(AgentModalService);
    private destroyRef = inject(DestroyRef);

    todoList = signal<Todo[]>([]);
    usage = signal<StatusData>({
        cost: 0,
        contextUsed: 0
    });

    readonly zoomControls: {
        icon: any;
        label: string;
        action: () => void;
        disabled: () => boolean;
    }[] = [
        {
            icon: SearchAddIcon,
            label: 'Zoom in',
            action: () => this.zoomIn(),
            disabled: () => this.atMaxZoom(),
        },
        {
            icon: SearchMinusIcon,
            label: 'Zoom out',
            action: () => this.zoomOut(),
            disabled: () => this.atMinZoom(),
        },
        {
            icon: ArrowExpandIcon,
            label: 'Fit view',
            action: () => this.fitView(),
            disabled: () => false,
        },
    ];

    readonly atMaxZoom = signal(false);
    readonly atMinZoom = signal(false);

    constructor(private injector: Injector) {
        this.bridge.connect();

        this.bridge.agentEvent.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(agentEvent => {
            const agent = {
                role: agentEvent.role,
                name: agentEvent.name,
                sessionId: agentEvent.sessionId,
                model: agentEvent.model,
                brand: this.brand.resolveBrand(
                    agentEvent.model,
                    agentEvent.provider
                ),
                title: agentEvent.title,
                cost: agentEvent.cost,
                tokens: agentEvent.tokens,
                targetSessionId: agentEvent.targetSessionId,
            };
            this.entityStore.upsertAgent(agent);
            this.flow.addAgent(agent);

            const groupKey = this.entityStore.resolveGroupKey(agentEvent.sessionId);
            this.presentation.push({
                type: 'agent',
                nodeId: groupKey ?? null,
                view: this.resolveFocus(agentEvent),
                timestamp: Date.now(),
                data: agentEvent
            });
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

            const tool = {
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

            this.presentation.push({
                type: 'tool',
                nodeId: name,
                view: this.resolveFocus(toolEvent),
                timestamp: Date.now(),
                data: toolEvent
            });
        });

        this.bridge.statusEvent.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(statusEvent => {
            if (statusEvent.status == 'step-finish') {
                this.usage.set({
                    cost: this.usage().cost + (statusEvent.cost ?? 0),
                    contextUsed: statusEvent.contextUsed ?? 0,
                    tokenBreakdown: statusEvent.tokens
                });
            }

            this.presentation.push({
                type: 'status',
                nodeId: null,
                view: 'macro',
                timestamp: Date.now(),
                data: statusEvent
            });
        });

        this.bridge.todoEvent.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(todoEvent => {
            this.todoList.set(todoEvent.todos);

            this.presentation.push({
                type: 'todo',
                nodeId: null,
                view: 'macro',
                timestamp: Date.now(),
                data: todoEvent
            });
        });

        this.presentation.setFocusCallback(event => this.focusOnEvent(event));
    }

    private resolveFocus(event: AgentEvent | ToolEvent): 'macro' | 'micro' {
        if ('sessionId' in event) {
            const sessionId = event.sessionId;
            if (this.entityStore.isSubagent(sessionId)) {
                return 'micro';
            }
        }
        if ('name' in event && this.agentModal.isOpen()) {
            return 'micro';
        }
        return 'macro';
    }

    private focusOnEvent(event: PresentationEvent): void {
        if (!this.presentation.enabled()) return;
        if (!event.nodeId) return;

        if (event.view === 'macro') {
            this.flow.focusNode(event.nodeId);
        } else if (event.view === 'micro') {
            if ('sessionId' in event.data) {
                const agentEvent = event.data as AgentEvent;
                if (this.entityStore.isSubagent(agentEvent.sessionId)) {
                    const agent = this.entityStore.getAgent(agentEvent.sessionId);
                    if (agent?.targetSessionId) {
                        this.agentModal.open(agent.targetSessionId);
                        setTimeout(() => this.flow.focusNode(event.nodeId!), 100);
                    }
                }
            }
        }
    }

    ngAfterViewInit() {
        effect(() => {
            const zoom = this.flow.currentViewport().zoom;
            this.atMaxZoom.set(zoom >= 1.5);
            this.atMinZoom.set(zoom <= 0.1);
        }, {injector: this.injector});
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

    protected readonly Telescope01Icon = Telescope01Icon;
    protected readonly SearchAddIcon = SearchAddIcon;
    protected readonly SearchMinusIcon = SearchMinusIcon;
    protected readonly ArrowExpandIcon = ArrowExpandIcon;
}
