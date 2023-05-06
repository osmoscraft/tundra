import type { IServerPort } from ".";

export class MockClientPort {
  constructor(private mockServerPort: MockServerPort) {}

  send(data: any) {
    const response = this.mockServerPort.receive(data);
    return response;
  }
}

export class MockServerPort implements IServerPort {
  private handlers: any = {};

  async receive(data: any) {
    const { prop, args } = data;
    return this.handlers[prop](...args);
  }

  bind(handlers: any) {
    this.handlers = handlers;
  }
}
