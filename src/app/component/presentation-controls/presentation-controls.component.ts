import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {HugeiconsIconComponent} from "@hugeicons/angular";
import {
    PlayIcon,
    PauseIcon,
    SkipBackIcon,
    SkipForwardIcon,
    RestartIcon
} from "@hugeicons/core-free-icons";
import {PresentationService} from "../../service/presentation.service";

@Component({
    selector: 'presentation-controls',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [HugeiconsIconComponent],
    template: `
        @if (presentation.events().length > 0) {
            <div class="controls">
                <button (click)="restart()" [disabled]="presentation.currentIndex() <= 0">
                    <hugeicons-icon [icon]="RestartIcon" />
                </button>
                <button (click)="prev()" [disabled]="presentation.currentIndex() <= 0">
                    <hugeicons-icon [icon]="SkipBackIcon" />
                </button>
                <button (click)="toggle()">
                    <hugeicons-icon [icon]="presentation.enabled() ? PauseIcon : PlayIcon" />
                </button>
                <button (click)="next()" [disabled]="presentation.currentIndex() >= presentation.events().length - 1">
                    <hugeicons-icon [icon]="SkipForwardIcon" />
                </button>
                <span class="position">
                    {{ presentation.currentIndex() + 1 }} / {{ presentation.events().length }}
                </span>
            </div>
        }
    `,
    styles: [`
        :host {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
        }

        .controls {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(20, 20, 20, 0.9);
            border-radius: 8px;
            backdrop-filter: blur(8px);
        }

        button {
            background: transparent;
            border: none;
            color: #ccc;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background 0.2s;
        }

        button:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.1);
        }

        button:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        .position {
            color: #ccc;
            font-size: 12px;
            margin-left: 8px;
            min-width: 60px;
            text-align: center;
        }
    `]
})
export class PresentationControlsComponent {
    presentation = inject(PresentationService);

    next(): void {
        this.presentation.next();
    }

    prev(): void {
        this.presentation.prev();
    }

    restart(): void {
        this.presentation.restart();
    }

    toggle(): void {
        this.presentation.toggle();
    }

    protected readonly PlayIcon = PlayIcon;
    protected readonly PauseIcon = PauseIcon;
    protected readonly SkipBackIcon = SkipBackIcon;
    protected readonly SkipForwardIcon = SkipForwardIcon;
    protected readonly RestartIcon = RestartIcon;
}
