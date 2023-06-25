import { attachShadowHtml } from "@tinykb/dom-utils";
import template from "./omnibox-element.html";

export type QueryEventDetail = string;

declare global {
  interface HTMLElementEventMap {
    "omnibox-input": CustomEvent<QueryEventDetail>;
    "omnibox-exit": Event;
    "omnibox-submit": CustomEvent<QueryEventDetail>;
  }
}

export class OmniboxElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private form = this.shadowRoot.querySelector("form")!;
  private input = this.form.querySelector(`input[type="search"]`) as HTMLInputElement;

  connectedCallback() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.dispatchEvent(
        new CustomEvent<QueryEventDetail>("omnibox-submit", {
          detail: this.input.value.trim(),
        })
      );
    });
    this.input.addEventListener("input", (e) => {
      this.dispatchEvent(
        new CustomEvent<QueryEventDetail>("omnibox-input", {
          detail: this.input.value.trim(),
        })
      );
    });

    this.input.addEventListener("focus", (e) => {
      this.dispatchEvent(new CustomEvent<QueryEventDetail>("omnibox-input", { detail: this.input.value.trim() }));
    });

    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        this.dispatchEvent(new Event("omnibox-exit"));
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
}
