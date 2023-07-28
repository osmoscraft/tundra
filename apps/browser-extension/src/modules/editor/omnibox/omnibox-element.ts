import template from "./omnibox-element.html";
import { getEventMode, type SubmitMode } from "./submit-mode";

export type QueryEventDetail = string;

declare global {
  interface HTMLElementEventMap {
    "omnibox.input": CustomEvent<string>;
    "omnibox.close": Event;
    "omnibox.submit": CustomEvent<OmniboxSubmitEvent>;
  }
}

export interface OmniboxSubmitEvent {
  value: string;
  submitMode: SubmitMode;
}

export class OmniboxElement extends HTMLElement {
  private form: HTMLFormElement;
  private input: HTMLInputElement;

  constructor() {
    super();
    this.innerHTML = template;
    this.form = this.querySelector("form")!;
    this.input = this.form.querySelector(`input[type="search"]`) as HTMLInputElement;
  }

  connectedCallback() {
    this.form.addEventListener("submit", (e) => {
      // handled by keydown
      e.preventDefault();
    });

    this.input.addEventListener("input", (e) => {
      this.dispatchEvent(
        new CustomEvent<QueryEventDetail>("omnibox.input", {
          detail: this.input.value.trim(),
        })
      );
    });

    this.input.addEventListener("focus", (e) => {
      this.dispatchEvent(new CustomEvent<QueryEventDetail>("omnibox.input", { detail: this.input.value.trim() }));
    });

    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (this.input.value) {
          e.preventDefault();
          this.input.value = "";
        } else {
          e.preventDefault();
          this.dispatchEvent(new Event("omnibox.close"));
        }
      }
      if (e.key === "Enter") {
        e.preventDefault();
        this.dispatchEvent(
          new CustomEvent<OmniboxSubmitEvent>("omnibox.submit", {
            detail: {
              value: this.input.value.trim(),
              submitMode: getEventMode(e),
            },
          })
        );
      }
    });
  }

  clear() {
    this.input.value = "";
  }

  open(initialValue?: string) {
    if (initialValue !== undefined) this.input.value = initialValue;
    this.input.focus();
  }

  focus() {
    this.input.focus();
  }
}
