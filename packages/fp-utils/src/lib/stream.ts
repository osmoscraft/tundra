import { identity } from "./identity";

// async generator to readable stream
export function generatorToStream<T>(generator: AsyncGenerator<T>): ReadableStream<T> {
  return mapGeneratorToStream(identity, generator);
}

export function mapGeneratorToStream<T, K>(mapper: (input: T) => K | Promise<K>, generator: AsyncGenerator<T>) {
  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await generator.next();

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

export async function* mapAsyncGenerator<T, K>(
  mapper: (input: T) => K | Promise<K>,
  generator: AsyncGenerator<T>
): AsyncGenerator<K> {
  for await (const value of generator) {
    yield await mapper(value);
  }
}

export async function mapAsyncGeneratorParallel<T, K>(
  mapper: (input: T) => K | Promise<K>,
  generator: AsyncGenerator<T>
): Promise<K[]> {
  const result: (K | Promise<K>)[] = [];
  for await (const value of generator) {
    result.push(mapper(value));
  }

  return Promise.all(result);
}

export async function* filterGeneratorAsync<T>(
  predicate: (input: T) => boolean | Promise<boolean>,
  iterator: AsyncGenerator<T>
): AsyncGenerator<T> {
  for await (const value of iterator) {
    if (await predicate(value)) {
      yield value;
    }
  }
}

export async function drainGenerator<T>(generator: AsyncGenerator<T>) {
  for await (const _value of generator) {
    // noop
  }
}
