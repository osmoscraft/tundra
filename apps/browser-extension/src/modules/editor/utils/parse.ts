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

const TITLED_LINK_PATTERN = /\[([^\[\]]+?)\]\((.+?)\)/g; // `[title](target)`
const LEADER_PATTERN = /^(.+:\s)/; // `Keyword or phrase:`

// TODO switch from regex parser to token parser
function parseLine(content = "", lineEnd: string): HaikuLine {
  const isHeadOpen = !content.trimStart().startsWith("- ");
  const isTailOpen = lineEnd !== "\n";

  const listMarkPos = isHeadOpen ? 0 : content.indexOf("- ");
  const depth = listMarkPos >> 1; // divide by 2 using right shift
  const remainingContent = isHeadOpen ? content : content.slice(listMarkPos + 2);
  const children: HaikuInline[] = [];

  const allLinkMatches = [...remainingContent.matchAll(TITLED_LINK_PATTERN)];

  for (let i = 0; i < allLinkMatches.length; i++) {
    const linkMatch = allLinkMatches[i];
    children.push({
      type: "link",
      text: linkMatch[1],
      href: linkMatch[2],
    });

    const textToNextLink = remainingContent.slice(linkMatch.index! + linkMatch[0].length, allLinkMatches[i + 1]?.index);

    if (textToNextLink) {
      children.push({
        type: "text",
        text: textToNextLink,
      });
    }
  }

  const textToFirstLink = remainingContent.slice(0, allLinkMatches[0]?.index);
  if (textToFirstLink || !children.length) {
    const leaderText = textToFirstLink?.match(LEADER_PATTERN)?.[1];
    const textAfterLeader = textToFirstLink.slice(leaderText?.length);

    if (textAfterLeader) {
      children.unshift({
        type: "text",
        text: textAfterLeader,
      });
    }

    if (leaderText) {
      children.unshift({
        type: "leader",
        text: leaderText,
      });
    }

    if (!children.length) {
      children.unshift({
        type: "text",
        text: "",
      });
    }
  }

  return {
    type: "line",
    ...(isHeadOpen ? { isHeadOpen } : { depth }),
    ...(isTailOpen && { isTailOpen }),
    children,
  };
}
