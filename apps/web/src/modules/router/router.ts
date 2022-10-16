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

    window.addEventListener("popstate", () => this.dispatchEvent(routeAfterChangeEvent.create()));

    this.dispatchEvent(routeAfterChangeEvent.create());
  }

  pushUrl(url: string) {
    window.history.pushState(undefined, "", url);
    this.dispatchEvent(routeAfterChangeEvent.create());
  }

  replaceUrl(url: string) {
    window.history.replaceState(undefined, "", url);
    this.dispatchEvent(routeAfterChangeEvent.create());
  }
}
