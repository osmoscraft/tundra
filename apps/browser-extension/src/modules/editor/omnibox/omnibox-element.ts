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
    "omnibox-load-default": Event;
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
      if ((e.target as HTMLInputElement).value.trim()) {
        this.dispatchEvent(
          new CustomEvent<QueryEventDetail>("omnibox-input", {
            detail: this.input.value.trim(),
          })
        );
      } else {
        this.dispatchEvent(new Event("omnibox-load-default"));
      }
    });

    this.input.addEventListener("focus", (e) => this.dispatchEvent(new Event("omnibox-load-default")));

    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.dispatchEvent(new Event("omnibox-exit"));
      }
    });
  }

  focus() {
    this.input.focus();
  }
}
