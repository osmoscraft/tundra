import type { HaikuFragment, HaikuInline, HaikuLine } from "./syntax";

/**
 * `""`:- $1 `undefined`, $2 `""` \
 * `"text"`: $1 `"text"`, $2 `""` \
 * `"\n"`: $1 `undefined`, $2 `"\n"` \
 * `"text\n"`: $1 `"text"`, $2 `"\n"`
 */
const LINE = /^(.*)?(\n|$)/gm;

export function parse(haiku: string): HaikuFragment {
  // naive parser
  const lines = haiku.matchAll(LINE);
  const children = [...lines]
    .filter((lineMatch) => lineMatch[1] || lineMatch[2])
    .map((lineMatch) => parseLine(lineMatch[1], lineMatch[2]));

  return {
    type: "fragment",
    children,
  };
}

function parseLine(content = "", lineEnd: string): HaikuLine {
  const isHeadOpen = !content.trimStart().startsWith("- ");
  const isTailOpen = lineEnd !== "\n";

  const listMarkPos = isHeadOpen ? 0 : content.indexOf("- ");
  const depth = listMarkPos >> 1; // divide by 2 using right shift
  const inlineContent = isHeadOpen ? content : content.slice(listMarkPos + 2);

  const children: HaikuInline[] = [
    {
      type: "text",
      text: inlineContent,
    },
  ];

  return {
    type: "line",
    ...(isHeadOpen ? { isHeadOpen } : { depth }),
    ...(isTailOpen && { isTailOpen }),
    children,
  };
}
