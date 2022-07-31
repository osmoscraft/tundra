import { baseKeymap } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { buildInputRules, buildMenuItems } from "prosemirror-example-setup";
import { gapCursor } from "prosemirror-gapcursor";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { menuBar } from "prosemirror-menu";
import "prosemirror-menu/style/menu.css";
import { DOMParser, MarkSpec, Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import "prosemirror-view/style/prosemirror.css";
import { createDelegationHandler } from "../../utils/dom-events";
import { loadTemplate } from "../../utils/template";
import "./frame.css";
import { buildKeymap } from "./keymap";
import "./prosemirror.css";

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
  private schema = new Schema({
    nodes: {
      text: {
        group: "inline",
      },
      paragraph: {
        content: "inline*",
        group: "block",
        parseDOM: [{ tag: "p" }],
        toDOM: () => ["p", 0],
      },
      bullet_list: {
        content: "list_item+",
        parseDOM: [{ tag: "ul" }],
        toDOM: () => ["ul", 0],
        group: "block",
      },
      list_item: {
        content: "block*",
        parseDOM: [{ tag: "li" }],
        toDOM: () => ["li", 0],
        defining: true,
      },
      doc: { content: "bullet_list+" },
    },
    marks: {
      link: {
        attrs: {
          href: {},
          title: { default: null },
        },
        inclusive: false,
        parseDOM: [
          {
            tag: "a[href]",
            getAttrs(dom: HTMLElement) {
              return { href: dom.getAttribute("href"), title: dom.getAttribute("title") };
            },
          } as MarkSpec,
        ],
        toDOM(node) {
          let { href, title } = node.attrs;
          return ["a", { href, title }, 0];
        },
      },
    },
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
        plugins: [
          buildInputRules(this.schema),
          keymap(buildKeymap(this.schema)),
          keymap(baseKeymap),
          history(),
          dropCursor(),
          gapCursor(),
          menuBar({ floating: false, content: buildMenuItems(this.schema).fullMenu }),
        ],
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
