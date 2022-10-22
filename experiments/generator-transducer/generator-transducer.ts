export type ObjectWithKV<K extends string | number, V> = { [P in K]: V };
export type ObjectWithMethod<K extends string | number, A extends any[], R extends any> = {
  [P in K]: (...args: A) => R;
};

export type GeneratorFactory<T extends any[] = any[]> = (...args: T) => Generator;
export type AsyncGeneratorFactory<T extends any[] = any[]> = (...args: T) => AsyncGenerator;

export const gFetch = () =>
  async function* (url: string) {
    return fetch(url);
  };

export const gDecode = (format: "text" | "json" = "text") =>
  function* (obj: ObjectWithMethod<"text" | "json", [], Promise<string>>) {
    return obj[format]();
  };

export const gMap = <T1, T2>(fn: (input: T1) => T2) =>
  function* (v: T1) {
    return fn(v);
  };

export const gSerial = (...gFactories: (AsyncGeneratorFactory | GeneratorFactory)[]) =>
  async function* (initial: any) {
    // TODO need to recursively exhaust the generator
    return gFactories.reduce(async (value, gFactory) => (await gFactory(await value).next()).value, initial);
  };

export const gConcurrent = (...gFactories: (AsyncGeneratorFactory | GeneratorFactory)[]) =>
  async function* (input: any) {
    // TODO need to recursively exhaust the generator
    const results = gFactories.map(async (gFactory) => (await gFactory(await input).next()).value);

    let pendingPromises = [...results];

    while (pendingPromises.length) {
      // inject index for tracking
      const [i, p] = await Promise.any(pendingPromises.map(async (p, i) => [i, await p]));
      yield p;
      // TODO put the results back into the promise pool to exhause the sources
      pendingPromises.splice(i, 1);
    }
  };

export async function main() {
  console.log("started");
  const fetch = gFetch();
  const decode = gDecode();
  const fetchTextFromUrl = gSerial(
    fetch,
    decode,
    gMap((text: string) => text.slice(0, 256))
  );

  const multiDownload = gConcurrent(
    () => fetchTextFromUrl("https://www.wikipedia.org"),
    () => fetchTextFromUrl("https://rxjs.dev/"),
    () => fetchTextFromUrl("https://developer.mozilla.org/")
  )({});

  while (true) {
    const result = await multiDownload.next();
    console.log(result.value);
    if (result.done) break;
  }
}

main();
