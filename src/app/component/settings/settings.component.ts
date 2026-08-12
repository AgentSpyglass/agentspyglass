import {Component, input, output} from '@angular/core';
import {HugeiconsIconComponent} from "@hugeicons/angular";
import {Cancel01Icon, Setting06Icon} from "@hugeicons/core-free-icons";

@Component({
    selector: 'settings',
    standalone: true,
    templateUrl: './settings.component.html',
    imports: [
        HugeiconsIconComponent
    ]
})
export class SettingsComponent {
    open = input<boolean>(false);
    closed = output<void>();

    close(): void {
        this.closed.emit();
    }

    protected readonly Setting06Icon = Setting06Icon;
    protected readonly Cancel01Icon = Cancel01Icon;
}
