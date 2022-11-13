export function ctor<A extends any[], T>(constructor: { new (...args: A): T }): (...args: A) => T {
  return (...args: A) => new constructor(...args);
}

export type ObjectWithKV<K extends string | number, V> = { [P in K]: V };

/** (key, object) => () => value */
export const getKO =
  <K extends string | number, O extends ObjectWithKV<K, any>>(key: K, object: O) =>
  () =>
    object[key];

/** key => object => value */
export const getK_ =
  <K extends string | number>(key: K) =>
  <O extends ObjectWithKV<K, any>>(object: O) =>
    object[key];

/** (key, value, object) => () => object  */
export const setKVO =
  <K extends string | number, V, O extends ObjectWithKV<K, V>>(key: K, value: V, object: O) =>
  () => ((object[key] = value as any), object);

/** (key, value) => object => object  */
export const setKV_ =
  <K extends string | number, V>(key: K, value: V) =>
  <O extends ObjectWithKV<K, V>>(object: O) => ((object[key] = value as any), object);

/** key => value => object => object  */
export const setK__ =
  <K extends string | number>(key: K) =>
  <V>(value: V) =>
  <O extends ObjectWithKV<K, V>>(object: O) =>
    (object[key] = value as any) as O[K];

export type ObjectWithMethod<K extends string | number, A extends any[]> = { [P in K]: (...args: A) => any };

/** (key, args[], object) => *  */
export const applyKAO = <K extends string | number, A extends any[], O extends ObjectWithMethod<K, A>>(
  key: K,
  args: A,
  object: O
) => (object[key] as any)(...args) as ReturnType<O[K]>;

/** (key, ...args) => object => *  */
export const callKA_ =
  <K extends string | number, A extends any[]>(key: K, ...args: A) =>
  <O extends ObjectWithMethod<K, A>>(object: O) =>
    (object[key] as any)(...args) as ReturnType<O[K]>;

/** key => ...args => object => *  */
export const callK__ =
  <K extends string | number>(key: K) =>
  <A extends any[]>(...args: A) =>
  <O extends ObjectWithMethod<K, A>>(object: O) =>
    (object[key] as any)(...args) as ReturnType<O[K]>;
