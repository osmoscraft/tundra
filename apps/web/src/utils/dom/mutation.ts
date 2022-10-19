import { callKA, setV } from "../lang/object";

export const clearHTML = setV("innerHTML", "");

/** childNode -> parentNode -> () */
export const appenChild = <T extends Node>(e: T) => callKA("appendChild", e);

export const appendChildTo = (parent: Node) => (child: Node) => (parent.appendChild(child), parent);
