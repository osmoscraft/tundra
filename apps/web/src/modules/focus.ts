import { $ } from "../utils/dom/query";
import { callKA } from "../utils/lang/object";
import { shortPipe } from "../utils/lang/pipe";

export const autofocusIn = (root: ParentNode) => shortPipe($.bind(null, "[autofocus]", root), callKA("focus"));
