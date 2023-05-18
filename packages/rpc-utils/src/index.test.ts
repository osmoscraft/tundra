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

describe("Complex network", () => {
  it("Single duplex connection", async () => {
    const { port1, port2, inspect } = getMockPorts();

    const records: string[] = [];

    const routes1 = {
      ping: () => {
        records.push("A1");
      },
    };
    const routes2 = {
      ping: () => records.push("B1"),
    };

    server({
      port: port1,
      routes: routes1,
    });
    server({
      port: port2,
      routes: routes2,
    });

    console.log(inspect());

    const { proxy: routes1Proxy } = client<typeof routes1>({
      port: port2,
    });
    const { proxy: routes2Proxy } = client<typeof routes2>({
      port: port1,
    });

    await routes1Proxy.ping();
    assert.deepEqual(records, ["A1"]);

    await routes2Proxy.ping();
    assert.deepEqual(records, ["A1", "B1"]);
  });

  it("Multiple connections", async () => {
    const { port1: portA1, port2: portA2 } = getMockPorts();
    const { port1: portB1, port2: portB2 } = getMockPorts();

    const records: string[] = [];

    const routesA1 = {
      ping: () => records.push("A1"),
    };
    const routesB1 = {
      ping: () => records.push("B1"),
    };

    server({
      port: portA1,
      routes: routesA1,
    });
    server({
      port: portB1,
      routes: routesB1,
    });

    const { proxy: portA1Proxy } = client<typeof routesA1>({
      port: portA2,
    });
    const { proxy: portB1Proxy } = client<typeof routesB1>({
      port: portB2,
    });

    await portA1Proxy.ping();
    assert.deepEqual(records, ["A1"]);

    await portB1Proxy.ping();
    assert.deepEqual(records, ["A1", "B1"]);
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
