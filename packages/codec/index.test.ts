import { describe, expect, it } from "vitest";
import { getCodec, htmlToMarkdownPlugins, markdownToHtmlPlugins } from ".";

describe("toMarkdown", () => {
  it("empty input", async () => {
    expect(await getCodec(htmlToMarkdownPlugins)("")).toBe("");
  });

  it("plaintext", async () => {
    expect(await getCodec(htmlToMarkdownPlugins)("hello world")).toBe("hello world\n");
  });
});

describe("toHtml", () => {
  it("empty input", async () => {
    expect(await getCodec(markdownToHtmlPlugins)("")).toBe("");
  });

  it("plaintext", async () => {
    expect(await getCodec(markdownToHtmlPlugins)("hello world")).toBe("<p>hello world</p>");
  });
});
