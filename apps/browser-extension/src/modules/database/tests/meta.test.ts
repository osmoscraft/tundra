import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractMarkdownMeta } from "../meta";

describe("extractMeta", () => {
  it("empty file", () => {
    const meta = extractMarkdownMeta("");
    assert.deepEqual(meta, {});
  });

  it("empty line", () => {
    const meta = extractMarkdownMeta("\n");
    assert.deepEqual(meta, {});
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
