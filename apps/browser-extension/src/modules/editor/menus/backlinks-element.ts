import "./backlinks-element.css";
import template from "./backlinks-element.html";
import { MenuActionMode, type MenuAction } from "./menu-action";

declare global {
  interface HTMLElementEventMap {
    "backlinks.open": CustomEvent<MenuAction>;
    "backlinks.back": Event;
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

    this.backlinkList.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.dispatchEvent(new Event("backlinks.back"));
        e.preventDefault();
      }

      if (e.key === "ArrowUp") {
        this.focusItemRelative(-1);
        e.preventDefault();
      }

      if (e.key === "ArrowDown") {
        this.focusItemRelative(1);
        e.preventDefault();
      }
    });
  }

  setBacklinks(items: Backlink[]) {
    if (!items.length) {
      this.backlinkList.innerHTML = ``;
    } else {
      this.backlinkList.innerHTML = [
        ...items
          .map(
            (item, index) =>
              `<li><a href="?id=${item.id}" tabindex="${index === 0 ? 0 : -1}" data-id="${item.id}">${
                item.title
              }</a></li>`,
          )
          .join(""),
      ].join("");
    }
  }

  focusItemRelative(offset: number) {
    // remove previous focus
    const allItems = [...this.backlinkList.querySelectorAll<HTMLElement>("[tabindex]")];
    const focusedIndex = allItems.findIndex((item) => item.tabIndex === 0);
    if (focusedIndex === -1) return;

    // clear previous focus
    allItems[focusedIndex].tabIndex = -1;

    // set new focus
    const focusItem = allItems.at((focusedIndex + offset) % allItems.length);
    focusItem?.setAttribute("tabindex", "0");
    focusItem?.focus();
  }
}
