export function defineEvent(type: string, init?: EventInit) {
  return {
    emit: (target: EventTarget) => target.dispatchEvent(new Event(type, init)),
    on: (target: EventTarget, handler: EventListener) => target.addEventListener(type, handler),
    off: (target: EventTarget, handler: EventListener) => target.removeEventListener(type, handler),
  };
}

export type CustomEventHandler<T> = (customEvent: CustomEvent<T>) => any;
export function defineCustomEvent<T>(type: string, init?: CustomEventInit<T>) {
  return {
    emit: (target: EventTarget, detail: T) => target.dispatchEvent(new CustomEvent(type, { ...init, detail })),
    on: (target: EventTarget, handler: CustomEventHandler<T>) => target.addEventListener(type, handler as EventListener),
    off: (target: EventTarget, handler: CustomEventHandler<T>) => target.removeEventListener(type, handler as EventListener),
  };
}
