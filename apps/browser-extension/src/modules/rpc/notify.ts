export function notify<NotificationType>(eventTarget: Worker | DedicatedWorkerGlobalScope, message: NotificationType) {
  eventTarget.postMessage(message);
}

let currentMessageId = 0; // must be unique across the app
export function request<RequestType, ResponseType>(
  eventTarget: Worker | DedicatedWorkerGlobalScope,
  request: RequestType
) {
  currentMessageId++;
  if (currentMessageId > Number.MAX_SAFE_INTEGER) {
    currentMessageId = 1; // wrap around
  }

  return new Promise<ResponseType>((resolve) => {
    const messageId = currentMessageId;
    const onceListener = (message: MessageEvent) => {
      const { _mid, ...restOfMessage } = message.data;
      if (_mid === messageId) {
        eventTarget.removeEventListener("message", onceListener as EventListener);
        resolve(restOfMessage);
      }
    };
    eventTarget.addEventListener("message", onceListener as EventListener);
    eventTarget.postMessage({ ...request, _mid: messageId });
  });
}

export function respond<ResponseType>(
  eventTarget: Worker | DedicatedWorkerGlobalScope,
  request: any,
  response: ResponseType
) {
  return notify(eventTarget, { ...response, _mid: request._mid });
}
