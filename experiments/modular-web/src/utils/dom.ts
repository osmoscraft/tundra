export function closest<T extends Element>(selector: string, element: Element): T | null {
  return element.closest(selector) as T;
}
