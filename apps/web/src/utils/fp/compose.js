export const compose =
  (...fns) =>
  (x) =>
    fns.reduceRight((v, fn) => fn(v), x);
