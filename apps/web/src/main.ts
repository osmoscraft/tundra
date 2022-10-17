import { $$ } from "./utils/dom";

export async function main() {
  const dialogs = () => [...$$("dialog")];
  const observeOnOpen = (observer: MutationObserver) => (target: Node) => observer.observe(target, { attributeFilter: ["open"] });
  const trapFocusOnOpen = observeOnOpen(new MutationObserver(console.log));

  dialogs().map(trapFocusOnOpen);
}

main();
