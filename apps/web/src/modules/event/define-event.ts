export function defineEvent(type: string, init?: EventInit) {
  return {
    create: () => new Event(type, init),
    handle: (handler: EventListener) => [type, handler] as const,
  };
}

export function defineCustomEvent<T>(type: string, init?: CustomEventInit<T>) {
  return {
    create: (detail: T) => new CustomEvent(type, { ...init, detail }),
    handle: (handler: (event: CustomEvent<T>) => any) => [type, handler] as [string, EventListener],
  };
}
