declare global {
  interface HTMLElementEventMap {
    "focus-observer-blur": CustomEvent<FocusObserverBlurEvent>;
  }
}

export interface FocusObserverBlurEvent {
  relatedTarget: Node | null; // null when dismissed or window-blurred
  reason: "window-blurred" | "dismissed" | "outside-focused";
}

export enum BlurReason {
  /* User switches app or opens dev tool */
  WindowBlurred = "window-blurred",
  /* User clicks non-interactive element */
  Dismissed = "dismissed",
  /* User clicks interactive element outside of the observer */
  OutsideFocused = "outside-focused",
}

/**
 * Upon first focusin, prevent focus from moving outside of the trap
 * This behavior is decoupled from closing of a modal
 * So a separate logic should decide whether to close a modal when user clicks outside
 *
 *          Trigger by | relatedTaget | activeElement
 * Click space outside | null         | body
 *  Click space inside | null*        | body
 *  Click elem outside | that elem    | body
 *   Click elem inside | that elem    | body
 *  Tab to elem inside | that elem    | body
 *    Blur browser tab | null         | current elem
 *
 * (*) Click space inside a dialog will set dialog as relatedTarget because dialog is considered interactive
 */
export class FocusObserverElement extends HTMLElement {
  connectedCallback() {
    this.addEventListener("focusout", this.handleFocusout);
  }

  disconnectedCallback() {
    this.removeEventListener("focusout", this.handleFocusout);
  }

  private handleFocusout = ((e: FocusEvent) => {
    if (e.relatedTarget !== null && !this.contains(e.relatedTarget as Node)) {
      this.dispatchEvent(
        new CustomEvent<FocusObserverBlurEvent>("focus-observer-blur", {
          detail: { relatedTarget: e.relatedTarget as Node, reason: BlurReason.OutsideFocused },
        })
      );
    } else if (e.relatedTarget === null && document.activeElement === document.body) {
      this.dispatchEvent(
        new CustomEvent<FocusObserverBlurEvent>("focus-observer-blur", {
          detail: { relatedTarget: null, reason: BlurReason.Dismissed },
        })
      );
    } else if (e.relatedTarget === null && document.activeElement !== document.body) {
      this.dispatchEvent(
        new CustomEvent<FocusObserverBlurEvent>("focus-observer-blur", {
          detail: { relatedTarget: null, reason: BlurReason.WindowBlurred },
        })
      );
    }
  }).bind(this);
}
