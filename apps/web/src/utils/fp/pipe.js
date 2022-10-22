export const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, fn) => fn(v), x);
