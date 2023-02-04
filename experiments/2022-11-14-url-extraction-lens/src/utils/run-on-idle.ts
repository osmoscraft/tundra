export function toIdleCallback<T extends any[]>(timeout: number, task: (...args: T) => any) {
  return (...args: T) => requestIdleCallback(() => task(...args), { timeout });
}
