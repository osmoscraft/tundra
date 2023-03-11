import { attachShadowHtml } from "../../utils/dom";
import template from "./omnibox-element.html";

export interface OmniboxSuggestion {
  title: string;
}

export type QueryEventDetail = string;

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
  }

  setSuggestions(items: OmniboxSuggestion[]) {
    this.nodeList.innerHTML = items.map((item) => `<li>${item.title}</li>`).join("");
  }
}
