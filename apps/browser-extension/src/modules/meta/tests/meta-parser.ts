import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseMarkdownMeta } from "../meta-parser";

describe("metaParser", () => {
  it("empty file", () => {
    const meta = parseMarkdownMeta("");
    assert.equal(meta, undefined);
  });

  it("empty line", () => {
    const meta = parseMarkdownMeta("\n");
    assert.equal(meta, undefined);
  });

  it("meta only", () => {
    const meta = parseMarkdownMeta(
      `
---
title: Hello
---`.trim()
    );
    assert.deepEqual(meta, { title: "Hello" });
  });

  it("meta only with empty body", () => {
    const meta = parseMarkdownMeta(
      `
---
title: Hello
---
`.trimStart()
    );
    assert.deepEqual(meta, { title: "Hello" });
  });

  it("meta only with body", () => {
    const meta = parseMarkdownMeta(
      `
---
title: Hello
---

Test content
`.trimStart()
    );
    assert.deepEqual(meta, { title: "Hello" });
  });
});
