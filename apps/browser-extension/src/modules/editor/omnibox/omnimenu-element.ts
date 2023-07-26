import { attachShadowHtml } from "@tinykb/dom-utils";
import { paramsToRouteState, stateToParams, type RouteState } from "../../router/route-state";
import template from "./omnimenu-element.html";

export interface MenuItem {
  title: string;
  state: RouteState;
}

declare global {
  interface HTMLElementEventMap {
    "omnimenu-action": CustomEvent<OmnimenuAction>;
    "omnimenu-close": Event;
  }
}

export interface OmnimenuAction {
  state: RouteState;
  isSecondary?: boolean;
}

export class OmnimenuElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private nodeList = this.shadowRoot.getElementById("node-list") as HTMLUListElement;

  connectedCallback() {
    this.nodeList.addEventListener("click", (e) => {
      if (this.submitItem(e.target as HTMLElement, e.ctrlKey)) {
        e.preventDefault();
      }
    });

    this.nodeList.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.dispatchEvent(new Event("omnimenu-close"));
      }
    });
  }

  clear() {
    this.nodeList.innerHTML = "";
  }

  submitFirst(secondary?: boolean) {
    const firstItem = this.nodeList.querySelector("[data-state]");
    this.submitItem(firstItem as HTMLElement, secondary);
  }

  private submitItem(element: HTMLElement, secondary?: boolean) {
    const stateText = element.closest("[data-state]")?.getAttribute("data-state");
    if (stateText) {
      this.dispatchEvent(
        new CustomEvent<OmnimenuAction>("omnimenu-action", {
          detail: { state: paramsToRouteState(new URLSearchParams(stateText)), isSecondary: secondary },
        })
      );
      return true;
    }

    return false;
  }

  setMenuItems(items: MenuItem[]) {
    const newMenuItems = document.createDocumentFragment();
    items.forEach((item) => {
      const listItem = document.createElement("li");
      const triggerElement = this.getTriggerElement(item.title, item.state);
      listItem.appendChild(triggerElement);

      newMenuItems.appendChild(listItem);
    });

    // set nodeList children to be the links
    this.nodeList.innerHTML = "";
    this.nodeList.appendChild(newMenuItems);
  }

  private getTriggerElement(title: string, state: RouteState): HTMLElement {
    let triggerElement: HTMLElement;

    if (state.path) {
      const link = document.createElement("a");
      link.href = `?${stateToParams(state)}}`;
      triggerElement = link;
    } else {
      const button = document.createElement("button");
      triggerElement = button;
    }

    triggerElement.setAttribute("data-state", `${stateToParams(state)}`);
    triggerElement.textContent = title;
    return triggerElement;
  }
}
