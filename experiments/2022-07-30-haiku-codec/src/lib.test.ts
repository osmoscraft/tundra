import { readFile } from "fs/promises";
import { JSDOM } from "jsdom";
import path from "path";
import { describe, expect, it } from "vitest";
import { getHtmlToMarkdown, markdownToHtml } from "./lib";

const jsdomParser = (input: string) => new JSDOM(input).window.document;

const jsdomHtmlToMarkdown = getHtmlToMarkdown(jsdomParser);

describe("empty doc", () => {
  it("html to md", () => {
    expect(jsdomHtmlToMarkdown("")).toBe("\n");
  });

  it("md to html", () => {
    expect(markdownToHtml("")).toBe("");
    expect(markdownToHtml("\n")).toBe("");
  });
});

describe("non-list", () => {
  it("html to md", () => {
    expect(jsdomHtmlToMarkdown("hello")).toBe("\n");
  });

  it("md to html", () => {
    expect(markdownToHtml("hello")).toBe("");
  });
});

describe("empty item", () => {
  it("html to md", () => {
    expect(jsdomHtmlToMarkdown(`<div data-depth="0"></div>`)).toBe("- \n");
  });

  it("md to html", () => {
    expect(markdownToHtml("- ")).toBe(`<div data-depth="0"></div>`);
    expect(markdownToHtml("- \n")).toBe(`<div data-depth="0"></div>`);
  });
});

describe("paragraph item", () => {
  it("html to md", () => {
    expect(jsdomHtmlToMarkdown(`<div data-depth="0">hello</div>`)).toBe("- hello\n");
  });

  it("md to html", () => {
    expect(markdownToHtml("- hello")).toBe(`<div data-depth="0">hello</div>`);
  });
});

describe("nested paragraph items", () => {
  it("html to md", () => {
    expect(jsdomHtmlToMarkdown(`<div data-depth="0">hello</div>\n<div data-depth="1">world</div>`)).toBe("- hello\n  - world\n");
  });

  it("md to html", () => {
    expect(markdownToHtml("- hello\n  - world")).toBe(`<div data-depth="0">hello</div>\n<div data-depth="1">world</div>`);
  });
});

describe("link item", () => {
  it("html to md", () => {
    expect(jsdomHtmlToMarkdown(`<div data-depth="0"><a href="https://sample.com/">foo</a></div>`)).toBe("- [foo](https://sample.com/)\n");
  });

  it("md to html", () => {
    expect(markdownToHtml("- [foo](https://sample.com/)")).toBe(`<div data-depth="0"><a href="https://sample.com/">foo</a></div>`);
  });
});

describe("inline link", () => {
  it("html to md", () => {
    expect(jsdomHtmlToMarkdown(`<div data-depth="0">foo: <a href="https://sample.com/">bar</a> and <a href="https://baz.com/">baz</a></div>`)).toBe(
      "- foo: [bar](https://sample.com/) and [baz](https://baz.com/)\n"
    );
  });
  it("md to html", () => {
    expect(markdownToHtml("- foo: [bar](https://sample.com/) and [baz](https://baz.com/)")).toBe(
      `<div data-depth="0">foo: <a href="https://sample.com/">bar</a> and <a href="https://baz.com/">baz</a></div>`
    );
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

  it("links", async () => {
    const { html, markdown } = await loadSnapshot("links.txt");
    expect(markdownToHtml(markdown)).toBe(html);
    expect(jsdomHtmlToMarkdown(html)).toBe(markdown);
  });
});

async function loadSnapshot(name: string): Promise<{ markdown: string; html: string }> {
  const text = await readFile(path.join(__dirname, `snapshots/${name}`), "utf-8");
  const [markdown, html] = text.split("@@@\n");
  return { markdown, html };
}
