export class DialogElement extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<dialog></dialog>`;
  }

  show(node: Node) {
    const dialog$ = this.querySelector("dialog")!;
    dialog$.innerHTML = "";
    const trap = document.createElement("focus-trap-element");
    trap.appendChild(node);
    dialog$.open = true;
    dialog$.appendChild(trap);
  }

  hide() {
    const dialog$ = this.querySelector("dialog")!;
    dialog$.open = false;
    dialog$.innerHTML = "";
  }
}
