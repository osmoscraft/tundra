import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { exhaustGenerator, generatorToStream, mapAsyncGenerator, mapAsyncGeneratorParallel } from "../lib/stream";

describe("generatorToStream", () => {
  it("empty generator", async () => {
    const emptyGenerator = async function* () {};
    const emptyStream = generatorToStream(emptyGenerator());

    // read from stream and assert empty
    const reader = emptyStream.getReader();
    const result = await reader.read();
    assert.strictEqual(result.value, undefined);
    assert(result.done);
  });

  it("single value generator", async () => {
    const singleValueGenerator = async function* () {
      yield 1;
    };
    const singleValueStream = generatorToStream(singleValueGenerator());

    const reader = singleValueStream.getReader();
    const result = await reader.read();
    assert.strictEqual(result.value, 1);
    assert(!result.done);

    const result2 = await reader.read();
    assert.strictEqual(result2.value, undefined);
    assert(result2.done);
  });

  it("multi value generator", async () => {
    const multiValueGenerator = async function* () {
      yield 1;
      yield 2;
      yield 3;
    };
    const multiValueStream = generatorToStream(multiValueGenerator());

    const reader = multiValueStream.getReader();
    const result = await reader.read();
    assert.strictEqual(result.value, 1);
    assert(!result.done);

    const result2 = await reader.read();
    assert.strictEqual(result2.value, 2);
    assert(!result2.done);

    const result3 = await reader.read();
    assert.strictEqual(result3.value, 3);
    assert(!result3.done);

    const result4 = await reader.read();
    assert.strictEqual(result4.value, undefined);
    assert(result4.done);
  });
});

describe("mapAsyncGenerator", () => {
  it("empty generator", async () => {
    const emptyIterator = async function* () {};
    const emptyMappedIterator = mapAsyncGenerator(() => {}, emptyIterator());

    const results: any[] = [];
    for await (const value of emptyMappedIterator) {
      results.push(value);
    }

    assert.deepStrictEqual(results, []);
  });

  it("single value generator", async () => {
    const singleValueIterator = async function* () {
      yield 1;
    };
    const singleValueMappedIterator = mapAsyncGenerator((value) => value + 1, singleValueIterator());

    const results: any[] = [];
    for await (const value of singleValueMappedIterator) {
      results.push(value);
    }

    assert.deepStrictEqual(results, [2]);
  });

  it("multi value async", async () => {
    const multiValueIterator = async function* () {
      yield 6;
      yield 4;
      yield 2;
    };

    const multiValueMappedIterator = mapAsyncGenerator(
      (delay) => new Promise((resolve) => setTimeout(() => resolve(delay), delay)),
      multiValueIterator()
    );

    const results: any[] = [];
    for await (const value of multiValueMappedIterator) {
      results.push(value);
    }

    assert.deepStrictEqual(results, [6, 4, 2]);
  });
});

describe("mapAsyncGeneratorParallel", () => {
  it("empty generator", async () => {
    const emptyIterator = async function* () {};
    const results = await mapAsyncGeneratorParallel(() => {}, emptyIterator());

    assert.deepStrictEqual(results, []);
  });

  it("single value generator", async () => {
    const singleValueIterator = async function* () {
      yield 1;
    };
    const results = await mapAsyncGeneratorParallel((value) => value + 1, singleValueIterator());

    assert.deepStrictEqual(results, [2]);
  });

  it("multi value async", async () => {
    const multiValueIterator = async function* () {
      yield 6;
      yield 4;
      yield 2;
    };

    const outputOrder: number[] = [];

    const results = await mapAsyncGeneratorParallel(
      (delay) =>
        new Promise<number>((resolve) =>
          setTimeout(() => {
            outputOrder.push(delay);
            resolve(delay);
          }, delay)
        ),
      multiValueIterator()
    );

    assert.deepStrictEqual(results, [6, 4, 2]);
    assert.deepStrictEqual(outputOrder, [2, 4, 6]);
  });
});

describe("exhaustGenerator", () => {
  it("empty generator", async () => {
    const emptyGenerator = async function* () {};
    assert.doesNotReject(async () => await exhaustGenerator(emptyGenerator()));
  });

  it("single value generator", async () => {
    const results: any[] = [];
    const singleValueGenerator = async function* () {
      yield 1;
      results.push(1);
    };
    await exhaustGenerator(singleValueGenerator());

    assert.deepStrictEqual(results, [1]);
  });

  it("multi value generator", async () => {
    const results: any[] = [];
    const multiValueGenerator = async function* () {
      yield 1;
      results.push(1);
      yield 2;
      results.push(2);
      yield 3;
      results.push(3);
    };
    await exhaustGenerator(multiValueGenerator());

    assert.deepStrictEqual(results, [1, 2, 3]);
  });
});
