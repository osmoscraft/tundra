export type ExtractInit<T> = T extends CustomEvent<infer K> ? CustomEventInit<K> : CustomEventInit<any>;
export const emit =
  <T extends keyof WindowEventMap>(name: T, init: ExtractInit<WindowEventMap[T]>) =>
  (target: EventTarget) => {
    target.dispatchEvent(new CustomEvent(name, init));
    return target;
  };

export const on =
  <T extends keyof WindowEventMap>(name: T, handler: (event: WindowEventMap[T]) => any) =>
  (target: EventTarget) => {
    target.addEventListener(name, handler);
    return target;
  };

export const off =
  <T extends keyof WindowEventMap>(name: T, handler: (event: WindowEventMap[T]) => any) =>
  (target: EventTarget) => {
    target.removeEventListener(name, handler);
    return target;
  };

export const preventDefault = (e: Event) => {
  e.preventDefault();
  return e;
};

export const target = (e: Event) => e.target!;
