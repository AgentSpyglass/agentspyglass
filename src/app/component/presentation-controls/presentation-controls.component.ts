import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {HugeiconsIconComponent} from "@hugeicons/angular";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    FastForwardIcon,
    PlayIcon,
    PauseIcon,
    RefreshIcon
} from "@hugeicons/core-free-icons";
import {PresentationService} from "../../service/presentation.service";

@Component({
    selector: 'presentation-controls',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        HugeiconsIconComponent
    ],
    template: `
        @if (presentation.events().length > 0) {
            <section class="fixed bottom-2 left-1/2 -translate-x-1/2 z-5 flex gap-1 items-center">
                <button
                        class="border-1 border-tertiary bg-bg grid h-10 w-10 place-items-center text-accent transition hover:bg-accent/30 hover:text-text cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text"
                        [disabled]="presentation.events().length <= 1"
                        (click)="presentation.prev()"
                        aria-label="Previous"
                        title="Previous">
                    <hugeicons-icon [icon]="ArrowLeftIcon" [size]="24" color="currentColor" [strokeWidth]="1.5"/>
                </button>

                <button
                        class="border-1 border-tertiary bg-bg grid h-10 w-10 place-items-center text-accent transition hover:bg-accent/30 hover:text-text cursor-pointer"
                        (click)="presentation.toggle()"
                        [attr.aria-label]="presentation.enabled() ? 'Pause' : 'Play'"
                        [title]="presentation.enabled() ? 'Pause' : 'Play'">
                    <hugeicons-icon
                            [icon]="presentation.enabled() ? PauseIcon : PlayIcon"
                            [size]="24" color="currentColor" [strokeWidth]="1.5"/>
                </button>

                <button
                        class="border-1 border-tertiary bg-bg grid h-10 w-10 place-items-center text-accent transition hover:bg-accent/30 hover:text-text cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text"
                        [disabled]="presentation.events().length <= 1"
                        (click)="presentation.next()"
                        aria-label="Next"
                        title="Next">
                    <hugeicons-icon [icon]="ArrowRightIcon" [size]="24" color="currentColor" [strokeWidth]="1.5"/>
                </button>

                <button
                        class="border-1 border-tertiary bg-bg grid h-10 w-10 place-items-center text-accent transition hover:bg-accent/30 hover:text-text cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text"
                        [disabled]="presentation.events().length <= 1"
                        (click)="presentation.restart()"
                        aria-label="Restart"
                        title="Restart">
                    <hugeicons-icon [icon]="RefreshIcon" [size]="24" color="currentColor" [strokeWidth]="1.5"/>
                </button>

                <button
                        class="border-1 border-tertiary bg-bg grid h-10 w-10 place-items-center text-accent transition hover:bg-accent/30 hover:text-text cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text"
                        [disabled]="presentation.currentIndex() >= presentation.events().length - 1"
                        (click)="presentation.goToEnd()"
                        aria-label="Go to end"
                        title="Go to end">
                    <hugeicons-icon [icon]="FastForwardIcon" [size]="24" color="currentColor" [strokeWidth]="1.5"/>
                </button>

                <span class="ml-1 px-2 font-mono text-sm text-text/70 select-none">
                    {{ position() }} / {{ presentation.events().length }}
                </span>
            </section>
        }
    `
})
export class PresentationControlsComponent {
    readonly presentation = inject(PresentationService);

    readonly position = computed(() => {
        const i = this.presentation.currentIndex();
        return i < 0 ? 0 : i + 1;
    });

    protected readonly ArrowLeftIcon = ArrowLeftIcon;
    protected readonly ArrowRightIcon = ArrowRightIcon;
    protected readonly FastForwardIcon = FastForwardIcon;
    protected readonly PlayIcon = PlayIcon;
    protected readonly PauseIcon = PauseIcon;
    protected readonly RefreshIcon = RefreshIcon;
}
