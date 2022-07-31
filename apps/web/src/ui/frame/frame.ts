import { htmlToMarkdown, markdownToHtml } from "@tinykb/haiku-codec";
import { createDelegationHandler } from "../../utils/dom-events";
import { loadTemplate } from "../../utils/template";
import "./frame.css";

const template = loadTemplate(/*html*/ `
<menu>
  <li><button data-command="save">Save</button></li>
</menu>
<div contenteditable="true"></div>
<hr>
<pre><code id="view-source"></code></pre>
`);

declare global {
  interface ElementEventMap {
    saveFrame: CustomEvent<string>;
  }
}

export class FrameElement extends HTMLElement {
  private editableElement!: HTMLElement;
  private viewSourceElement!: HTMLElement;

  async connectedCallback() {
    this.editableElement = template.querySelector("[contenteditable]")!;
    this.viewSourceElement = template.querySelector("#view-source")!;

    const handleClick = createDelegationHandler("data-command", {
      save: this.handleSave.bind(this),
    });

    this.addEventListener("click", handleClick);
    this.appendChild(template);
  }

  async load(text: string) {
    this.editableElement.innerHTML = await markdownToHtml(text);
    this.viewSourceElement.innerHTML = text;
  }

  private async handleSave() {
    this.dispatchEvent(
      new CustomEvent("saveFrame", {
        detail: await htmlToMarkdown(this.editableElement!.innerHTML),
      })
    );
  }
}
