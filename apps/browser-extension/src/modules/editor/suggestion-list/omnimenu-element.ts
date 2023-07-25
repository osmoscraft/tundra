import { attachShadowHtml } from "@tinykb/dom-utils";
import template from "./omnimenu-element.html";

export interface OmnimenuSuggestion {
  path: string;
  title: string;
}

export interface MenuItem {
  title: string;
  path?: string;
  command?: string;
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

  setMenuItems(items: MenuItem[]) {
    const newMenuItems = document.createDocumentFragment();
    items.forEach((item) => {
      const listItem = document.createElement("li");
      const anchor = document.createElement("a");
      anchor.textContent = item.title;
      if (item.path) {
        anchor.href = `?path=${encodeURIComponent(item.path)}`;
      }

      if (item.command) {
        anchor.setAttribute("data-command", item.command);
      }

      listItem.appendChild(anchor);
      newMenuItems.appendChild(listItem);
    });

    // set nodeList children to be the links
    this.nodeList.innerHTML = "";
    this.nodeList.appendChild(newMenuItems);
  }
}
