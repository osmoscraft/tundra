export class Observable {
  private static CANCEL_SIGNAL = Symbol("CANCEL_SIGNAL");

  constructor(private sourceFn: () => ReadableStream, private transformFns?: (() => TransformStream)[]) {}

  pipe(opeatorFn: () => TransformStream) {
    const newTransforms = [...(this.transformFns ??= []), opeatorFn];
    return new Observable(this.sourceFn, newTransforms);
  }

  subscribe(subscriber: (value: any) => void): () => void {
    if (!this.sourceFn) throw new Error("No source");

    const abort = new AbortController();
    const sink = new WritableStream({
      write: (value) => {
        subscriber(value);
      },
      close: () => {}, // noop
    });

    const liveSource = this.sourceFn();
    const transformedSource =
      this.transformFns?.reduce((stream, transformFn) => stream.pipeThrough(transformFn()), liveSource) ?? liveSource;

    transformedSource.pipeTo(sink, { signal: abort.signal }).catch((e) => {
      if (e !== Observable.CANCEL_SIGNAL) throw e;
    });

    return () => {
      abort.abort(Observable.CANCEL_SIGNAL);
    };
  }
}
