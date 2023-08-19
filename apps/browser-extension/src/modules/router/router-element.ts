export interface NavigateOptions {}

declare global {
  interface HTMLElementEventMap {
    "router.beforeunload": Event;
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
      if (!this.canNavigate()) {
        e.preventDefault();
        return;
      }

      this.dispatchEvent(new CustomEvent<RouterChangeDetails>("router.change", { detail: { url: location.href } }));
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
    const willChangeEvent = new Event("router.beforeunload", { cancelable: true });
    this.dispatchEvent(willChangeEvent);
    if (willChangeEvent.defaultPrevented) {
      return window.confirm("Leave page? Changes you made may not be saved.");
    }

    return true;
  }
}
