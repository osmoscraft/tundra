import { event } from "../event/event-factories";

/**
 * Event dispatched from any modal element when user intends to exit the modal area.
 * preventDefault should cancel the exit
 */
export const uiModalExitEvent = () => event("ui.modal.exit", { bubbles: true });

export class FocusTrapElement extends HTMLElement {
  private cachedElement: HTMLElement | null = null;

  connectedCallback() {
    this.cachedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    this.append(FocusTrapElement.createSentinel(() => this.queryFocusableChildren()[0]?.focus()));
    this.prepend(FocusTrapElement.createSentinel(() => [...this.queryFocusableChildren()].pop()?.focus()));

    // handle Escape to close
    this.addEventListener("keydown", (e) => {
      if (e.code === "Escape") {
        this.dispatchEvent(uiModalExitEvent());
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
    return this.querySelectorAll<HTMLElement>(
      `:where(a[href], button, input, textarea, select, details,[tabindex]:not([tabindex="-1"])):not([data-is-sentinel])`
    );
  }
}
