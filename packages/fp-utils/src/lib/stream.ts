import { identity } from "./identity";

// async generator to readable stream
export function iteratorToStream<T>(iterator: AsyncGenerator<T>): ReadableStream<T> {
  return mapIteratorToStream(identity, iterator);
}

export function mapIteratorToStream<T, K>(mapper: (input: T) => K | Promise<K>, iterator: AsyncGenerator<T>) {
  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();

        if (done) {
          controller.close();
        } else {
          controller.enqueue(await mapper(value));
        }
      } catch (e) {
        controller.error(e);
      }
    },
  });
}

export async function* mapIteratorAsync<T, K>(
  mapper: (input: T) => K | Promise<K>,
  iterator: AsyncGenerator<T>
): AsyncGenerator<K> {
  for await (const value of iterator) {
    yield await mapper(value);
  }
}

export async function* filterIteratorAsync<T>(
  predicate: (input: T) => boolean | Promise<boolean>,
  iterator: AsyncGenerator<T>
): AsyncGenerator<T> {
  for await (const value of iterator) {
    if (await predicate(value)) {
      yield value;
    }
  }
}

export async function exhaustIterator<T>(iterator: AsyncGenerator<T>) {
  for await (const _value of iterator) {
    // noop
  }
}
