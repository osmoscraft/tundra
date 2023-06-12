import assert from "node:assert";
import { describe, it } from "node:test";
import { parse } from "../parse";
import type { HaikuFragment } from "../syntax";

function assertParseResult(haiku: string, expected: HaikuFragment) {
  assert.deepEqual(parse(haiku), expected);
}

describe("parse", () => {
  it("empty", () => {
    assertParseResult("", {
      type: "fragment",
      children: [],
    });
  });

  it("inline text only", () => {
    assertParseResult("hello", {
      type: "fragment",
      children: [
        {
          type: "line",
          isHeadOpen: true,
          isTailOpen: true,
          children: [{ type: "text", text: "hello" }],
        },
      ],
    });
  });

  it("empty line", () => {
    assertParseResult("\n", {
      type: "fragment",
      children: [
        {
          type: "line",
          isHeadOpen: true,
          children: [{ type: "text", text: "" }],
        },
      ],
    });
  });

  it("text line", () => {
    assertParseResult("hello\n", {
      type: "fragment",
      children: [
        {
          type: "line",
          isHeadOpen: true,
          children: [{ type: "text", text: "hello" }],
        },
      ],
    });
  });

  it("text multi-line", () => {
    assertParseResult("hello\nworld", {
      type: "fragment",
      children: [
        {
          type: "line",
          isHeadOpen: true,
          children: [{ type: "text", text: "hello" }],
        },
        {
          type: "line",
          isHeadOpen: true,
          isTailOpen: true,
          children: [{ type: "text", text: "world" }],
        },
      ],
    });
  });

  it("marker without space", () => {
    assertParseResult("-", {
      type: "fragment",
      children: [
        {
          type: "line",
          isHeadOpen: true,
          isTailOpen: true,
          children: [{ type: "text", text: "-" }],
        },
      ],
    });
  });

  it("empty line", () => {
    assertParseResult("- ", {
      type: "fragment",
      children: [
        {
          type: "line",
          depth: 0,
          isTailOpen: true,
          children: [{ type: "text", text: "" }],
        },
      ],
    });
  });

  it("line with text", () => {
    assertParseResult("- hello", {
      type: "fragment",
      children: [
        {
          type: "line",
          depth: 0,
          isTailOpen: true,
          children: [{ type: "text", text: "hello" }],
        },
      ],
    });
  });

  it("link", () => {
    assertParseResult("[hello](https://example.com)", {
      type: "fragment",
      children: [
        {
          type: "line",
          isHeadOpen: true,
          isTailOpen: true,
          children: [
            {
              type: "link",
              text: "hello",
              href: "https://example.com",
            },
          ],
        },
      ],
    });
  });

  it("line with link", () => {
    assertParseResult("- [hello](https://example.com)", {
      type: "fragment",
      children: [
        {
          type: "line",
          depth: 0,
          isTailOpen: true,
          children: [
            {
              type: "link",
              text: "hello",
              href: "https://example.com",
            },
          ],
        },
      ],
    });
  });

  it("line with text + link", () => {
    assertParseResult("- hello [world](https://example.com)", {
      type: "fragment",
      children: [
        {
          type: "line",
          depth: 0,
          isTailOpen: true,
          children: [
            {
              type: "text",
              text: "hello ",
            },
            {
              type: "link",
              text: "world",
              href: "https://example.com",
            },
          ],
        },
      ],
    });
  });

  it("line with link + text", () => {
    assertParseResult("- [hello](https://example.com) world", {
      type: "fragment",
      children: [
        {
          type: "line",
          depth: 0,
          isTailOpen: true,
          children: [
            {
              type: "link",
              text: "hello",
              href: "https://example.com",
            },
            {
              type: "text",
              text: " world",
            },
          ],
        },
      ],
    });
  });

  it("Leader", () => {
    assertParseResult("hello: ", {
      type: "fragment",
      children: [
        {
          type: "line",
          isHeadOpen: true,
          isTailOpen: true,
          children: [
            {
              type: "leader",
              text: "hello: ",
            },
          ],
        },
      ],
    });
  });

  it("Line with Leader", () => {
    assertParseResult("- hello: ", {
      type: "fragment",
      children: [
        {
          type: "line",
          depth: 0,
          isTailOpen: true,
          children: [
            {
              type: "leader",
              text: "hello: ",
            },
          ],
        },
      ],
    });
  });

  it("Line with Leader and text", () => {
    assertParseResult("- hello: world", {
      type: "fragment",
      children: [
        {
          type: "line",
          depth: 0,
          isTailOpen: true,
          children: [
            {
              type: "leader",
              text: "hello: ",
            },
            {
              type: "text",
              text: "world",
            },
          ],
        },
      ],
    });
  });

  it("Line with Leader, text and link", () => {
    assertParseResult("- hello: [world](https://example.com) test", {
      type: "fragment",
      children: [
        {
          type: "line",
          depth: 0,
          isTailOpen: true,
          children: [
            {
              type: "leader",
              text: "hello: ",
            },
            {
              type: "link",
              text: "world",
              href: "https://example.com",
            },
            {
              type: "text",
              text: " test",
            },
          ],
        },
      ],
    });
  });

  it("Precedence Link > Leader", () => {
    assertParseResult("- [hello](https://example.com): world", {
      type: "fragment",
      children: [
        {
          type: "line",
          depth: 0,
          isTailOpen: true,
          children: [
            {
              type: "link",
              text: "hello",
              href: "https://example.com",
            },
            {
              type: "text",
              text: ": world",
            },
          ],
        },
      ],
    });
  });

  it("Precedence Link > Leader", () => {
    assertParseResult("- [hello: world](https://example.com)", {
      type: "fragment",
      children: [
        {
          type: "line",
          depth: 0,
          isTailOpen: true,
          children: [
            {
              type: "link",
              text: "hello: world",
              href: "https://example.com",
            },
          ],
        },
      ],
    });
  });

  it("Multiple lines", () => {
    assertParseResult("- hello\n  - world\n", {
      type: "fragment",
      children: [
        {
          type: "line",
          depth: 0,
          children: [{ type: "text", text: "hello" }],
        },
        {
          type: "line",
          depth: 1,
          children: [{ type: "text", text: "world" }],
        },
      ],
    });
  });
});
