export function createDelegationHandler(key: string, handlers: Record<string, (e: Event) => any>) {
  return (e: Event) => {
    const targetKey = (e.target as HTMLElement)?.getAttribute(key);
    targetKey && handlers[targetKey]?.(e);
  };
}
