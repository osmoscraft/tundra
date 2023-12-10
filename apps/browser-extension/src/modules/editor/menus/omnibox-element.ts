import { MenuActionMode, getMenuActionMode } from "./menu-action";
import "./omnibox-element.css";
import template from "./omnibox-element.html";

export type QueryEventDetail = string;

declare global {
  interface HTMLElementEventMap {
    "omnibox.input": CustomEvent<string>;
    "omnibox.close": Event;
    "omnibox.submit": CustomEvent<OmniboxSubmitEvent>;
    "omnibox.navigate": CustomEvent<number>; // offset is -1 or 1
  }
}

export interface OmniboxSubmitEvent {
  value: string;
  submitMode: MenuActionMode;
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
        }),
      );
    });

    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (this.input.value) {
          e.preventDefault();
          this.setValue("");
        }
      }
      if (e.key === "Enter") {
        e.preventDefault();
        this.dispatchEvent(
          new CustomEvent<OmniboxSubmitEvent>("omnibox.submit", {
            detail: {
              value: this.input.value.trim(),
              submitMode: getMenuActionMode(e),
            },
          }),
        );
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        this.dispatchEvent(new CustomEvent<number>("omnibox.navigate", { detail: -1 }));
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.dispatchEvent(new CustomEvent<number>("omnibox.navigate", { detail: 1 }));
      }
    });
  }

  setValue(value: string) {
    this.input.value = value;
    this.dispatchEvent(new CustomEvent<QueryEventDetail>("omnibox.input", { detail: this.input.value.trim() }));
  }

  getValue() {
    return this.input.value.trim();
  }

  focus() {
    this.input.focus();
  }
}
