import { Nomad } from "./utils/dom";

export async function main() {
  // console.log([...chain((node: Node) => node, document.querySelectorAll("*"))]);
  console.log([
    ...Nomad.$("*")
      .chain((node) => node.querySelectorAll("div,section,p,a"))
      // .chain((node) => node.querySelectorAll("button"))
      .chain((node) => node.querySelectorAll("*")),
  ]);

  const results = [...Nomad.$<HTMLButtonElement>("button")];
  console.log(results);
}

main();
