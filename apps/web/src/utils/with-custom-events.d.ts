export type WithCustomEvents<CustomEventMap> = {
  addEventListener<K extends keyof CustomEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: CustomEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  dispatchEvent(customEvent: CustomEventMap[keyof CustomEventMap]): boolean;
  removeEventListener<K extends keyof CustomEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: CustomEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
} & Omit<HTMLElement, "addEventListener" | "removeEventListener" | "dispatchEvent">;
