export class FocusObserverElement extends HTMLElement {
  connectedCallback() {
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
    console.log("focus out detected", e);
    // Click space outside or inside
    if (e.relatedTarget === null && document.activeElement === document.body) {
      console.log("clicked on non-interactive element", e);
    }

    // Click elem outside
    if (e.relatedTarget !== null && !this.contains(e.relatedTarget as Node)) {
      console.log("clicked on interactive element outside", e);
    }
  }).bind(this);

  private handleFocusIn = ((e: FocusEvent) => {
    this.addEventListener("focusout", this.handleFocusout);
    this.removeEventListener("focusin", this.handleFocusIn);
  }).bind(this);
}
