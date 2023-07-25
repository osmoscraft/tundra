import { attachShadowHtml } from "@tinykb/dom-utils";
import template from "./omnimenu-element.html";

export interface MenuItem {
  title: string;
  path?: string;
  command?: string;
}

declare global {
  interface HTMLElementEventMap {
    "omnimenu-submit": CustomEvent<string>;
  }
}

export class OmnimenuElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private nodeList = this.shadowRoot.getElementById("node-list") as HTMLUListElement;

  connectedCallback() {
    this.nodeList.addEventListener("click", (e) => {
      const path = (e.target as HTMLElement).closest("[data-path]")?.getAttribute("data-path");
      if (path) {
        const operator = e.ctrlKey ? "openInNew" : "open";
        this.dispatchEvent(new CustomEvent<string>("omnimenu-submit", { detail: `${operator}:${path}` }));
        e.preventDefault();
        return;
      }

      const command = (e.target as HTMLElement).closest("button")?.getAttribute("data-command");
      if (command) {
        e.preventDefault();
        this.dispatchEvent(new CustomEvent<string>("omnimenu-submit", { detail: `command:${command}` }));
        return;
      }
    });
  }

  clear() {
    this.nodeList.innerHTML = "";
  }

  setMenuItems(items: MenuItem[]) {
    const newMenuItems = document.createDocumentFragment();
    items.forEach((item) => {
      const listItem = document.createElement("li");
      if (item.path) {
        const anchor = document.createElement("a");
        anchor.setAttribute("data-path", item.path);
        anchor.textContent = item.title;
        anchor.href = `?path=${encodeURIComponent(item.path)}`;
        listItem.appendChild(anchor);
      } else if (item.command) {
        const button = document.createElement("button");
        button.textContent = item.title;
        button.setAttribute("data-command", item.command);
        listItem.appendChild(button);
      }

      newMenuItems.appendChild(listItem);
    });

    // set nodeList children to be the links
    this.nodeList.innerHTML = "";
    this.nodeList.appendChild(newMenuItems);
  }
}
