export function dispatchCustom<T>(eventTarget: EventTarget, type: string, detail?: T) {
  const event = new CustomEvent(type, { detail });
  eventTarget.dispatchEvent(event);
}
