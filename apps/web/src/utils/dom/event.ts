export function preventDefault(event: Event) {
  event.preventDefault();
  return event;
}

export function closestTarget<T extends Element>(selector: string, event: Event): T | null {
  return (event.target as Element)?.closest(selector) ?? null;
}
