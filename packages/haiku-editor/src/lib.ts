import { htmlToMarkdown, markdownToHtml } from "@tinykb/haiku-codec";

export class HaikuEditorElement extends HTMLElement {
  connectedCallback() {
    this.addEventListener("keydown", (e) => {
      if (e.isComposing) return;

      switch (e.code) {
        case "Tab":
          if (!e.ctrlKey && !e.altKey) {
            this.setIndentRelative(e.shiftKey ? -1 : 1);
            e.preventDefault();
          }
          break;
      }
    });
  }

  setMarkdown(markdown: string) {
    performance.mark("start");
    this.innerHTML = /*html*/ `<div contenteditable="true">${markdownToHtml(markdown)}</div>`;
    console.log(`[haiku-editor] set md ${performance.measure("", "start").duration.toFixed(2)}ms`);
  }

  getMarkdown() {
    performance.mark("start");
    const markdown = htmlToMarkdown(this.children[0].innerHTML);
    console.log(`[haiku-editor] get md ${performance.measure("", "start").duration.toFixed(2)}ms`);
    return markdown;
  }

  setIndentRelative = setIndentRelative;
}

export function setIndentRelative(levels: number) {
  const selection = window.getSelection();
  if (!selection) return;

  const targetElement = (selection.anchorNode?.parentElement as HTMLElement)?.closest("[data-depth]") as HTMLElement;
  if (!targetElement) return;
  targetElement.dataset.depth = (parseInt(targetElement.dataset.depth!) + levels).toString();
}
