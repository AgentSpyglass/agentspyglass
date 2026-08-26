import {computed, Injectable, signal, WritableSignal} from "@angular/core";
import {PresentationEvent} from "../model/definitions";

@Injectable({providedIn: 'root'})
export class PresentationService {
    readonly enabled = signal(true);

    readonly events: WritableSignal<PresentationEvent[]> = signal([]);
    readonly currentIndex = signal(-1);

    /** MCP names that have already produced a slide (tool event). */
    private readonly seenMcp = new Set<string>();

    /** Returns true the first time a given MCP name is seen, registering it. */
    isNewMcp(name: string): boolean {
        if (this.seenMcp.has(name)) return false;
        this.seenMcp.add(name);
        return true;
    }

    readonly currentEvent = computed<PresentationEvent | null>(() => {
        const i = this.currentIndex();
        const list = this.events();
        if (i < 0 || i >= list.length) return null;
        return list[i];
    });

    /**
     * Registered by the app shell. Invoked by navigation methods so the
     * presentation service stays decoupled from the view layer.
     */
    readonly focusCallback = signal<((event: PresentationEvent | null) => void) | null>(null);

    setFocusCallback(cb: (event: PresentationEvent | null) => void): void {
        this.focusCallback.set(cb);
    }

    private focus(event: PresentationEvent | null): void {
        this.focusCallback()?.(event);
    }

    /** Add an event. Auto-advances + focuses only when the event is a slide. */
    push(event: PresentationEvent): void {
        this.events.update(list => [...list, event]);
        if (this.enabled() && event.isSlide) {
            this.currentIndex.set(this.events().length - 1);
            this.focus(event);
        }
    }

    next(): void {
        const last = this.events().length - 1;
        if (last < 0) return;
        this.currentIndex.set(Math.min(this.currentIndex() + 1, last));
        this.focus(this.currentEvent());
    }

    prev(): void {
        if (this.events().length === 0) return;
        this.currentIndex.set(Math.max(this.currentIndex() - 1, 0));
        this.focus(this.currentEvent());
    }

    restart(): void {
        if (this.events().length === 0) return;
        this.currentIndex.set(0);
        this.focus(this.currentEvent());
    }

    toggle(): void {
        this.enabled.update(v => !v);
    }
}
