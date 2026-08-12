import {Component, Input, input, signal} from '@angular/core';
import {CustomNodeComponent, HandleComponent} from 'ngx-vflow';
import {Agent, MCP, Todo} from "@agentspyglass/core";
import {NodeData} from "../../model/definitions";
import {LowerCasePipe, TitleCasePipe} from "@angular/common";
import {HugeiconsIconComponent} from "@hugeicons/angular";
import {
    BinocularsIcon,
    CheckListIcon,
    CheckmarkSquare01Icon,
    ChevronDown,
    ChevronUp,
    Square01Icon, SquareIcon
} from "@hugeicons/core-free-icons";

@Component({
    selector: 'todo',
    standalone: true,
    templateUrl: './todo.component.html',
    imports: [
        HugeiconsIconComponent
    ]
})
export class TodoComponent {
    open = signal(true);
    list = input.required<Todo[]>();

    toggle() {
        this.open.update((v) => !v);
    }

    protected readonly CheckListIcon = CheckListIcon;
    protected readonly ChevronDown = ChevronDown;
    protected readonly ChevronUp = ChevronUp;
    protected readonly CheckmarkSquare01Icon = CheckmarkSquare01Icon;
    protected readonly Square01Icon = Square01Icon;
    protected readonly SquareIcon = SquareIcon;
    protected readonly BinocularsIcon = BinocularsIcon;
}