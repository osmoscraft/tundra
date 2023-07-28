export class FocusTrapElement extends HTMLElement {
  static createSentinel(onFocus: EventListener) {
    const sentinel = document.createElement("span");
    sentinel.tabIndex = 0;
    sentinel.setAttribute("data-is-sentinel", "");
    sentinel.addEventListener("focus", onFocus);
    return sentinel;
  }

  connectedCallback() {
    this.append(FocusTrapElement.createSentinel(() => this.queryFocusableChildren()[0]?.focus()));
    this.prepend(FocusTrapElement.createSentinel(() => [...this.queryFocusableChildren()].pop()?.focus()));
  }

  private queryFocusableChildren() {
    return this.querySelectorAll<HTMLElement>(
      `:where(a[href], button, input, textarea, select, details,[tabindex]:not([tabindex="-1"])):not([data-is-sentinel])`
    );
  }
}
