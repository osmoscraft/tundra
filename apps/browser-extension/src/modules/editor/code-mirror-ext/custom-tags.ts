/**
 * Author: Hendrik Erz
 * License: GNU GPL v3
 * Source: https://github.com/Zettlr/Zettlr/blob/develop/source/common/modules/markdown-editor/parser/markdown-parser.ts
 */

import { Tag, tags } from "@lezer/highlight";

export const customTags = {
  YAMLFrontmatterStart: Tag.define(tags.contentSeparator),
  YAMLFrontmatterEnd: Tag.define(tags.contentSeparator),
  YAMLFrontmatterKey: Tag.define(tags.tagName),
  YAMLFrontmatterString: Tag.define(tags.string),
  YAMLFrontmatterBoolean: Tag.define(tags.bool),
  YAMLFrontmatterNumber: Tag.define(tags.number),
  YAMLFrontmatterPlain: Tag.define(),
  // Meta-tags only used to contain the actual values
  YAMLFrontmatterPair: Tag.define(),
  YAMLFrontmatterSeq: Tag.define(),
  YAMLFrontmatterMap: Tag.define(),
};

export const defineYamlNodes = () => [
  { name: "YAMLFrontmatterStart", style: customTags.YAMLFrontmatterStart },
  { name: "YAMLFrontmatterEnd", style: customTags.YAMLFrontmatterEnd },
  { name: "YAMLFrontmatterKey", style: customTags.YAMLFrontmatterKey },
  { name: "YAMLFrontmatterString", style: customTags.YAMLFrontmatterString },
  { name: "YAMLFrontmatterBoolean", style: customTags.YAMLFrontmatterBoolean },
  { name: "YAMLFrontmatterNumber", style: customTags.YAMLFrontmatterNumber },
  { name: "YAMLFrontmatterPlain", style: customTags.YAMLFrontmatterPlain },
  { name: "YAMLFrontmatterPair", style: customTags.YAMLFrontmatterPair },
  { name: "YAMLFrontmatterSeq", style: customTags.YAMLFrontmatterSeq },
  { name: "YAMLFrontmatterMap", style: customTags.YAMLFrontmatterMap },
];
