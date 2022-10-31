import { compose } from "../fp/compose";

export type ExtractInit<T> = T extends CustomEvent<infer K> ? CustomEventInit<K> : EventInit;

export function emit<T extends keyof WindowEventMap>(
  name: T,
  init?: ExtractInit<WindowEventMap[T]>,
  target: EventTarget = window
) {
  if ((init as CustomEventInit)?.detail !== undefined) {
    target.dispatchEvent(new CustomEvent(name, init as CustomEventInit));
  } else {
    target.dispatchEvent(new Event(name, init));
  }
  return target;
}

export function on<T extends keyof WindowEventMap>(
  name: T,
  handler: (event: WindowEventMap[T]) => any,
  target?: EventTarget
): EventTarget;
export function on(name: string, handler: EventListener, target: EventTarget = window) {
  target.addEventListener(name, handler);
  return target;
}

export function off<T extends keyof WindowEventMap>(
  name: T,
  handler: (event: WindowEventMap[T]) => any,
  target?: EventTarget
): EventTarget;
export function off(name: string, handler: EventListener, target: EventTarget = window) {
  target.removeEventListener(name, handler as EventListener);
  return target;
}

export const preventDefault = <T extends Event>(e: T) => {
  e.preventDefault();
  return e;
};

export const stopPropagation = <T extends Event>(e: T) => {
  e.stopPropagation();
  return e;
};

export const getDetail = (e: CustomEvent) => e.detail;
export const target = <T extends Element>(e: Event) => e.target as T | null;
export const closest = <T extends Element>(selector: string, node: Element) => node.closest(selector) as T;
export const targetClosest = <T extends Element>(selector: string) =>
  compose(closest.bind(null, selector), target) as (e: Event) => T;
