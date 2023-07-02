import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractMarkdownMeta } from "../extract-meta";

describe("metaParser", () => {
  it("empty file", () => {
    const meta = extractMarkdownMeta("");
    assert.equal(meta, undefined);
  });

  it("empty line", () => {
    const meta = extractMarkdownMeta("\n");
    assert.equal(meta, undefined);
  });

  it("meta only", () => {
    const meta = extractMarkdownMeta(
      `
---
title: Hello
---`.trim()
    );
    assert.deepEqual(meta, { title: "Hello" });
  });

  it("meta only with empty body", () => {
    const meta = extractMarkdownMeta(
      `
---
title: Hello
---
`.trimStart()
    );
    assert.deepEqual(meta, { title: "Hello" });
  });

  it("meta only with body", () => {
    const meta = extractMarkdownMeta(
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
