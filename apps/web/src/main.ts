import { Nomad } from "./utils/dom";

export async function main() {
  // console.log([...chain((node: Node) => node, document.querySelectorAll("*"))]);
  // console.log([
  //   ...Nomad.of("*")
  //     .chain((node) => node.querySelectorAll("div,section,p,a"))
  //     .chain((node) => node.querySelectorAll("button"))
  //     .chain((node) => node.querySelectorAll("*")),
  // ]);

  const results = [...Nomad.of<HTMLButtonElement>("button")];
  console.log(results);
}

main();
