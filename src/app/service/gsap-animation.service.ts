import { Injectable } from '@angular/core';
import gsap from 'gsap';

@Injectable({ providedIn: 'root' })
export class GsapAnimationService {
    /** Generic entrance for a set of elements */
    entrance(els: Element[], opts: gsap.TweenVars = {}) {
        return gsap.from(els, {
            opacity: 0,
            y: 8,
            duration: 0.4,
            stagger: 0.05,
            ease: 'power2.out',
            ...opts,
        });
    }

    /** Pop/swap animation for things like avatars or icons changing */
    swap(el: Element, opts: gsap.TweenVars = {}) {
        return gsap.fromTo(
            el,
            { opacity: 0, scale: 0.6, rotate: -15 },
            { opacity: 1, scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(2)', ...opts }
        );
    }

    /** Text content change: fade/slide out, then in */
    textCrossfade(el: Element, opts: { outDuration?: number; inDuration?: number } = {}) {
        const tl = gsap.timeline();
        tl.to(el, { opacity: 0, y: -4, duration: opts.outDuration ?? 0.15, ease: 'power1.in' });
        tl.to(el, { opacity: 1, y: 0, duration: opts.inDuration ?? 0.25, ease: 'power2.out' });
        return tl;
    }

    fadeIn(el: Element, opts: gsap.TweenVars = {}) {
        return gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3, ...opts });
    }

    /** Fully show/hide a wrapper (height + opacity), for enter/exit of a block */
    collapse(wrap: HTMLElement, targetHeight: number, show: boolean, opts: gsap.TweenVars = {}) {
        if (show) {
            return gsap.to(wrap, {
                height: targetHeight,
                opacity: 1,
                duration: 0.4,
                ease: 'power2.out',
                ...opts,
            });
        }
        return gsap.to(wrap, { height: 0, opacity: 0, duration: 0.3, ease: 'power1.in', ...opts });
    }

    /** Animate just a height change, keeping the wrapper visible (used for expand/collapse toggle & resize-on-content-change) */
    animateHeight(wrap: HTMLElement, targetHeight: number, opts: gsap.TweenVars = {}) {
        return gsap.to(wrap, { height: targetHeight, duration: 0.35, ease: 'power2.inOut', ...opts });
    }

    set(el: Element | Element[], vars: gsap.TweenVars) {
        gsap.set(el, vars);
    }
}