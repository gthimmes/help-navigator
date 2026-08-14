import type { HelpEventName, HelpEventPayloads } from './types';

export type Listener<E extends HelpEventName> = (payload: HelpEventPayloads[E]) => void;

export class Emitter {
  private listeners = new Map<HelpEventName, Set<Listener<HelpEventName>>>();

  on<E extends HelpEventName>(event: E, fn: Listener<E>): () => void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(fn as Listener<HelpEventName>);
    this.listeners.set(event, set);
    return () => set.delete(fn as Listener<HelpEventName>);
  }

  emit<E extends HelpEventName>(event: E, payload: HelpEventPayloads[E]): void {
    this.listeners.get(event)?.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error('help-navigator listener error', err);
      }
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}
