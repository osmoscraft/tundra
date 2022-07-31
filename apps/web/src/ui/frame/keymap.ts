import { lift, selectParentNode, toggleMark } from "prosemirror-commands";
import { redo, undo } from "prosemirror-history";
import { undoInputRule } from "prosemirror-inputrules";
import type { Schema } from "prosemirror-model";
import { liftListItem, sinkListItem, splitListItem } from "prosemirror-schema-list";
import type { Command } from "prosemirror-state";

const mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false;

export function buildKeymap(schema: Schema, mapKeys?: { [key: string]: false | string }) {
  let keys: { [key: string]: Command } = {},
    type;
  function bind(key: string, cmd: Command) {
    if (mapKeys) {
      let mapped = mapKeys[key];
      if (mapped === false) return;
      if (mapped) key = mapped;
    }
    keys[key] = cmd;
  }

  bind("Mod-z", undo);
  bind("Shift-Mod-z", redo);
  bind("Backspace", undoInputRule);
  if (!mac) bind("Mod-y", redo);

  bind("Mod-BracketLeft", lift);
  bind("Escape", selectParentNode);

  if ((type = schema.marks.strong)) {
    bind("Mod-b", toggleMark(type));
    bind("Mod-B", toggleMark(type));
  }
  if ((type = schema.marks.em)) {
    bind("Mod-i", toggleMark(type));
    bind("Mod-I", toggleMark(type));
  }
  if ((type = schema.marks.code)) bind("Mod-`", toggleMark(type));

  if ((type = schema.nodes.list_item)) {
    bind("Enter", splitListItem(type));
    bind("Mod-,", liftListItem(type));
    bind("Mod-.", sinkListItem(type));
  }

  return keys;
}
