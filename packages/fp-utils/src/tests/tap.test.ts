import assert from "node:assert";
import { describe, it } from "node:test";
import { tap } from "../lib/tap";

describe("tap", () => {
  it("empty tap", () => {
    const emptyTap = tap(() => {});
    assert.strictEqual(typeof emptyTap, "function");
    assert.strictEqual(emptyTap(), undefined);
  });

  it("passthrough tap", () => {
    const passthroughTap = tap((a: any) => a);
    assert.strictEqual(typeof passthroughTap, "function");
    assert.strictEqual(passthroughTap(4), 4);
  });
});
