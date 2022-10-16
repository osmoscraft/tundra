export class DialogElement extends HTMLElement {
  private cachedElement: HTMLElement | null = null;

  connectedCallback() {
    this.cachedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    this.append(DialogElement.createSentinel(() => this.queryFocusableChildren()[0]?.focus()));
    this.prepend(DialogElement.createSentinel(() => [...this.queryFocusableChildren()].pop()?.focus()));

    // handle Escape to close
    this.addEventListener("keydown", (e) => {
      if (e.code === "Escape") {
        this.dispatchEvent(new Event("close-focus-trap-request", { bubbles: true }));
      }
    });

    // Start by focusing on the first element
    this.queryFocusableChildren()[0]?.focus();
  }
  disconnectedCallback() {
    this.cachedElement?.focus();
  }

  static createSentinel(onFocus: EventListener) {
    const sentinel = document.createElement("span");
    sentinel.tabIndex = 0;
    sentinel.setAttribute("data-is-sentinel", "");
    sentinel.addEventListener("focus", onFocus);
    return sentinel;
  }

  private queryFocusableChildren() {
    return this.querySelectorAll<HTMLElement>(`a[href], button, input, textarea, select, details,[tabindex]:not([tabindex="-1"]):not([data-is-sentinel])`);
  }
}
