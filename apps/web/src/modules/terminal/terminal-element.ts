import "./terminal-element.css";

export class TerminalElement extends HTMLElement {
  write(text: string) {
    const lineNode = document.createElement("div");
    lineNode.textContent = `${new Date().toLocaleTimeString()} ${text}`;
    this.querySelector("output")!.appendChild(lineNode);
    lineNode.scrollIntoView();
  }

  toggle() {
    this.querySelector("output")!.classList.toggle("expanded");
    this.lastElementChild?.scrollIntoView();
  }
}
