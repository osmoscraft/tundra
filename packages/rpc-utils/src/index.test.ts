import assert from "node:assert";
import { describe, it } from "node:test";
import { createPeer } from ".";

describe(() => {
  it("Creates peer", () => {
    const testPeer = createPeer({
      handlers: {},
      remote: null,
    });
    assert(testPeer);
  });

  it("Add router", () => {
    const testPeer = createPeer({
      handlers: {},
      remote: null,
    });
    assert(testPeer);
  });

  it("Call remote", () => {
    const testPeer = createPeer({
      handlers: {
        doSomething: () => {},
      },
      remote: null,
    });
  });
});
