const TITLED_LINK_PATTERN = /\[([^\[\]]+?)\]\((.+?)\)/g; // `[title](target)`

export function markdownToHtml(md: string) {
  return md
    .split("\n")
    .filter((line) => line.trimStart().startsWith("-"))
    .map((line) => {
      const listMarkPos = line.indexOf("- ");
      const depth = listMarkPos >> 1; // divide by 2 using right shift
      const inlineContent = line.slice(listMarkPos + 2);
      return `<div data-depth="${depth}">${inlineMarkdownToHtml(inlineContent)}</div>`;
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

export function inlineMarkdownToHtml(md: string) {
  return md.replace(TITLED_LINK_PATTERN, `<a href="$2">$1</a>`);
}

export function htmlToDom(input: string) {
  const parser = new DOMParser();
  return parser.parseFromString(input, "text/html");
}

export function getHtmlToMarkdown(domParser: (input: string) => Document) {
  return (input: string) => domToMarkdown(domParser(input));
}

export const htmlToMarkdown = getHtmlToMarkdown(htmlToDom);
