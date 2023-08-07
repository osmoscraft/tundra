export interface NavigateOptions {}

declare global {
  interface HTMLElementEventMap {
    "router.change": CustomEvent<RouterChangeDetails>;
  }
}

export interface NavigateEventInit {
  url: string | URL;
  /** @default false */
  replace?: boolean;
}

export interface RouterChangeDetails {
  url: string;
}

export class RouterElement extends HTMLElement {
  connectedCallback() {
    window.addEventListener("popstate", (e) => {
      this.dispatchEvent(new CustomEvent<RouterChangeDetails>("router.change", { detail: { url: location.href } }));
    });
  }

  push(url: string | URL) {
    const newUrl = url.toString();
    history.pushState(null, "", newUrl);
    this.dispatchEvent(new CustomEvent<RouterChangeDetails>("router.change", { detail: { url: newUrl } }));
  }
  replace(url: string | URL) {
    const newUrl = url.toString();
    history.replaceState(null, "", newUrl);
    this.dispatchEvent(new CustomEvent<RouterChangeDetails>("router.change", { detail: { url: newUrl } }));
  }

  onRouteChange(listener: (e: CustomEvent<RouterChangeDetails>) => void) {
    this.addEventListener("router.change", listener as EventListener);
  }
}
