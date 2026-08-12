import {
    Component,
    input,
    signal,
} from '@angular/core';

@Component({
    selector: 'text-container',
    standalone: true,
    imports: [],
    template: `
	    @if (text()) {
		    <div class="w-full cursor-pointer" (click)="toggle()">
			    <p
					    #textEl
					    class="whitespace-pre-wrap break-words pr-2 transition"
					    [class.line-clamp-1]="!open()"
					    [class.max-h-64]="open()"
					    [class.overflow-y-auto]="open()"
			    >
				    <span [innerHTML]="text()"></span>
			    </p>
		    </div>
	    }
    `,
})
export class TextContainerComponent {
    text = input.required<string | undefined>();
    open = signal(false);

    toggle() {
        this.open.update((v) => !v);
    }
}