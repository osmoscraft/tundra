import { attachShadowHtml } from "@tinykb/dom-utils";
import template from "./omnimenu-element.html";

export interface OmnimenuSuggestion {
  path: string;
  title: string;
}

export type QueryEventDetail = string;

declare global {
  interface HTMLElementEventMap {
    "omnimenu-open": CustomEvent<QueryEventDetail>;
  }
}

export class OmnimenuElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private nodeList = this.shadowRoot.getElementById("node-list") as HTMLUListElement;

  connectedCallback() {
    this.nodeList.addEventListener("click", (e) => {
      const path = (e.target as HTMLButtonElement).closest("[data-path]")?.getAttribute("data-path");
      if (!path) return;
      this.dispatchEvent(new CustomEvent<QueryEventDetail>("omnimenu-open", { detail: path }));
    });
  }

  clear() {
    this.nodeList.innerHTML = "";
  }

  setSuggestions(items: OmnimenuSuggestion[]) {
    this.nodeList.innerHTML = [
      `<li><a href="./options.html">Options</a></li>`,
      `<li><a href="?draft">new</li>`,
      ...items.map((item) => `<li><a href="?path=${encodeURIComponent(item.path)}">${item.title}</a></li>`).join(""),
    ].join("");
  }
}
