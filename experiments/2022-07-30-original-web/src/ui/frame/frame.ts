import type { HaikuEditorElement } from "@tinykb/haiku-editor";
import { createDelegationHandler } from "../../utils/dom-events";
import { loadTemplate } from "../../utils/template";
import "./frame.css";

const template = loadTemplate(/*html*/ `
<menu>
  <li><button data-command="save">Save</button></li>
</menu>
<haiku-editor-element class="haiku-editor"></haiku-editor-element>
<hr>
<pre><code id="view-source"></code></pre>
`);

declare global {
  interface ElementEventMap {
    saveFrame: CustomEvent<string>;
  }
}

export class FrameElement extends HTMLElement {
  private editorElement!: HaikuEditorElement;
  private viewSourceElement!: HTMLElement;

  async connectedCallback() {
    this.editorElement = template.querySelector("haiku-editor-element")!;
    this.viewSourceElement = template.querySelector("#view-source")!;

    const handleClick = createDelegationHandler("data-command", {
      save: this.handleSave.bind(this),
    });

    this.addEventListener("click", handleClick);
    this.appendChild(template);
  }

  async load(text: string) {
    this.editorElement.setMarkdown(text);
    this.viewSourceElement.innerHTML = text;
  }

  private async handleSave() {
    this.dispatchEvent(
      new CustomEvent("saveFrame", {
        detail: this.editorElement.getMarkdown(),
      })
    );
  }
}
