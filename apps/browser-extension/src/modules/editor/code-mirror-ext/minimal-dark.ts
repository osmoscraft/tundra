import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { customTags } from "./custom-tags";

// Based on https://github.com/codemirror/theme-one-dark
// Using https://github.com/one-dark/vscode-one-dark-theme/ as reference for the colors

const chalky = "#e5c07b",
  coral = "#e06c75", // pink
  cyan = "#56b6c2",
  invalid = "#ffffff",
  ivory = "#abb2bf", // grey
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

export const oneDarkTheme = EditorView.theme(
  {
    "&": {
      color: ivory,
      backgroundColor: darkBackground,
    },

    ".cm-content": {
      caretColor: cursor,
    },

    ".cm-cursor, .cm-dropCursor": { borderLeftColor: cursor },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: chalky, color: darkBackground },

    ".cm-panels": { backgroundColor: darkBackground, color: ivory },

    ".cm-activeLine": {
      backgroundColor: `#ffffff30`,
      backdropFilter: `brightness(0.8)`,
      filter: `brightness(1.25) contrast(1.25)`,
    },
    ".cm-selectionMatch": { backgroundColor: "#aafe661a" },

    "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
      backgroundColor: "#bad0f847",
    },

    ".cm-gutters": {
      backgroundColor: background,
      color: stone,
      border: "none",
    },
  },
  { dark: true }
);

export const minimalDarkHighlightStyle = HighlightStyle.define([
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
  // { tag: [t.processingInstruction], color: stone },
  // { tag: [t.processingInstruction, t.string, t.inserted], color: malibu },
  { tag: t.invalid, color: invalid },
  // { tag: [t.link, t.url], color: malibu },
  // yaml extensions
  // Styling for YAML frontmatters
  // FIXME: only start and end tags are working
  { tag: customTags.YAMLFrontmatterStart, color: stone },
  { tag: customTags.YAMLFrontmatterEnd, color: stone },
  // { tag: customTags.YAMLFrontmatterKey, fontWeight: "bold", color: malibu },
  // { tag: customTags.YAMLFrontmatterString, color: malibu },
  // { tag: customTags.YAMLFrontmatterBoolean, color: malibu },
  // { tag: customTags.YAMLFrontmatterNumber, color: malibu },
  { tag: customTags.YAMLFrontmatterPlain, color: malibu },
]);

export const minimalDark: () => Extension = () => [oneDarkTheme, syntaxHighlighting(minimalDarkHighlightStyle)];
