export const emit = (name, init, target = window) => target.dispatchEvent(new CustomEvent(name, init));
export const on = (name, handler, target = window) => (target.addEventListener(name, handler), target);
export const off = (name, handler, target = window) => (target.removeEventListener(name, handler), target);

export const preventDefault = (e) => (e.preventDefault(), e);
export const stopPropagation = (e) => (e.stopPropagation(), e);
