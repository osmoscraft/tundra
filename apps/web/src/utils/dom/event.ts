import { curry } from "../functional/curry";

export function preventDefault(event: Event) {
  event.preventDefault();
  return event;
}

export const closestTarget = curry((selector: string, event: Event) => (event.target as Element)?.closest(selector) ?? null);
