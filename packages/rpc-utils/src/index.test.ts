import assert from "node:assert";
import { describe, it } from "node:test";
import { rx, tx } from ".";
import { getMockChannelPair } from "./channel";

describe("Setup", () => {
  it("Start and stop tx", () => {
    const { proxy, stop } = tx({
      channel: getMockChannelPair()[0],
    });

    assert.ok(proxy);
    assert.doesNotThrow(stop);
  });

  it("Start and stop rx", () => {
    const { stop } = rx({
      channel: getMockChannelPair()[0],
      handlers: {},
    });

    assert.doesNotThrow(stop);
  });
});

describe("RPC", () => {
  it("Sync call", async () => {
    const [channel1, channel2] = getMockChannelPair();

    const handlers = {
      ping: () => "pong",
    };

    const { stop: stopRx } = rx({
      channel: channel1,
      handlers,
    });

    const { proxy, stop: stopTx } = tx<typeof handlers>({
      channel: channel2,
    });

    assert.strictEqual(await proxy.ping(), "pong");

    stopRx();
    stopTx();
  });

  it("Async call", async () => {
    const [channel1, channel2] = getMockChannelPair();

    const handlers = {
      ping: () => Promise.resolve("pong"),
    };

    rx({
      channel: channel1,
      handlers,
    });

    const { proxy } = tx<typeof handlers>({
      channel: channel2,
    });

    assert.strictEqual(await proxy.ping(), "pong");
  });

  it("Async call parellelism", async () => {
    const [channel1, channel2] = getMockChannelPair();

    const results: string[] = [];

    const handlers = {
      pingFast: () => Promise.resolve("fast"),
      pingSlow: () => new Promise((resolve) => setTimeout(() => resolve("pong"), 1)),
    };

    rx({
      channel: channel1,
      handlers,
    });

    const { proxy } = tx<typeof handlers>({
      channel: channel2,
    });

    const slow = proxy.pingSlow().then(() => results.push("slow"));
    const fast = proxy.pingFast().then(() => results.push("fast"));

    await Promise.all([slow, fast]);

    assert.deepEqual(results, ["fast", "slow"]);
  });
});

describe("Error handling", () => {
  it("Reject without reason", async () => {
    const [channel1, channel2] = getMockChannelPair();

    const handlers = {
      ping: () => Promise.reject(),
    };

    rx({
      channel: channel1,
      handlers,
    });

    const { proxy } = tx<typeof handlers>({
      channel: channel2,
    });

    assert.rejects(proxy.ping);

    const e = await proxy.ping().catch((e) => e);
    assert.strictEqual(e, undefined);
  });

  it("Reject non-error value", async () => {
    const [channel1, channel2] = getMockChannelPair();

    const handlers = {
      ping: () => Promise.reject("broken"),
    };

    rx({
      channel: channel1,
      handlers,
    });

    const { proxy } = tx<typeof handlers>({
      channel: channel2,
    });

    assert.rejects(proxy.ping);

    const e = await proxy.ping().catch((e) => e);
    assert.strictEqual(e, "broken");
  });

  it("Reject error value", async () => {
    const [channel1, channel2] = getMockChannelPair();

    const handlers = {
      ping: () => Promise.reject(new Error("broken")),
    };

    rx({
      channel: channel1,
      handlers,
    });

    const { proxy } = tx<typeof handlers>({
      channel: channel2,
    });

    assert.rejects(proxy.ping);

    const e = await proxy.ping().catch((e) => e);
    assert.ok(e instanceof Error);
    assert.strictEqual(e.name, "Error");
    assert.strictEqual(e.message, "broken");
  });

  it("Throw undefined", async () => {
    const [channel1, channel2] = getMockChannelPair();

    const handlers = {
      ping: (() => {
        throw undefined;
      }) as () => any,
    };

    rx({
      channel: channel1,
      handlers,
    });

    const { proxy } = tx<typeof handlers>({
      channel: channel2,
    });

    assert.rejects(proxy.ping);

    const e = await proxy.ping().catch((e) => e);
    assert.strictEqual(e, undefined);
  });

  it("Throw non-error value", async () => {
    const [channel1, channel2] = getMockChannelPair();

    const handlers = {
      ping: (() => {
        throw "broken";
      }) as () => any,
    };

    rx({
      channel: channel1,
      handlers,
    });

    const { proxy } = tx<typeof handlers>({
      channel: channel2,
    });

    assert.rejects(proxy.ping);

    const e = await proxy.ping().catch((e) => e);
    assert.strictEqual(e, "broken");
  });

  it("Throw error value", async () => {
    const [channel1, channel2] = getMockChannelPair();

    const handlers = {
      ping: (() => {
        const e = new Error("broken");
        throw e;
      }) as () => any,
    };

    rx({
      channel: channel1,
      handlers,
    });

    const { proxy } = tx<typeof handlers>({
      channel: channel2,
    });

    assert.rejects(proxy.ping);

    const e = await proxy.ping().catch((e) => e);
    assert.ok(e instanceof Error);
    assert.strictEqual(e.name, "Error");
    assert.strictEqual(e.message, "broken");
  });
});
