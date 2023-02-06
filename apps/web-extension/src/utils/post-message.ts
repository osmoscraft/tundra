export function postMessage<T>(
  src: DedicatedWorkerGlobalScope | Worker,
  message: T,
  transferable: Transferable[]
): void;
export function postMessage<T>(
  src: DedicatedWorkerGlobalScope | Worker,
  message: T,
  options?: StructuredSerializeOptions
): void;
export function postMessage(src: DedicatedWorkerGlobalScope | Worker, args1: any, args2: any) {
  src.postMessage(args1, args2);
}
