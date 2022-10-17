export function $<E extends Element = Element>(selectors: string, root: Element | Document = document): E | null {
  return root.querySelector(selectors);
}

export function $$<E extends Element = Element>(selectors: string, root: Element | Document = document): NodeListOf<E> {
  return root.querySelectorAll(selectors);
}
