export interface NavigateOptions {}

declare global {
  interface HTMLElementEventMap {
    "router.navigate": CustomEvent<NavigateEventInit>;
  }
}

export interface NavigateEventInit {
  url: string | URL;
  /** @default false */
  replace?: boolean;
}

export class RouterElement extends HTMLElement {
  constructor() {
    super();

    this.addEventListener("router.navigate", (e) => {
      const { url, replace } = e.detail;
      if (replace) {
        // TODO implement with navigation handlers
        location.replace(url.toString());
        // history.replaceState({}, "", url.toString());
      } else {
        // history.pushState({}, "", url.toString());
        location.assign(url.toString());
      }
    });
  }
}

export function navigate(fromElement: EventTarget, config: NavigateEventInit) {
  fromElement.dispatchEvent(new CustomEvent<NavigateEventInit>("router.navigate", { detail: config, bubbles: true }));
}
