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
});
