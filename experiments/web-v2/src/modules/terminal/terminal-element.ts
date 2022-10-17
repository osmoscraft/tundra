import { defineCustomEvent } from "../event/define-event";
import "./terminal-element.css";

export const termWriteEvent = defineCustomEvent<string>("term.write", { bubbles: true });

export class TerminalElement extends HTMLElement {
  write(text: string) {
    const lineNode = document.createElement("div");
    lineNode.textContent = `${new Date().toLocaleTimeString()} ${text}`;
    this.querySelector("output")!.appendChild(lineNode);
    lineNode.scrollIntoView();
  }

  toggle() {
    this.querySelector("output")!.classList.toggle("expanded");
    this.querySelector("output")!.lastElementChild?.scrollIntoView();
  }
}
