import {Component, input, signal} from '@angular/core';
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
    CpuIcon
} from "@hugeicons/core-free-icons";
import {StatusData} from "../../model/definitions";

@Component({
    selector: 'session-info',
    standalone: true,
    templateUrl: './session-info.component.html',
    imports: [
        HugeiconsIconComponent
    ]
})
export class SessionInfoComponent {
    open = signal(true);
    list = input.required<Todo[]>();
    usage = input.required<StatusData>();

    toggle() {
        this.open.update((v) => !v);
    }

    formatTokens(tokens: number): string {
        if (tokens >= 1_000_000) {
            return (tokens / 1_000_000).toFixed(1) + 'M';
        }
        if (tokens >= 1_000) {
            return (tokens / 1_000).toFixed(1) + 'K';
        }
        return tokens.toString();
    }

    formatCost(cost: number): string {
        return '$' + cost.toFixed(4);
    }

    protected readonly CheckListIcon = CheckListIcon;
    protected readonly ChevronDown = ChevronDown;
    protected readonly ChevronUp = ChevronUp;
    protected readonly CheckmarkSquare01Icon = CheckmarkSquare01Icon;
    protected readonly SquareIcon = SquareIcon;
    protected readonly BinocularsIcon = BinocularsIcon;
    protected readonly Coins01Icon = Coins01Icon;
    protected readonly CpuIcon = CpuIcon;
}
