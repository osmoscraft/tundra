import type { RouteState } from "../../router/route-state";
import type { MenuActionMode } from "./action-mode";
import "./backlinks-element.css";
import template from "./backlinks-element.html";

declare global {
  interface HTMLElementEventMap {
    "backlinks.open": CustomEvent<string>;
  }
}

export interface BacklinkAction {
  state: RouteState;
  mode: MenuActionMode;
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
      const id = (e.target as HTMLButtonElement).closest("[data-id]")?.getAttribute("data-id");
      if (!id) return;
      this.dispatchEvent(new CustomEvent<any>("backlinks.open", { detail: id }));
      e.preventDefault();
    });
  }

  setBacklinks(items: Backlink[]) {
    if (!items.length) {
      this.backlinkList.innerHTML = `<li>No backlinks</li>`;
    } else {
      this.backlinkList.innerHTML = [
        ...items.map((item) => `<li><a href="?id=${item.id}" data-id="${item.id}">${item.title}</a></li>`).join(""),
      ].join("");
    }
  }
}
