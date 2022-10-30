export function withTimer<TIn extends any[], TOut>(
  fn: (...args: TIn) => Promise<TOut>,
  onDuration: (durationInMs: number) => any
): (...args: TIn) => Promise<TOut> {
  return async function (...args: TIn): Promise<TOut> {
    const start = performance.now();
    const result = await fn(...args);
    onDuration(performance.now() - start);
    return result;
  };
}
