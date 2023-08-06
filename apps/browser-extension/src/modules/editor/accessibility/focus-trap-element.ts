export class FocusTrapElement extends HTMLElement {
  static createSentinel(onFocus: EventListener) {
    const sentinel = document.createElement("span");
    sentinel.tabIndex = 0;
    sentinel.setAttribute("data-is-sentinel", "");
    sentinel.addEventListener("focus", onFocus);
    return sentinel;
  }

  connectedCallback() {
    this.append(
      FocusTrapElement.createSentinel(() => {
        this.queryFocusableChildren()[0]?.focus();
      })
    );
    this.prepend(
      FocusTrapElement.createSentinel(() => {
        // This head element forwards the auto-focus behavior of the modal element to the first focusable child
        this.queryFocusableChildren()[0]?.focus();
      }),
      FocusTrapElement.createSentinel(() => {
        [...this.queryFocusableChildren()].pop()?.focus();
      })
    );
  }

  private queryFocusableChildren() {
    const allowFilters = `:where(a[href], button, [contenteditable="true"], input, textarea, select, details, [tabindex]:not([tabindex="-1"])):not([data-is-sentinel])`;
    const blockFilters = `:not(dialog:not([open]) *)`;

    return this.querySelectorAll<HTMLElement>(`${allowFilters}${blockFilters}`);
  }
}
