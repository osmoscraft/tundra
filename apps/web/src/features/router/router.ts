import { closestTarget } from "../../utils/dom/event";

export const routeSubject = new EventTarget();

export function pushUrl(url: string) {
  window.history.pushState(undefined, "", url);
  routeSubject.dispatchEvent(new Event("afterRouteChange"));
}

export function replaceUrl(url: string) {
  window.history.replaceState(undefined, "", url);
  routeSubject.dispatchEvent(new Event("afterRouteChange"));
}

export function onPopState(_event: PopStateEvent) {
  routeSubject.dispatchEvent(new Event("afterRouteChange"));
}

export function getInternalHrefFromClick(e: MouseEvent): string | null {
  return closestTarget(`a[href]:not([rel="external"])`, e)?.getAttribute("href") ?? null;
}

export function selectInternalHrefClick(e: MouseEvent): MouseEvent | null {
  return closestTarget(`a[href]:not([rel="external"])`, e) ? e : null;
}
