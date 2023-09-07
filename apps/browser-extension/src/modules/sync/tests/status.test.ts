import assert from "node:assert";
import { describe, it } from "node:test";
import { formatStatus } from "../status";

describe("formatStatus", () => {
  it("no diff/empty", () => {
    const status = formatStatus({
      canDiff: false,
      stats: { ahead: 0, conflict: 0, behind: 0, total: 0 },
    });
    assert.strictEqual(status, "0 total | local mode");
  });

  it("no diff/clean items", () => {
    const status = formatStatus({
      canDiff: false,
      stats: { ahead: 0, conflict: 0, behind: 0, total: 10 },
    });
    assert.strictEqual(status, "10 total | local mode");
  });

  it("no diff/mixed items", () => {
    const status = formatStatus({
      canDiff: false,
      stats: { ahead: 1, conflict: 2, behind: 3, total: 10 },
    });
    assert.strictEqual(status, "10 total | local mode");
  });

  it("diff/empty", () => {
    const status = formatStatus({
      canDiff: true,
      stats: { ahead: 0, conflict: 0, behind: 0, total: 0 },
    });
    assert.strictEqual(status, "0 total");
  });

  it("diff/mixed items", () => {
    const status = formatStatus({
      canDiff: true,
      stats: { ahead: 1, conflict: 2, behind: 3, total: 10 },
    });
    assert.strictEqual(status, "2 conflict | 3 in | 1 out | 10 total");
  });
});
