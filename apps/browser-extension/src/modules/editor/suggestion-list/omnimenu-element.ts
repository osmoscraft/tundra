import { attachShadowHtml } from "@tinykb/dom-utils";
import { Operator, parseDirective, stringifyDirective, type Directive } from "../directive";
import template from "./omnimenu-element.html";

export interface MenuItem {
  title: string;
  primaryDirective: string;
  secondaryDirective?: string;
}

declare global {
  interface HTMLElementEventMap {
    "omnimenu-run-directive": CustomEvent<string>;
  }
}

export class OmnimenuElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private nodeList = this.shadowRoot.getElementById("node-list") as HTMLUListElement;

  connectedCallback() {
    this.nodeList.addEventListener("click", (e) => {
      if (this.submitItem(e.target as HTMLElement, !e.ctrlKey)) {
        e.preventDefault();
      }
    });
  }

  clear() {
    this.nodeList.innerHTML = "";
  }

  submitFirst(secondary?: boolean) {
    const firstItem = this.nodeList.querySelector("[data-primary-directive], [data-secondary-directive]");
    this.submitItem(firstItem as HTMLElement, secondary);
  }

  private submitItem(element: HTMLElement, secondary?: boolean) {
    const directiveSelector = secondary ? "[data-secondary-directive]" : "[data-primary-directive]";
    const directiveAttr = secondary ? "data-secondary-directive" : "data-primary-directive";
    const directive = element.closest(directiveSelector)?.getAttribute(directiveAttr);
    if (directive) {
      this.dispatchEvent(new CustomEvent<string>("omnimenu-run-directive", { detail: directive }));
      return true;
    }

    return false;
  }

  setMenuItems(items: MenuItem[]) {
    const newMenuItems = document.createDocumentFragment();
    items.forEach((item) => {
      const listItem = document.createElement("li");
      const triggerElement = this.getDirectiveTrigger(
        item.title,
        parseDirective(item.primaryDirective),
        item.secondaryDirective ? parseDirective(item.secondaryDirective) : undefined
      );
      listItem.appendChild(triggerElement);

      newMenuItems.appendChild(listItem);
    });

    // set nodeList children to be the links
    this.nodeList.innerHTML = "";
    this.nodeList.appendChild(newMenuItems);
  }

  private getDirectiveTrigger(title: string, primary: Directive, secondary?: Directive): HTMLElement {
    if (
      [Operator.InsertLink, Operator.InsertLinkWithText, Operator.Open, Operator.OpenInNew].includes(primary.operator)
    ) {
      const link = document.createElement("a");
      link.setAttribute("data-primary-directive", stringifyDirective(primary));
      secondary && link.setAttribute("data-secondary-directive", stringifyDirective(secondary));
      link.href = `?path=${encodeURIComponent(primary.operand)}`;
      link.textContent = title;
      return link;
    } else {
      const button = document.createElement("button");
      button.setAttribute("data-primary-directive", stringifyDirective(primary));
      secondary && button.setAttribute("data-secondary-directive", stringifyDirective(secondary));
      button.textContent = title;
      return button;
    }
  }
}
