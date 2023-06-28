import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseMarkdownNote } from "../markdown-note";

describe("parseMarkdownNote", () => {
  it("empty file", () => {
    const { frontmatter, body } = parseMarkdownNote("");
    assert.equal(body, "");
    assert.equal(frontmatter, undefined);
  });

  it("empty line", () => {
    const { frontmatter, body } = parseMarkdownNote("\n");
    assert.equal(body, "\n");
    assert.equal(frontmatter, undefined);
  });

  it("frontmatter only", () => {
    const { frontmatter, body } = parseMarkdownNote(
      `
---
title: Hello
---`.trim()
    );
    assert.equal(body, "");
    assert.deepEqual(frontmatter, { title: "Hello" });
  });

  it("frontmatter only with empty body", () => {
    const { frontmatter, body } = parseMarkdownNote(
      `
---
title: Hello
---
`.trimStart()
    );
    assert.equal(body, "\n");
    assert.deepEqual(frontmatter, { title: "Hello" });
  });

  it("frontmatter only with body", () => {
    const { frontmatter, body } = parseMarkdownNote(
      `
---
title: Hello
---

Test content
`.trimStart()
    );
    assert.equal(body, "\n\nTest content\n");
    assert.deepEqual(frontmatter, { title: "Hello" });
  });
});
