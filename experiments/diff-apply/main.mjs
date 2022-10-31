import * as Diff from "diff";
// import fs from "fs/promises";

console.log(typeof Diff);

const base = `- This is a new change!\n- Changed\n- Item 2 more\n  - More [items](https://wikipedia.org/) to show\n  - How about this?\n- Back to Item 3\n`;

const diff = `--- somefile.txt\n+++ somefile.txt\n@@ -1,5 +1,8 @@\n-- This is a new change!\n+- New line inserted here\n+  - Child line\n+- This is a new change!! Line below deleted \"Changed\"\n - Item 2 more\n   - More [items](https://wikipedia.org/) to show\n-  - How about this?\n+  - How about Link added here: [this?](https://www.google.com)\n - Back to Item 3\n+- Appending more`;
const diffWithoutFileName = `@@ -1,5 +1,8 @@\n-- This is a new change!\n+- New line inserted here\n+  - Child line\n+- This is a new change!! Line below deleted \"Changed\"\n - Item 2 more\n   - More [items](https://wikipedia.org/) to show\n-  - How about this?\n+  - How about Link added here: [this?](https://www.google.com)\n - Back to Item 3\n+- Appending more`;

async function main() {
  // const base = await fs.readFile("base.txt", "utf-8");
  // console.log(base);

  const base2 = await fetch(
    "https://raw.githubusercontent.com/chuanqisun/tinykb-sandbox/8a83aa3b3bad5afca55658ae106fb37e5408da76/frames/0ce3711f-148e-4ec2-9071-e293d29eab1c.md?token=GHSAT0AAAAAABZEOHOCA3V76MEWLKTPKT5AY27LCZA"
  ).then((res) => res.text());
  console.log(base2);

  const parsedPatch = Diff.parsePatch(diff);
  const result = Diff.applyPatch(base2, parsedPatch);

  console.log(result);
}

main();
