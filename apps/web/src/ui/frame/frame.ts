import { DOMParser, EditorState, EditorView, getPlugins, getSchema } from "tinymirror";
import "tinymirror/index.css";
import { createDelegationHandler } from "../../utils/dom-events";
import { loadTemplate } from "../../utils/template";

const template = loadTemplate(/*html*/ `
<menu> <li><button data-command="save">Save</button></li> </menu>
<div id="content" hidden></div>
<div id="editor" class="u-flex__grow u-flex-rows"></div>
`);

declare global {
  interface ElementEventMap {
    saveFrame: CustomEvent<string>;
  }
}
export class FrameElement extends HTMLElement {
  private contentElement!: HTMLElement;
  private editorElement!: HTMLElement;
  private schema = getSchema();

  async connectedCallback() {
    this.contentElement = template.querySelector("#content")!;
    this.editorElement = template.querySelector("#editor")!;

    const handleClick = createDelegationHandler("data-command", {
      save: this.handleSave.bind(this),
    });

    this.addEventListener("click", handleClick);
    this.appendChild(template);
  }

  load(text: string) {
    this.contentElement.innerHTML = text;

    new EditorView(this.editorElement, {
      state: EditorState.create({
        doc: DOMParser.fromSchema(this.schema).parse(this.contentElement),
        plugins: getPlugins(this.schema),
      }),
    });
  }

  private async handleSave() {
    this.dispatchEvent(
      new CustomEvent("saveFrame", {
        detail: this.contentElement!.innerHTML,
      })
    );
  }
}
