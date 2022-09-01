export function memoizeZeroArity<T>(callback: () => T): () => T {
  let cache!: T;

  return () => {
    if (cache) return cache;
    cache = callback();
    return cache;
  };
}
