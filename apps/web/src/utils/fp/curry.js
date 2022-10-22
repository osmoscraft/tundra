export const curry = (fn) =>
  function curried(...args) {
    return args.length >= fn.length ? fn(...args) : curried.bind(null, ...args);
  };
