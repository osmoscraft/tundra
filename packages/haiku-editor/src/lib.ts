import { htmlToMarkdown, markdownToHtml } from "@tinykb/haiku-codec";

export class HaikuEditorElement extends HTMLElement {
  connectedCallback() {
    this.addEventListener("keydown", (e) => {
      if (e.isComposing) return;

      const keycode = getKeyCodeString(e);

      switch (keycode) {
        case "Alt-ArrowLeft":
          this.indentRelative(-1);
          e.preventDefault();
          break;
        case "Alt-ArrowRight":
          this.indentRelative(1);
          e.preventDefault();
          break;
        case "Alt-ArrowUp":
          this.moveUp();
          e.preventDefault();
          break;
        case "Alt-ArrowDown":
          this.moveDown();
          e.preventDefault();
          break;
        case "Ctrl-KeyK":
          const href = prompt("href");
          if (!href) return;
          const text = prompt("text");
          if (!text) return;
          this.addLink(href, text);
          e.preventDefault();
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

  indentRelative = (levels: number) => indentLineRelative(getActiveLine(), levels);

  moveUp() {
    const activeLine = getActiveLine();
    const targetLine = (activeLine?.previousElementSibling as HTMLElement) ?? null;
    swapTo("afterend", activeLine, targetLine);
  }

  moveDown() {
    const activeLine = getActiveLine();
    const targetLine = (activeLine?.nextElementSibling as HTMLElement) ?? null;
    swapTo("beforebegin", activeLine, targetLine);
  }

  addLink(href: string, text: string) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const link = document.createElement("a");
    link.href = href;
    link.innerText = text;
    range.insertNode(link);
  }
}

export function getActiveLine(): HTMLElement | null {
  const selection = window.getSelection();
  if (!selection) return null;

  const targetElement = (selection.anchorNode?.parentElement as HTMLElement)?.closest("[data-depth]") as HTMLElement;
  if (!targetElement) return null;

  return targetElement;
}

export function indentLineRelative(line: HTMLElement | null, levels: number) {
  if (!line) return;
  line.dataset.depth = (parseInt(line.dataset.depth!) + levels).toString();
}

/** Format: [Ctrl-][Alt-][Shift-]keyCode */
export function getKeyCodeString(e: KeyboardEvent): string {
  return `${e.ctrlKey ? "Ctrl-" : ""}${e.altKey ? "Alt-" : ""}${e.shiftKey ? "Shift-" : ""}${e.code}`;
}

export function swapTo(pos: InsertPosition, self: HTMLElement | null, other: HTMLElement | null) {
  if (!self || !other) return;
  self.insertAdjacentElement(pos, other);
}
