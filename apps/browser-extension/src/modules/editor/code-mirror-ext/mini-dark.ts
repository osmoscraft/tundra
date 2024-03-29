import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { customTags } from "./custom-tags";
import "./mini-dark.css";

// Based on https://github.com/codemirror/theme-one-dark
// Using https://github.com/one-dark/vscode-one-dark-theme/ as reference for the colors

const chalky = "#e5c07b",
  coral = "#e06c75", // pink
  cyan = "#56b6c2",
  invalid = "#ffffff",
  ivory = "#b7becb", // grey
  stone = "#7d8799", // dark grey, Brightened compared to original to increase contrast
  malibu = "#61afef", // light blue
  sage = "#98c379", // lime green
  whiskey = "#d19a66", // salmon
  violet = "#c678dd", // light purple
  darkBackground = "#21252b",
  highlightBackground = "#2c313a",
  background = "#282c34",
  tooltipBackground = "#353a42",
  selection = "#3E4451",
  cursor = "#528bff"; // electric blue

export const color = {
  chalky,
  coral,
  cyan,
  invalid,
  ivory,
  stone,
  malibu,
  sage,
  whiskey,
  violet,
  darkBackground,
  highlightBackground,
  background,
  tooltipBackground,
  selection,
  cursor,
};

export const miniDarkTheme = EditorView.theme(
  {
    "&": {
      // body text
      color: ivory,
      backgroundColor: darkBackground,
    },

    ".cm-content": {
      caretColor: cursor,
    },

    ".cm-cursor, .cm-dropCursor": { borderLeftColor: cursor },
    ".cm-panels": { backgroundColor: darkBackground, color: ivory },

    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "#61afef60",
    },

    ".cm-activeLine": {
      backgroundColor: `#61afef20`,
    },
  },
  { dark: true }
);

// Ref: https://github.com/lezer-parser/markdown/blob/91eb10240cacac3c4c65b812dd8fd3023af8c25c/src/markdown.ts#L1862C1-L1885C3

export const miniDarkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: whiskey, fontWeight: "bold" },
  // { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: coral },
  // { tag: [t.function(t.variableName), t.labelName], color: malibu },
  // { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: whiskey },
  // { tag: [t.definition(t.name), t.separator], color: stone },
  // { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: chalky },
  // { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: cyan },
  // { tag: [t.meta, t.comment], color: stone },
  // { tag: t.strong, fontWeight: "bold" },
  // { tag: t.emphasis, fontStyle: "italic" },
  // { tag: t.strikethrough, textDecoration: "line-through" },
  // { tag: t.link, color: malibu, textDecoration: "underline" },
  { tag: t.heading, fontWeight: "bold" },
  { tag: t.heading1, fontWeight: "bold", color: sage },
  { tag: t.heading2, fontWeight: "bold", color: violet },
  { tag: t.heading3, fontWeight: "bold", color: chalky },
  { tag: t.heading4, fontWeight: "bold", color: cyan },
  { tag: t.heading5, fontWeight: "bold", color: malibu },
  { tag: t.heading6, fontWeight: "bold", color: coral },
  // { tag: [t.atom, t.bool, t.special(t.variableName)], color: whiskey },
  // { tag: [t.processingInstruction, t.string, t.inserted], color: malibu },
  { tag: t.processingInstruction, class: "cm-minidark-symbol" },
  { tag: t.list, class: "cm-minidark-list" },
  { tag: t.url, class: "cm-minidark-url" },
  { tag: t.link, class: "cm-minidark-link" },
  { tag: t.invalid, color: invalid },
  // { tag: [t.link, t.url], color: malibu },
  // yaml extensions
  // Styling for YAML frontmatters
  // FIXME: only start and end tags are working
  { tag: customTags.YAMLFrontmatterStart, color: stone },
  { tag: customTags.YAMLFrontmatterEnd, color: stone },
]);

export const miniDark: () => Extension = () => [miniDarkTheme, syntaxHighlighting(miniDarkHighlightStyle)];
