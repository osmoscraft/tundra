import { attachShadowHtml } from "@tinykb/dom-utils";
import template from "./omnibox-element.html";

export interface OmniboxSuggestion {
  path: string;
  title: string;
}

export type QueryEventDetail = string;

declare global {
  interface HTMLElementEventMap {
    "omnibox-input": CustomEvent<QueryEventDetail>;
    "omnibox-exit": Event;
  }
}

export class OmniboxElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private form = this.shadowRoot.querySelector("form")!;
  private input = this.form.querySelector(`input[type="search"]`) as HTMLInputElement;

  connectedCallback() {
    this.form.addEventListener("submit", (e) => e.preventDefault());
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
        this.dispatchEvent(new Event("omnibox-exit"));
      }
    });
  }

  open(initialValue?: string) {
    if (initialValue !== undefined) this.input.value = initialValue;
    this.input.focus();
  }
}
