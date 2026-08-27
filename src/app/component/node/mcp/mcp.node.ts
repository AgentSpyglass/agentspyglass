import {ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, viewChild} from '@angular/core';
import {CustomNodeComponent, HandleComponent} from 'ngx-vflow';
import {Tool} from "@agentspyglass/core";
import {NodeData} from "../../../model/definitions";
import {TextContainerComponent} from "../../text-container.component";
import {NameCasePipe} from "../../../pipe/namecase.pipe";
import {EntityStoreService} from "../../../service/entity-store.service";
import {PresentationService} from "../../../service/presentation.service";
import {DefaultImageDirective} from "../../../directive/default-image.directive";
import gsap from 'gsap';

@Component({
    selector: 'mcp-node',
    standalone: true,
    templateUrl: './mcp.node.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        HandleComponent,
        TextContainerComponent,
        NameCasePipe,
        DefaultImageDirective
    ]
})
export class McpNode extends CustomNodeComponent<NodeData> {
    private entityStore = inject(EntityStoreService);
    private presentation = inject(PresentationService);
    private destroyRef = inject(DestroyRef);
    private contentEl = viewChild<ElementRef<HTMLElement>>('content');

    mcp = computed(() => {
        const data = this.data();
        if (!data?.entityId) return undefined;
        return this.entityStore.getMcp(data.entityId);
    });

    mcpSide = computed(() => this.data()?.mcpSide);
    inModal = computed(() => this.data()?.inModal);
    focused = computed(() => this.presentation.enabled() && this.data()?.focused === true);

    private pulse?: gsap.core.Timeline;

    constructor() {
        super();

        effect(() => {
            const el = this.contentEl()?.nativeElement;
            if (!el) return;

            if (this.focused()) {
                this.pulse?.kill();
                gsap.set(el, {transformOrigin: 'center center'});
                this.pulse = gsap.timeline({repeat: -1, yoyo: true})
                    .to(el, {scale: 1.05, duration: 0.6, ease: 'power1.inOut'})
                    .to(el, {scale: 1, duration: 0.6, ease: 'power1.inOut'});
            } else {
                this.pulse?.kill();
                this.pulse = undefined;
                gsap.to(el, {scale: 1, duration: 0.2, ease: 'power2.out'});
            }
        });

        this.destroyRef.onDestroy(() => this.pulse?.kill());
    }

    generateToolMessage(tool: Tool) {
        return `<span class="font-medium ${this.getColor(tool)}">${tool.name}</span> <span class="text-xs font-light ${this.getColor(tool)}">${JSON.stringify(tool.input)}</span>`
    }

    getColor(tool: Tool) {
        if (tool.status == 'completed') return 'text-gray-600';
        return 'text-text';
    }
}
