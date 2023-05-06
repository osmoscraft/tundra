import assert from "node:assert";
import { describe, it } from "node:test";
import { createClient, createServer } from ".";
import { MockClientPort, MockServerPort } from "./test-utils";

describe("Creation", () => {
  it("Empty", () => {
    const handlers = {};

    const serverPort = new MockServerPort();
    createServer(handlers, serverPort);
    const testClient = createClient<typeof handlers>(new MockClientPort(serverPort));
    assert.ok(testClient);
  });

  it("With handler", () => {
    const handlers = {
      sayHello: () => "hello",
    };
    const serverPort = new MockServerPort();
    createServer(handlers, serverPort);
    const testClient = createClient<typeof handlers>(new MockClientPort(serverPort));
    assert.ok(testClient.sayHello);
  });

  it("With async handler", () => {
    const handlers = {
      sayHello: async () => "hello",
    };
    const serverPort = new MockServerPort();
    const testClient = createClient<typeof handlers>(new MockClientPort(serverPort));
    assert.ok(testClient.sayHello);
  });
});

describe("RPC", () => {
  it("Sync handler", async () => {
    const handlers = {
      sayHello: () => "hello",
    };
    const serverPort = new MockServerPort();

    const testClient = createClient<typeof handlers>(new MockClientPort(serverPort));
    createServer(handlers, serverPort);

    assert.strictEqual(await testClient.sayHello(), "hello");
  });

  it("Sync to Async conversion", () => {
    const handlers = {
      sayHello: () => "hello",
    };
    const serverPort = new MockServerPort();
    createServer(handlers, serverPort);
    const testClient = createClient<typeof handlers>(new MockClientPort(serverPort));
    assert.ok(testClient.sayHello().then);
  });

  it("Async handler", async () => {
    const handlers = {
      sayHello: () => Promise.resolve("hello"),
    };
    const serverPort = new MockServerPort();

    const testClient = createClient<typeof handlers>(new MockClientPort(serverPort));
    createServer(handlers, serverPort);

    assert.strictEqual(await testClient.sayHello(), "hello");
  });

  it("Sync error handling", async () => {
    const handlers = {
      sayHello: (() => {
        throw new Error("Mock error");
      }) as () => string,
    };
    const serverPort = new MockServerPort();

    const testClient = createClient<typeof handlers>(new MockClientPort(serverPort));
    createServer(handlers, serverPort);

    assert.strictEqual(await testClient.sayHello(), "hello");
  });
});
