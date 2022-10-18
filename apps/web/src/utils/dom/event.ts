export type ExtractInit<T> = T extends CustomEvent<infer K> ? CustomEventInit<K> : CustomEventInit<any>;
export const emit = <T extends keyof WindowEventMap>(name: T, init: ExtractInit<WindowEventMap[T]>, target: EventTarget = window) => {
  target.dispatchEvent(new CustomEvent(name, init));
  return target;
};

export const on = <T extends keyof WindowEventMap>(name: T, handler: (event: WindowEventMap[T]) => any, target: EventTarget = window) => {
  target.addEventListener(name, handler as EventListener);
  return target;
};

export const off = <T extends keyof WindowEventMap>(name: T, handler: (event: WindowEventMap[T]) => any, target: EventTarget = window) => {
  target.removeEventListener(name, handler as EventListener);
  return target;
};

export const preventDefault = (e: Event) => {
  e.preventDefault();
  return e;
};
