export function markdownToHtml(md: string) {
  return md
    .split("\n")
    .filter((line) => line.trimStart().startsWith("-"))
    .map((line) => {
      const listMarkPos = line.indexOf("- ");
      const depth = listMarkPos >> 1; // divide by 2 using right shift
      return `<div data-depth="${depth}">${line.slice(listMarkPos + 2)}</div>`;
    })
    .join("\n");
}

export function domToMarkdown(dom: Document) {
  const md = [...dom.querySelectorAll<HTMLElement>("body > div")]
    .map((lineElement) => `${" ".repeat(parseInt(lineElement.dataset.depth as string) * 2)}- ${lineElement.textContent}`)
    .join("\n")
    .concat("\n");

  return md;
}

export function htmlToDom(input: string) {
  const parser = new DOMParser();
  return parser.parseFromString(input, "text/html");
}

export function getHtmlToMarkdown(domParser: (input: string) => Document) {
  return (input: string) => domToMarkdown(domParser(input));
}

export const htmlToMarkdown = getHtmlToMarkdown(htmlToDom);
