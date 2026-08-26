import {Injectable, computed, signal} from '@angular/core';
import {PresentationEvent} from '../model/definitions';

@Injectable({providedIn: 'root'})
export class PresentationService {
    readonly enabled = signal(true);
    readonly events = signal<PresentationEvent[]>([]);
    readonly currentIndex = signal(-1);
    readonly focusCallback = signal<((event: PresentationEvent) => void) | null>(null);

    readonly currentEvent = computed(() => {
        const idx = this.currentIndex();
        const evts = this.events();
        return idx >= 0 && idx < evts.length ? evts[idx] : null;
    });

    push(event: PresentationEvent): void {
        this.events.update(e => [...e, event]);
        if (this.enabled()) {
            this.currentIndex.set(this.events().length - 1);
            this.focus();
        }
    }

    next(): void {
        const last = this.events().length - 1;
        if (this.currentIndex() >= last) return;
        this.currentIndex.update(i => i + 1);
        this.focus();
    }

    prev(): void {
        if (this.currentIndex() <= 0) return;
        this.currentIndex.update(i => i - 1);
        this.focus();
    }

    restart(): void {
        if (this.events().length === 0) return;
        this.currentIndex.set(0);
        this.focus();
    }

    toggle(): void {
        this.enabled.update(v => !v);
    }

    setFocusCallback(callback: ((event: PresentationEvent) => void) | null): void {
        this.focusCallback.set(callback);
    }

    private focus(): void {
        const event = this.currentEvent();
        const callback = this.focusCallback();
        if (event && callback) {
            callback(event);
        }
    }
}
