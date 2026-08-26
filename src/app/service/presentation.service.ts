import {computed, Injectable, OnDestroy, signal, WritableSignal} from "@angular/core";
import {PresentationEvent} from "../model/definitions";

@Injectable({providedIn: 'root'})
export class PresentationService implements OnDestroy {

    readonly enabled = signal(true);

    readonly events: WritableSignal<PresentationEvent[]> = signal([]);
    readonly currentIndex = signal(-1);

    private intervalId: any = null;

    readonly currentEvent = computed<PresentationEvent | null>(() => {
        const i = this.currentIndex();
        const list = this.events();
        if (i < 0 || i >= list.length) return null;
        return list[i];
    });

    readonly focusCallback = signal<((event: PresentationEvent | null) => void) | null>(null);

    setFocusCallback(cb: (event: PresentationEvent | null) => void): void {
        this.focusCallback.set(cb);
    }

    private focus(event: PresentationEvent | null): void {
        this.focusCallback()?.(event);
    }

    push(event: PresentationEvent): void {
        this.events.update(list => [...list, event]);
        if (this.enabled()) {
            this.currentIndex.set(this.events().length - 1);
            this.focus(event);
            this.resetAutoPlay();
        }
    }

    next(): void {
        const list = this.events();
        if (list.length === 0) return;
        const target = this.findNextEvent(this.currentIndex());
        if (target === null) {
            return;
        }
        this.currentIndex.set(target);
        this.focus(this.currentEvent());
        this.resetAutoPlay();
    }

    prev(): void {
        if (this.events().length === 0) return;
        const target = this.findPrevEvent(this.currentIndex());
        if (target === null) {
            this.resetAutoPlay();
            return;
        }
        this.currentIndex.set(target);
        this.focus(this.currentEvent());
        this.resetAutoPlay();
    }

    restart(): void {
        if (this.events().length === 0) return;
        const first = this.findNextEvent(-1);
        if (first !== null) {
            this.currentIndex.set(first);
            this.focus(this.currentEvent());
        }
        this.resetAutoPlay();
    }

    toggle(): void {
        const wasEnabled = this.enabled();
        this.enabled.update(v => !v);
        if (!wasEnabled) {
            if (this.currentIndex() < 0 || !this.currentEvent()) {
                const end = this.findLastEvent();
                if (end !== null) {
                    this.currentIndex.set(end);
                    this.focus(this.currentEvent());
                }
            }
            this.startAutoPlay();
        } else {
            this.stopAutoPlay();
        }
    }

    goToEnd(): void {
        if (this.events().length === 0) return;
        const end = this.findLastEvent();
        if (end !== null) {
            this.currentIndex.set(end);
            this.focus(this.currentEvent());
        }
        this.resetAutoPlay();
    }

    ngOnDestroy(): void {
        this.stopAutoPlay();
    }

    /** Start or restart the 2s auto-play interval. */
    private startAutoPlay(): void {
        this.stopAutoPlay();
        this.intervalId = setInterval(() => this.next(), 2000);
    }

    /** Clear the auto-play interval if running. */
    private stopAutoPlay(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /** Re-arm the auto-play timer when enabled (used by manual navigation). */
    private resetAutoPlay(): void {
        if (this.enabled()) {
            this.startAutoPlay();
        }
    }

    private findNextEvent(from: number): number | null {
        const list = this.events();
        return from + 1 < list.length ? from + 1 : null;
    }

    private findPrevEvent(from: number): number | null {
        const list = this.events();
        return from - 1 >= 0 ? from - 1 : null;
    }

    private findLastEvent(): number | null {
        const list = this.events();
        return list.length > 0 ? list.length - 1 : null;
    }
}
