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
    "omnibox-open": CustomEvent<QueryEventDetail>;
    "omnibox-load-default": Event;
    "omnibox-exit": Event;
  }
}

export class OmniboxElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private form = this.shadowRoot.querySelector("form")!;
  private input = this.form.querySelector(`input[type="search"]`) as HTMLInputElement;
  private nodeList = this.shadowRoot.getElementById("node-list") as HTMLUListElement;

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
        this.nodeList.innerHTML = "";
        this.dispatchEvent(new Event("omnibox-exit"));
      }
    });

    this.nodeList.addEventListener("click", (e) => {
      const path = (e.target as HTMLButtonElement).closest("[data-path]")?.getAttribute("data-path");
      if (!path) return;
      this.dispatchEvent(new CustomEvent<QueryEventDetail>("omnibox-open", { detail: path }));
    });
  }

  setSuggestions(items: OmniboxSuggestion[]) {
    this.nodeList.innerHTML = [
      `<li><a href="./options.html">Options</a></li>`,
      `<li><a href="?draft">new</li>`,
      ...items.map((item) => `<li><a href="?path=${encodeURIComponent(item.path)}">${item.title}</a></li>`).join(""),
    ].join("");
  }

  focus() {
    this.input.focus();
  }
}
