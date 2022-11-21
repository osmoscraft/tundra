export default {};

export class Observable {
  constructor(private source?: ReadableStream, private transforms?: TransformStream[]) {}

  from(source: ReadableStream) {
    return new Observable(source, this.transforms);
  }

  pipe(opeator: TransformStream) {
    const newTransforms = [...(this.transforms ??= []), opeator];
    return new Observable(this.source, newTransforms);
  }

  subscribe(subscriber: () => void): () => void {
    return () => {};
  }
}
