import { uiModalExitEvent } from "./focus-trap-element";

export class DialogElement extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<dialog></dialog>`;
    uiModalExitEvent.on(this, () => this.hide());
  }

  show(node: Node) {
    const dialog$ = this.querySelector("dialog")!;
    dialog$.innerHTML = "";
    const trap = document.createElement("focus-trap-element");
    trap.appendChild(node);
    dialog$.open = true;
    // content must be visible before focus trap can start auto focus
    dialog$.appendChild(trap);
  }

  hide() {
    const dialog$ = this.querySelector("dialog")!;
    dialog$.open = false;
    dialog$.innerHTML = "";
  }
}
