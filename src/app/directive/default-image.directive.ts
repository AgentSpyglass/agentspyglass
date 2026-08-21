import {
    Directive,
    ElementRef,
    HostListener,
    inject,
    input,
} from '@angular/core';
import { GsapAnimationService } from '../service/gsap-animation.service';

@Directive({
    selector: 'img',
    standalone: true,
})
export class DefaultImageDirective {
    private el = inject(ElementRef<HTMLImageElement>);

    defaultImage = input('assets/not_found.svg');

    @HostListener('error')
    onError(): void {
        this.el.nativeElement.src = this.defaultImage();
    }
}