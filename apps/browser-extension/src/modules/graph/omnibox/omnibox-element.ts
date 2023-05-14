import { attachShadowHtml } from "@tinykb/dom-utils";
import template from "./omnibox-element.html";

export interface OmniboxSuggestion {
  path: string;
  title: string;
}

export type QueryEventDetail = string;

export type OpenEventDetail = string;

export class OmniboxElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private form = this.shadowRoot.querySelector("form")!;
  private input = this.form.querySelector(`input[type="search"]`) as HTMLInputElement;
  private nodeList = this.shadowRoot.getElementById("node-list") as HTMLUListElement;

  connectedCallback() {
    this.form.addEventListener("submit", (e) => e.preventDefault());
    this.form.addEventListener("input", (e) => {
      if (this.input.value) {
        this.dispatchEvent(
          new CustomEvent<QueryEventDetail>("search", {
            detail: this.input.value,
          })
        );
      } else {
        this.dispatchEvent(new Event("load-default"));
      }
    });

    this.nodeList.addEventListener("click", (e) => {
      const path = (e.target as HTMLButtonElement).closest("[data-path]")?.getAttribute("data-path");
      if (!path) return;
      this.dispatchEvent(new CustomEvent("open", { detail: path }));
    });
  }

  setSuggestions(items: OmniboxSuggestion[]) {
    this.nodeList.innerHTML = items
      .map((item) => `<li><button data-path="${item.path}">${item.title}</button></li>`)
      .join("");
  }
}
