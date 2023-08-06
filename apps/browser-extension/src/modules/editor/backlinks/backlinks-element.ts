import "./backlinks-element.css";
import template from "./backlinks-element.html";

declare global {
  interface HTMLElementEventMap {
    "backlinks.open": CustomEvent<string>;
  }
}

export interface Backlink {
  id: string;
  title: string;
}

export class BacklinksElement extends HTMLElement {
  private backlinkList: HTMLUListElement;

  constructor() {
    super();
    this.innerHTML = template;
    this.backlinkList = this.querySelector("#backlink-list") as HTMLUListElement;
  }

  connectedCallback() {
    this.backlinkList.addEventListener("click", (e) => {
      const path = (e.target as HTMLButtonElement).closest("[data-path]")?.getAttribute("data-path");
      if (!path) return;
      this.dispatchEvent(new CustomEvent<any>("reference-card-open", { detail: path }));
    });
  }

  setBacklinks(items: Backlink[]) {
    if (!items.length) {
      this.backlinkList.innerHTML = `<li>No backlinks</li>`;
    } else {
      this.backlinkList.innerHTML = [
        ...items.map((item) => `<li><a href="?id=${item.id}">${item.title}</a></li>`).join(""),
      ].join("");
    }
  }
}
