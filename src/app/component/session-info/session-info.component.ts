import {Component, computed, inject, input, signal} from '@angular/core';
import {Todo} from "@agentspyglass/core";
import {HugeiconsIconComponent} from "@hugeicons/angular";
import {
    BinocularsIcon,
    CheckListIcon,
    CheckmarkSquare01Icon,
    ChevronDown,
    ChevronUp,
    SquareIcon,
    Coins01Icon,
    CpuIcon, Books02Icon, Menu01Icon, Settings01Icon, ArrowRight01Icon, DollarCircleIcon,
    AiContentGenerator02Icon, ArrowDown01Icon, ArrowUp01Icon, RemoveSquareIcon, Loading03Icon, Presentation01Icon
} from "@hugeicons/core-free-icons";
import {StatusData} from "../../model/definitions";
import {SettingsComponent} from "../settings/settings.component";
import {CurrencyPipe} from "@angular/common";
import {CompactNumberPipe} from "../../pipe/compact-number.pipe";
import {PresentationService} from "../../service/presentation.service";

@Component({
    selector: 'session-info',
    standalone: true,
    templateUrl: './session-info.component.html',
    imports: [
        HugeiconsIconComponent,
        SettingsComponent,
        CurrencyPipe,
        CompactNumberPipe
    ]
})
export class SessionInfoComponent {
    open = signal(true);
    showTokens = signal(false);
    list = input.required<Todo[]>();
    usage = input.required<StatusData>();

    settingsOpen = signal(false);
    presentation = inject(PresentationService);

    tokenBreakdown = computed(() => this.usage().tokenBreakdown);

    readonly controls: {
        icon: any;
        label: string;
        action: () => void;
        disabled: () => boolean;
    }[] = [
        {
            icon: Presentation01Icon,
            label: 'Presentation',
            action: () => this.togglePresentation(),
            disabled: () => false,
        },
        {
            icon: Settings01Icon,
            label: 'Settings',
            action: () => this.toggleSettings(),
            disabled: () => false,
        },
    ];

    toggle() {
        this.open.update((v) => !v);
    }

    toggleTokens() {
        this.showTokens.update((v) => !v);
    }

    togglePresentation(): void {
        this.presentation.toggle();
    }

    toggleSettings(): void {
        this.settingsOpen.update(v => !v);
    }

    protected readonly CheckmarkSquare01Icon = CheckmarkSquare01Icon;
    protected readonly SquareIcon = SquareIcon;
    protected readonly Books02Icon = Books02Icon;
    protected readonly Menu01Icon = Menu01Icon;
    protected readonly ArrowRight01Icon = ArrowRight01Icon;
    protected readonly DollarCircleIcon = DollarCircleIcon;
    protected readonly AiContentGenerator02Icon = AiContentGenerator02Icon;
    protected readonly ArrowDown01Icon = ArrowDown01Icon;
    protected readonly ArrowUp01Icon = ArrowUp01Icon;
    protected readonly RemoveSquareIcon = RemoveSquareIcon;
    protected readonly Loading03Icon = Loading03Icon;
}
