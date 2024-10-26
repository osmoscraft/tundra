export interface NavigateOptions {}

declare global {
  interface HTMLElementEventMap {
    "router.afterunload": Event;
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
  private mostRecentUrl = window.location.href;

  connectedCallback() {
    window.addEventListener("popstate", () => {
      if (!this.canNavigate()) {
        history.replaceState(null, "", this.mostRecentUrl);
        return;
      }

      this.dispatchEvent(new CustomEvent<RouterChangeDetails>("router.change", { detail: { url: location.href } }));
    });

    this.addEventListener("router.change", () => {
      this.mostRecentUrl = location.href;
    });
  }

  reload() {
    this.dispatchEvent(new CustomEvent<RouterChangeDetails>("router.change", { detail: { url: location.href } }));
  }

  push(url: string | URL) {
    if (!this.canNavigate()) return;
    const newUrl = url.toString();
    history.pushState(null, "", newUrl);
    this.dispatchEvent(new CustomEvent<RouterChangeDetails>("router.change", { detail: { url: newUrl } }));
  }

  replace(url: string | URL) {
    if (!this.canNavigate()) return;
    const newUrl = url.toString();
    history.replaceState(null, "", newUrl);
    this.dispatchEvent(new CustomEvent<RouterChangeDetails>("router.change", { detail: { url: newUrl } }));
  }

  onRouteChange(listener: (e: CustomEvent<RouterChangeDetails>) => void) {
    this.addEventListener("router.change", listener as EventListener);
  }

  private canNavigate() {
    // Due to history API quirks, preventDefault has no effect for Back/Forward SPA navigation
    // We can only fire "afterunload" event and tell user what happened. Then undo the navigation later.
    const afterunloadEvent = new Event("router.afterunload", { cancelable: true });
    this.dispatchEvent(afterunloadEvent);
    if (afterunloadEvent.defaultPrevented) {
      // at this point, the URL is already updated, but we create the illusion that it will be uploaded.
      return window.confirm("Leave page? Changes you made may not be saved.");
    }

    return true;
  }
}
