import { htmlToMarkdown, markdownToHtml } from "@tinykb/haiku-codec";
import "./styles.css";

const lazyImports = {
  simple: () => import("./sample-docs/sample01.md?raw"),
  nested: () => import("./sample-docs/sample02.md?raw"),
  long: () => import("./sample-docs/sample03.md?raw"),
};

const sourceElement = document.getElementById("source") as HTMLTextAreaElement;
const editorElement = document.getElementById("editor")!;
const filePickerLement = document.getElementById("file-picker")!;
const saveElement = document.getElementById("save")! as HTMLButtonElement;

main();

async function main() {
  filePickerLement.innerHTML = Object.entries(lazyImports)
    .map(([name]) => `<button data-file="${name}">${name}</button>`)
    .join("");

  filePickerLement.addEventListener("click", async (e) => {
    const file = (e.target as HTMLButtonElement).dataset.file as keyof typeof lazyImports;
    loadFile(file);
  });

  sourceElement.addEventListener("change", () => loadText(sourceElement.value));

  saveElement.addEventListener("click", () => {
    performance.mark("start");
    const md = htmlToMarkdown(editorElement.innerHTML);
    console.log(`[html-to-md] ${performance.measure("", "start").duration.toFixed(2)}ms`);
    sourceElement.value = md;
  });

  loadFile(Object.keys(lazyImports)[0]);
}

async function loadFile(file: string) {
  const imported = await lazyImports[file as keyof typeof lazyImports]();
  console.log(imported.default);
  sourceElement.value = imported.default;
  loadText(imported.default);
}

function loadText(text: string) {
  performance.mark("start");
  const html = markdownToHtml(text);
  console.log(`[md-to-html] ${performance.measure("", "start").duration.toFixed(2)}ms`);
  editorElement.innerHTML = html;
}
