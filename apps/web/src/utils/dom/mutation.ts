import { callKA_, setKV_ } from "../lang/object";

export const clearHTML = setKV_("innerHTML", "");

/** child -> parent -> child */
export const appenChildTo = <T extends Node>(child: T) => callKA_("appendChild", child);

/** parent -> child -> parent */
export const appendParentWith = (parent: Node) => (child: Node) => (parent.appendChild(child), parent);
