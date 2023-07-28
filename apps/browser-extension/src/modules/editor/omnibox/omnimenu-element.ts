import { paramsToRouteState, stateToParams, type RouteState } from "../../router/route-state";
import "./omnimenu-element.css";
import template from "./omnimenu-element.html";
import { SubmitMode, getEventMode } from "./submit-mode";

export interface MenuItem {
  title: string;
  state: RouteState;
}

declare global {
  interface HTMLElementEventMap {
    "omnimenu.action": CustomEvent<OmnimenuAction>;
    "omnimenu.close": Event;
  }
}

export interface OmnimenuAction {
  state: RouteState;
  mode: SubmitMode;
}

export class OmnimenuElement extends HTMLElement {
  private nodeList: HTMLUListElement;

  constructor() {
    super();
    this.innerHTML = template;
    this.nodeList = this.querySelector("#node-list") as HTMLUListElement;
  }

  connectedCallback() {
    this.nodeList.addEventListener("click", (e) => {
      if (this.submitItem(e.target as HTMLElement, getEventMode(e))) {
        e.preventDefault();
      }
    });

    this.nodeList.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        this.dispatchEvent(new Event("omnimenu.close"));
      }
    });
  }

  submitFirst(submitMode: SubmitMode) {
    const firstItem = this.nodeList.querySelector("[data-state]");
    this.submitItem(firstItem as HTMLElement, submitMode);
  }

  private submitItem(element: HTMLElement, mode: SubmitMode = SubmitMode.primary) {
    const stateText = element.closest("[data-state]")?.getAttribute("data-state");
    if (stateText) {
      this.dispatchEvent(
        new CustomEvent<OmnimenuAction>("omnimenu.action", {
          detail: { state: paramsToRouteState(new URLSearchParams(stateText)), mode },
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
