export const tap = (f) => (v) => {
  f(v);
  return v;
};
