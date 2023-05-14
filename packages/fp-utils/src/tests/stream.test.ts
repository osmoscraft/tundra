import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { iteratorToStream, mapIteratorAsync } from "../lib/stream";

describe("map iterator", () => {
  it("empty iterator", async () => {
    const emptyIterator = async function* () {};
    const emptyMappedIterator = mapIteratorAsync(() => {}, emptyIterator());

    const results: any[] = [];
    for await (const value of emptyMappedIterator) {
      results.push(value);
    }

    assert.deepStrictEqual(results, []);
  });

  it("single value iterator", async () => {
    const singleValueIterator = async function* () {
      yield 1;
    };
    const singleValueMappedIterator = mapIteratorAsync((value) => value + 1, singleValueIterator());

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

    const multiValueMappedIterator = mapIteratorAsync(
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

describe("generator to stream", () => {
  it("empty generator", async () => {
    const emptyGenerator = async function* () {};
    const emptyStream = iteratorToStream(emptyGenerator());

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
    const singleValueStream = iteratorToStream(singleValueGenerator());

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
    const multiValueStream = iteratorToStream(multiValueGenerator());

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
