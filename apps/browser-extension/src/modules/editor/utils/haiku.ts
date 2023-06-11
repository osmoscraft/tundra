const TITLED_LINK_PATTERN = /\[([^\[\]]+?)\]\((.+?)\)/g; // `[title](target)`
const COLON_PREFIX_PATTERN = /^(.+:)/; // `Keyword or phrase:`

export function haikuToHtml(haiku: string): string {
  return haiku
    .split("\n")
    .filter((line) => line.trimStart().startsWith("- "))
    .map(haikuLineToHtml)
    .join("\n");
}

function haikuLineToHtml(line: string) {
  const listMarkPos = line.indexOf("- ");
  const depth = listMarkPos >> 1; // divide by 2 using right shift
  const inlineContent = line.slice(listMarkPos + 2);
  return `<div data-depth="${depth}">${haikuInlineToHtml(inlineContent)}</div>`;
}

function haikuInlineToHtml(haiku: string) {
  if (!haiku.length) return `<br/>`;
  return haiku.replace(COLON_PREFIX_PATTERN, `<b>$1</b>`).replace(TITLED_LINK_PATTERN, `<a href="$2">$1</a>`);
}

export function domToHaiku(dom: HTMLElement): string {
  return [...dom.querySelectorAll<HTMLElement>("div[data-depth]")].reduce(
    (result, lineElement) => result + domLineToHaikuLine(lineElement),
    ""
  );
}

export function domLineToHaikuLine(line: HTMLElement): string {
  return `${" ".repeat(parseInt(line.dataset.depth as string) * 2)}- ${domInlineToHaiku(line)}\n`;
}

function domInlineToHaiku(dom: HTMLElement): string {
  return [...dom.childNodes].reduce((result, node) => {
    switch (node.nodeType) {
      case 1: // Element
        switch ((node as Element).tagName) {
          case "A":
            const aElement = node as HTMLAnchorElement;
            return result + `[${aElement.textContent}](${aElement.getAttribute("href")})`;
          case "B":
            // bold element can nest any other inline elements
            return result + domInlineToHaiku(node as HTMLElement);
          default:
            return result;
        }
      case 3: // Text
        return result + (node as Text).textContent;
      default:
        return result;
    }
  }, "");
}
