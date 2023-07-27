/**
 * Focus will cycle within the trap until the focus trap is removed from the DOM.
 * It also remembers the currently focused element.
 * Later, when focus trap is removed from the DOM, it restore focus to that remembered element.
 *
 * Known issue: if the first or the last focusable element in the trap has `display:none`, the focus behavior becomes undefined. Please avoid using hidden focusable element in the DOM when using focus trap.
 */
export class FocusTrapElement extends HTMLElement {
  static createSentinel(onFocus: EventListener) {
    const sentinel = document.createElement("span");
    sentinel.tabIndex = 0;
    sentinel.setAttribute("data-is-sentinel", "");
    sentinel.addEventListener("focus", onFocus);
    return sentinel;
  }

  connectedCallback() {
    // Clean up existing sentiel because knockout might save the sentinels as part of the `if` binding result
    // We must ensure there is only one set of the sentinels when mounting the trap
    this.querySelectorAll(`[data-is-sentinel]`).forEach((e) => e.remove());

    this.append(FocusTrapElement.createSentinel(() => this.queryFocusableChildren()[0]?.focus()));
    this.prepend(FocusTrapElement.createSentinel(() => [...this.queryFocusableChildren()].pop()?.focus()));

    /**
		 * Upon first focusin, prevent focus from moving outside of the trap
		 * This behavior is decoupled from closing of a modal
		 * So a separate logic should decide whether to close a modal when user clicks outside
		 * 
		 |          Trigger by | relatedTaget | activeElement | Need to bring focus back |
		 | Click space outside | null         | body          | Y                        |
		 |  Click elem outside | that elem    | body          | Y                        |
		 |  Click space inside | main elem    | body          | Y                        |
		 |   Click elem inside | that elem    | body          | N                        |
		 |  Tab to elem inside | that elem    | body          | N                        |
		 |    Blur browser tab | null         | current elem  | N                        |
		 */
    this.addEventListener("focusin", this.handleFocusIn);
  }

  private handleFocusout = ((e: FocusEvent) => {
    // Click space outside or inside
    if (e.relatedTarget === null && document.activeElement === document.body) {
      this.queryFocusableChildren()[0]?.focus();
    }

    // Click elem outside
    if (e.relatedTarget !== null && !this.contains(e.relatedTarget as Node)) {
      this.queryFocusableChildren()[0]?.focus();
    }
  }).bind(this);

  private handleFocusIn = ((e: FocusEvent) => {
    this.addEventListener("focusout", this.handleFocusout);
    this.removeEventListener("focusin", this.handleFocusIn);
  }).bind(this);

  private queryFocusableChildren() {
    return this.querySelectorAll<HTMLElement>(
      `a[href], button, input, textarea, select, details,[tabindex]:not([tabindex="-1"]):not([data-is-sentinel])`
    );
  }
}
