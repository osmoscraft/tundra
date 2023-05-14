import { attachShadowHtml } from "@tinykb/dom-utils";
import template from "./file-tree-element.html";

export interface DisplayFile {
  path: string;
  displayName: string;
}
export class FileTreeElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private fileList = this.shadowRoot.querySelector<HTMLUListElement>(".js-file-list")!;

  setFiles(files: DisplayFile[]) {
    this.fileList.innerHTML = [
      `<li><a href="?draft">new</li>`,
      ...(files ?? []).map((item) => `<li><a href="?path=${encodeURIComponent(item.path)}">${item.path}</a></li>`),
    ].join("");
  }
}
