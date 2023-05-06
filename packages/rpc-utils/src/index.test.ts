import assert from "node:assert";
import { describe, it } from "node:test";
import { createClient } from ".";

describe(() => {
  it("Client/Empty", () => {
    const handlers = {};

    const testClient = createClient<typeof handlers>();
    assert(testClient);
  });
});
