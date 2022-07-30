import { exampleSetup } from "prosemirror-example-setup";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-menu/style/menu.css";
import { DOMParser, Schema } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import "prosemirror-view/style/prosemirror.css";
import { createDelegationHandler } from "../../utils/dom-events";
import { loadTemplate } from "../../utils/template";
import "./frame.css";

const template = loadTemplate(/*html*/ `
<menu>
  <li><button data-command="save">Save</button></li>
</menu>
<div id="content" hidden></div>
<div id="editor"></div>
`);

declare global {
  interface ElementEventMap {
    saveFrame: CustomEvent<string>;
  }
}

export class FrameElement extends HTMLElement {
  private contentElement!: HTMLElement;
  private editorElement!: HTMLElement;
  private schema = new Schema({
    nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
    marks: schema.spec.marks,
  });

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
        plugins: exampleSetup({ schema: this.schema }),
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
