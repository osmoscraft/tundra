import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { client } from "./client";
import { getMockPorts } from "./ports";
import { server } from "./server";

describe("Setup", () => {
  it("Start and stop tx", () => {
    const { proxy, stop } = client({
      port: getMockPorts().port1,
    });

    assert.ok(proxy);
    assert.doesNotThrow(stop);
  });

  it("Start and stop rx", () => {
    const { stop } = server({
      port: getMockPorts().port1,
      routes: {},
    });

    assert.doesNotThrow(stop);
  });
});

describe("RPC", () => {
  it("Sync call", async () => {
    const { port1, port2 } = getMockPorts();

    const routes = {
      ping: () => "pong",
    };

    server({
      port: port1,
      routes,
    });

    const { proxy, stop } = client<typeof routes>({
      port: port2,
    });

    assert.strictEqual(await proxy.ping(), "pong");
  });

  it("Arguments passing", async () => {
    const { port1, port2 } = getMockPorts();

    const result: any[] = [];

    const routes = {
      saveArgs: (...args: any[]) => result.push(...args),
    };

    server({
      port: port1,
      routes,
    });

    const { proxy, stop } = client<typeof routes>({
      port: port2,
    });

    await proxy.saveArgs(1, null, "test", { a: 42 }, true);
    assert.deepEqual(result, [1, null, "test", { a: 42 }, true]);
  });

  it("Async call", async () => {
    const { port1, port2 } = getMockPorts();

    const routes = {
      ping: () => Promise.resolve("pong"),
    };

    server({
      port: port1,
      routes,
    });

    const { proxy } = client<typeof routes>({
      port: port2,
    });

    assert.strictEqual(await proxy.ping(), "pong");
  });

  it("Async call parellelism", async () => {
    const { port1, port2 } = getMockPorts();

    const results: string[] = [];

    const routes = {
      pingFast: () => Promise.resolve("fast"),
      pingSlow: () => new Promise((resolve) => setTimeout(() => resolve("pong"), 1)),
    };

    server({
      port: port1,
      routes,
    });

    const { proxy } = client<typeof routes>({
      port: port2,
    });

    const slow = proxy.pingSlow().then(() => results.push("slow"));
    const fast = proxy.pingFast().then(() => results.push("fast"));

    await Promise.all([slow, fast]);

    assert.deepEqual(results, ["fast", "slow"]);
  });

  it("Stop clears ports", async () => {
    const { port1, port2, inspect } = getMockPorts();

    const routes = {
      ping: () => "pong",
    };

    const { stop: stopRx } = server({
      port: port1,
      routes,
    });

    const { stop: stopTx } = client<typeof routes>({
      port: port2,
    });

    stopRx();
    stopTx();

    assert.strictEqual(inspect().port1Callbacks.length, 0);
    assert.strictEqual(inspect().port2Callbacks.length, 0);
  });
});

describe("Error handling", () => {
  it("Reject without reason", async () => {
    const { port1, port2 } = getMockPorts();

    const routes = {
      ping: () => Promise.reject(),
    };

    server({
      port: port1,
      routes,
    });

    const { proxy } = client<typeof routes>({
      port: port2,
    });

    assert.rejects(proxy.ping);

    const e = await proxy.ping().catch((e) => e);
    assert.strictEqual(e, undefined);
  });

  it("Reject non-error value", async () => {
    const { port1, port2 } = getMockPorts();

    const routes = {
      ping: () => Promise.reject("broken"),
    };

    server({
      port: port1,
      routes,
    });

    const { proxy } = client<typeof routes>({
      port: port2,
    });

    assert.rejects(proxy.ping);

    const e = await proxy.ping().catch((e) => e);
    assert.strictEqual(e, "broken");
  });

  it("Reject error value", async () => {
    const { port1, port2 } = getMockPorts();

    const routes = {
      ping: () => Promise.reject(new Error("broken")),
    };

    server({
      port: port1,
      routes,
    });

    const { proxy } = client<typeof routes>({
      port: port2,
    });

    assert.rejects(proxy.ping);

    const e = await proxy.ping().catch((e) => e);
    assert.ok(e instanceof Error);
    assert.strictEqual(e.name, "Error");
    assert.strictEqual(e.message, "broken");
  });

  it("Throw undefined", async () => {
    const { port1, port2 } = getMockPorts();

    const routes = {
      ping: (() => {
        throw undefined;
      }) as () => any,
    };

    server({
      port: port1,
      routes,
    });

    const { proxy } = client<typeof routes>({
      port: port2,
    });

    assert.rejects(proxy.ping);

    const e = await proxy.ping().catch((e) => e);
    assert.strictEqual(e, undefined);
  });

  it("Throw non-error value", async () => {
    const { port1, port2 } = getMockPorts();

    const routes = {
      ping: (() => {
        throw "broken";
      }) as () => any,
    };

    server({
      port: port1,
      routes,
    });

    const { proxy } = client<typeof routes>({
      port: port2,
    });

    assert.rejects(proxy.ping);

    const e = await proxy.ping().catch((e) => e);
    assert.strictEqual(e, "broken");
  });

  it("Throw error value", async () => {
    const { port1, port2 } = getMockPorts();

    const routes = {
      ping: (() => {
        const e = new Error("broken");
        throw e;
      }) as () => any,
    };

    server({
      port: port1,
      routes,
    });

    const { proxy } = client<typeof routes>({
      port: port2,
    });

    assert.rejects(proxy.ping);

    const e = await proxy.ping().catch((e) => e);
    assert.ok(e instanceof Error);
    assert.strictEqual(e.name, "Error");
    assert.strictEqual(e.message, "broken");
  });
});
