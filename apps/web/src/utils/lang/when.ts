export function when<ArgsType extends any[], ReturnType = any>(predicate: (...args: ArgsType) => any, main: (...args: ArgsType) => ReturnType) {
  return (...args: ArgsType) => (predicate(...args) ? main(...args) : null);
}
