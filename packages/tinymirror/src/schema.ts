import { MarkSpec, Schema } from "prosemirror-model";

export function getSchema() {
  return new Schema({
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
        content: "block+",
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
}
