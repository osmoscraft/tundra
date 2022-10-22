export const emit = (/** @type {keyof WindowEventMap} */ name, init, target = window) =>
  target.dispatchEvent(new CustomEvent(name, init));
export const on = (/** @type {keyof WindowEventMap} */ name, handler, target = window) => (
  target.addEventListener(name, handler), target
);
export const off = (/** @type {keyof WindowEventMap} */ name, handler, target = window) => (
  target.removeEventListener(name, handler), target
);

export const preventDefault = (e) => (e.preventDefault(), e);
export const stopPropagation = (e) => (e.stopPropagation(), e);
