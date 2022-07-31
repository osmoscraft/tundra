import { dropCursor } from "prosemirror-dropcursor";
import { buildInputRules, buildMenuItems } from "prosemirror-example-setup";
import { gapCursor } from "prosemirror-gapcursor";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { menuBar } from "prosemirror-menu";
import type { Schema } from "prosemirror-model";
import { buildKeymap } from "./keymap";

export function getPlugins(schema: Schema) {
  return [
    buildInputRules(schema),
    keymap(buildKeymap(schema)),
    // keymap(baseKeymap),
    history(),
    dropCursor(),
    gapCursor(),
    menuBar({ floating: false, content: buildMenuItems(schema).fullMenu }),
  ];
}
