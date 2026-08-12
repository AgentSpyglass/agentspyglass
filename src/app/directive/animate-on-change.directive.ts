import { Directive, ElementRef, effect, inject, input } from '@angular/core';
import { GsapAnimationService } from '../service/gsap-animation.service';

export type AnimateMode = 'swap' | 'crossfade' | 'fade';

@Directive({
    selector: '[animateOnChange]',
    standalone: true,
})
export class AnimateOnChangeDirective {
    private el = inject(ElementRef<HTMLElement>);
    private gsap = inject(GsapAnimationService);

    /** The value to watch — pass any signal-derived value here */
    animateOnChange = input<unknown>();
    /** Which animation to play when the value changes */
    animateMode = input<AnimateMode>('fade');
    /** Skip animating on first render (avoid double-animating with entrance) */
    skipInitial = input(true);

    private prev: unknown;
    private first = true;

    constructor() {
        effect(() => {
            const value = this.animateOnChange();
            const node = this.el.nativeElement;

            if (this.first) {
                this.first = false;
                this.prev = value;
                return;
            }

            if (value !== this.prev) {
                switch (this.animateMode()) {
                    case 'swap':
                        this.gsap.swap(node);
                        break;
                    case 'crossfade':
                        this.gsap.textCrossfade(node);
                        break;
                    case 'fade':
                        this.gsap.fadeIn(node);
                        break;
                }
            }

            this.prev = value;
        });
    }
}