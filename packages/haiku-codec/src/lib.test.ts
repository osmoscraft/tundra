import { readFile } from "fs/promises";
import { JSDOM } from "jsdom";
import path from "path";
import { describe, expect, it } from "vitest";
import { domToMarkdown, getHtmlToMarkdown, markdownToHtml } from "./lib";

const jsdomParser = (input: string) => new JSDOM(input).window.document;

const jsdomHtmlToMarkdown = getHtmlToMarkdown(jsdomParser);

describe("htmlToMarkdown", () => {
  it("empty input", async () => {
    const dom = new JSDOM("").window.document;
    expect(domToMarkdown(dom)).toBe("\n");
  });

  it("non-list text", async () => {
    const dom = new JSDOM("hello").window.document;
    expect(domToMarkdown(dom)).toBe("\n");
  });
});

describe("markdownToHtml", () => {
  it("empty input", async () => {
    expect(markdownToHtml("")).toBe("");
  });

  it("non-list markdown", async () => {
    expect(markdownToHtml("hello")).toBe("");
  });

  it("empty list markdown", async () => {
    expect(markdownToHtml("- ")).toBe(`<div data-depth="0"></div>`);
  });

  it("list markdown", async () => {
    expect(markdownToHtml("- hello")).toBe(`<div data-depth="0">hello</div>`);
  });

  it("nested list markdown", async () => {
    expect(markdownToHtml("- hello\n  - world")).toBe(`<div data-depth="0">hello</div>\n<div data-depth="1">world</div>`);
  });

  it("item as link", async () => {
    expect(markdownToHtml("- [foo](https://sample.com)")).toBe(`<div data-depth="0"><a href="https://sample.com">foo</a></div>`);
  });

  it("item that includes a link", async () => {
    expect(markdownToHtml("- foo: [bar](https://sample.com)")).toBe(`<div data-depth="0">foo: <a href="https://sample.com">bar</a></div>`);
  });
});

describe("e2e", () => {
  it("simple list", async () => {
    const { html, markdown } = await loadSnapshot("simple.txt");
    expect(markdownToHtml(markdown)).toBe(html);
    expect(jsdomHtmlToMarkdown(html)).toBe(markdown);
  });

  it("nested list", async () => {
    const { html, markdown } = await loadSnapshot("nested.txt");
    expect(markdownToHtml(markdown)).toBe(html);
    expect(jsdomHtmlToMarkdown(html)).toBe(markdown);
  });
});

async function loadSnapshot(name: string): Promise<{ markdown: string; html: string }> {
  const text = await readFile(path.join(__dirname, `snapshots/${name}`), "utf-8");
  const [markdown, html] = text.split("@@@\n");
  return { markdown, html };
}
