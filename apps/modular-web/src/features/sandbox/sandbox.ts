import { HaikuEditorElement } from "../editor/editor";
import "../editor/editor.css";
import "./styles.css";

customElements.define("haiku-editor-element", HaikuEditorElement);

const lazyImports = {
  simple: () => import("./sample-docs/sample01.md?raw"),
  nested: () => import("./sample-docs/sample02.md?raw"),
  long: () => import("./sample-docs/sample03.md?raw"),
  rich: () => import("./sample-docs/sample04.md?raw"),
};

const sourceElement = document.getElementById("source") as HTMLTextAreaElement;
const editorElement = document.querySelector<HaikuEditorElement>("haiku-editor-element")!;
const filePickerLement = document.getElementById("file-picker")!;

main();

async function main() {
  document.querySelector("menu")!.addEventListener("click", (e) => {
    const action = (e.target as HTMLElement).closest("[data-action]")?.getAttribute("data-action");
    switch (action) {
      case "save":
        sourceElement.value = editorElement.getMarkdown();
        break;
      case "openFile":
        const file = (e.target as HTMLButtonElement).dataset.file as keyof typeof lazyImports;
        loadFile(file);
        break;
      case "indent":
        editorElement.indentRelative(1);
        break;
      case "outdent":
        editorElement.indentRelative(-1);
        break;
      case "link":
        editorElement.addLink("#", "mock link text");
    }
  });

  filePickerLement.innerHTML = Object.entries(lazyImports)
    .map(([name]) => `<button data-action="openFile" data-file="${name}">${name}</button>`)
    .join("");

  sourceElement.addEventListener("change", () => loadText(sourceElement.value));

  loadFile(Object.keys(lazyImports)[0]);
}

async function loadFile(file: string) {
  const imported = await lazyImports[file as keyof typeof lazyImports]();
  sourceElement.value = imported.default;
  loadText(imported.default);
}

function loadText(text: string) {
  editorElement.setMarkdown(text);
}
