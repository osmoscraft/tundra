import { createDelegationHandler } from "../../utils/dom-events";
import { loadTemplate } from "../../utils/template";
import "./frame.css";

const template = loadTemplate(/*html*/ `
<menu>
  <li><button data-command="save">Save</button></li>
</menu>
<div contenteditable="plaintext-only"></div>
`);

declare global {
  interface ElementEventMap {
    saveFrame: CustomEvent<string>;
  }
}

export class FrameElement extends HTMLElement {
  private editableElement!: HTMLElement;

  async connectedCallback() {
    this.editableElement = template.querySelector("[contenteditable]")!;

    const handleClick = createDelegationHandler("data-command", {
      save: this.handleSave.bind(this),
    });

    this.addEventListener("click", handleClick);
    this.appendChild(template);
  }

  load(text: string) {
    this.editableElement.innerHTML = text;
  }

  private async handleSave() {
    this.dispatchEvent(
      new CustomEvent("saveFrame", {
        detail: this.editableElement!.innerHTML,
      })
    );
  }
}
