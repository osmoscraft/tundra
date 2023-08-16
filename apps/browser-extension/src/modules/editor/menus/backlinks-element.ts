import "./backlinks-element.css";
import template from "./backlinks-element.html";
import { MenuActionMode, type MenuAction } from "./menu-action";

declare global {
  interface HTMLElementEventMap {
    "backlinks.open": CustomEvent<MenuAction>;
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
      const id = (e.target as HTMLButtonElement).closest("[data-id]")?.getAttribute("data-id");
      if (!id) return;

      const mode = e.ctrlKey ? MenuActionMode.secondary : MenuActionMode.primary;

      this.dispatchEvent(new CustomEvent<MenuAction>("backlinks.open", { detail: { state: { id }, mode } }));
      e.preventDefault();
    });
  }

  setBacklinks(items: Backlink[]) {
    if (!items.length) {
      this.backlinkList.innerHTML = ``;
    } else {
      this.backlinkList.innerHTML = [
        ...items.map((item) => `<li><a href="?id=${item.id}" data-id="${item.id}">${item.title}</a></li>`).join(""),
      ].join("");
    }
  }
}
