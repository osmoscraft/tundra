import { on } from "../../utils/event";
import { $$focusable } from "../../utils/focus";
import { pipe, shortPipe } from "../../utils/functional/pipe";
import { tap } from "../../utils/functional/tap";
import { applyProp, getProp, setProp } from "../../utils/object";
import { handleShortcuts } from "./keyboard";

export const openDialog = (template: string) =>
  pipe(
    setProp("innerHTML", template),
    setProp("open", true),
    on("keydown", handleShortcuts([["Escape", "shell.closeDialog"]])),
    tap(shortPipe($$focusable, getProp(0), applyProp("focus", [])))
  );

export const closeDialog = () => pipe(setProp("innerHTML", ""), setProp("open", false));
