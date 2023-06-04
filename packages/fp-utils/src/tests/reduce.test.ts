import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getChunkReducer } from "../lib/reduce";

describe("getChunkReducer", () => {
  const runTest = (chunkSize: number, items: any[], expected: any) => {
    const reducer = getChunkReducer(chunkSize);
    const result = items.reduce(reducer, []);
    assert.deepEqual(result, expected);
  };

  it("malformed initial chunk, empty input", () => {
    const reducer = getChunkReducer(10);
    const items: number[] = [];
    const result = items.reduce(reducer, [[]] as number[][]);
    assert.deepEqual(result, [[]]);
  });

  it("malformed initial chunk", () => {
    const reducer = getChunkReducer(10);
    const items = [1, 2, 3, 4, 5];
    const result = items.reduce(reducer, [[]] as number[][]);
    assert.deepEqual(result, [[1, 2, 3, 4, 5]]);
  });

  it("empty input array", () => {
    runTest(2, [], []);
  });

  it("chunk size of 1", () => {
    runTest(1, [1, 2, 3, 4, 5], [[1], [2], [3], [4], [5]]);
  });

  it("chunk size greater than input array length", () => {
    runTest(10, [1, 2, 3, 4, 5], [[1, 2, 3, 4, 5]]);
  });

  it("chunk size equal to input array length", () => {
    runTest(5, [1, 2, 3, 4, 5], [[1, 2, 3, 4, 5]]);
  });

  it("input array length is multiple of chunk size", () => {
    runTest(
      2,
      [1, 2, 3, 4],
      [
        [1, 2],
        [3, 4],
      ]
    );
  });

  it("input array length is not multiple of chunk size", () => {
    runTest(
      3,
      [1, 2, 3, 4, 5],
      [
        [1, 2, 3],
        [4, 5],
      ]
    );
  });

  it("input array with different data types", () => {
    runTest(
      2,
      ["a", 1, { key: "value" }, true],
      [
        ["a", 1],
        [{ key: "value" }, true],
      ]
    );
  });
});
