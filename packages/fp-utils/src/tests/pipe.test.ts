import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { asyncPipe } from "../lib/pipe";

describe("asyncPipe", () => {
  it("empty", async () => {
    const mockPipe = asyncPipe(() => []);
    assert(typeof mockPipe !== "undefined");
  });

  it("single sync step", async () => {
    const mockPipe = asyncPipe((x: number) => x + 1);
    const output = await mockPipe(1);
    assert.strictEqual(output, 2);
  });

  it("single async step", async () => {
    const mockPipe = asyncPipe(async (x: number) => x + 1);
    const output = await mockPipe(1);
    assert.strictEqual(output, 2);
  });

  it("multi mixed steps", async () => {
    const mockPipe = asyncPipe(
      async (x: number) => x + 1,
      (x: number) => x * 2
    );
    const output = await mockPipe(1);
    assert.strictEqual(output, 4);
  });
});
