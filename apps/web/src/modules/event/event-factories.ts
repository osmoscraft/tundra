export const event = (type: string, init?: EventInit) => new Event(type, init);
export const customEvent = <T = any>(type: string, init?: CustomEventInit<T>) => new CustomEvent(type, init);
