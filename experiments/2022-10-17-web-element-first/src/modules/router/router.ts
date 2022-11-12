import { defineEvent } from "../event/define-event";

export const routeAfterChangeEvent = defineEvent("route.afterChange", { bubbles: true });

export class RouterElement extends HTMLElement {
  start() {
    window.addEventListener("click", (e) => {
      const internalHref = (e.target as Element)?.closest<HTMLAnchorElement>(`a[href]:not(a[href^=http])`)?.href;
      if (e.ctrlKey || !internalHref) return;

      e.preventDefault();
      this.pushUrl(internalHref);
    });

    window.addEventListener("popstate", () => routeAfterChangeEvent.emit(this));

    routeAfterChangeEvent.emit(this);
  }

  pushUrl(url: string) {
    window.history.pushState(undefined, "", url);
    routeAfterChangeEvent.emit(this);
  }

  replaceUrl(url: string) {
    window.history.replaceState(undefined, "", url);
    routeAfterChangeEvent.emit(this);
  }
}
