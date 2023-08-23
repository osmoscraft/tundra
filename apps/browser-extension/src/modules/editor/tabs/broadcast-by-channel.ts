export function until<T>(channel: BroadcastChannel, handler: (message: T) => boolean | Promise<boolean>) {
  const handleEvent = async (e: MessageEvent<any>) => {
    const isHandled = await handler(e.data);
    if (isHandled) {
      channel.removeEventListener("message", handleEvent);
    }
  };

  channel.addEventListener("message", handleEvent);
}

export function broadcast<T>(channel: BroadcastChannel, message: T) {
  channel.postMessage(message);
}
