import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { array } from "../lib/array";

describe("array", () => {
  it("undefined", async () => {
    assert.deepEqual(array(undefined), [undefined]);
  });

  it("empty", async () => {
    assert.deepEqual(array([]), []);
  });

  it("single", async () => {
    assert.deepEqual(array(1), [1]);
  });

  it("multiple", async () => {
    assert.deepEqual(array([1, 2, 3]), [1, 2, 3]);
  });

  it("nested", async () => {
    assert.deepEqual(array([1, [2, 3]]), [1, [2, 3]]);
  });
});
