export interface QueryParent {
  querySelector: (selector: string) => Node | null;
  querySelectorAll: (selector: string) => NodeList;
}

export function $<K extends keyof HTMLElementTagNameMap>(
  selectors: K,
  root?: QueryParent
): HTMLElementTagNameMap[K] | null;
export function $<T extends Element = Element>(selector: string, root?: QueryParent): T | null;
export function $(selector: string, root: QueryParent = document) {
  return root.querySelector(selector);
}

export function $$<K extends keyof HTMLElementTagNameMap>(
  selectors: K,
  root?: QueryParent
): NodeListOf<HTMLElementTagNameMap[K]>;
export function $$<T extends Element = Element>(selector: string, root?: QueryParent): NodeListOf<T>;
export function $$(selector: string, root: QueryParent = document) {
  return root.querySelectorAll(selector);
}
