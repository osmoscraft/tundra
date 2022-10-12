import { describe, expect, it } from "vitest";
import { demethodize, Demethodized } from "../demethodize";

describe("demethodizeAll", () => {
  it("has original method", () => {
    const trim = demethodize(String.prototype.trim) as Demethodized<String, "trim">;
    expect(typeof trim === "function");
  });

  it("has original method with arity 0", () => {
    const trim = demethodize(String.prototype.trim) as Demethodized<String, "trim">;
    expect(trim(" abc ") === "abc");
  });

  it("has original method with arity 1", () => {
    const slice = demethodize(String.prototype.slice) as Demethodized<String, "slice">;
    expect(slice("abc", 1) === "bc");
  });

  it("has original method with arity many", () => {
    const slice = demethodize(String.prototype.slice) as Demethodized<String, "slice">;
    expect(slice("abcde", 1, 2) === "bc");
  });

  it("can mutate argument", () => {
    const mutableArray = [1, 2, 3, 4, 5];
    const pop = demethodize(Array.prototype.pop) as Demethodized<any[], "pop">;

    expect(pop(mutableArray)).toBe(5);
    expect(mutableArray).toEqual([1, 2, 3, 4]);
  });
});
