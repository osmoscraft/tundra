import { attachShadowHtml } from "@tinykb/dom-utils";
import template from "./backlinks-element.html";

declare global {
  interface HTMLElementEventMap {
    "backlinks-open": CustomEvent<string>;
  }
}

export interface Backlink {
  path: string;
  title: string;
}

export class BacklinksElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private backlinkList = this.shadowRoot.getElementById("backlink-list") as HTMLUListElement;

  connectedCallback() {
    this.backlinkList.addEventListener("click", (e) => {
      const path = (e.target as HTMLButtonElement).closest("[data-path]")?.getAttribute("data-path");
      if (!path) return;
      this.dispatchEvent(new CustomEvent<any>("reference-card-open", { detail: path }));
    });
  }

  setBacklinks(items: Backlink[]) {
    this.backlinkList.innerHTML = [
      ...items.map((item) => `<li><a href="?path=${encodeURIComponent(item.path)}">${item.title}</a></li>`).join(""),
    ].join("");
  }
}
