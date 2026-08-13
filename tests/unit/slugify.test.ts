import { describe, expect, it } from "vitest";
import { slugify, suggestAlternativeNames, toNameKey } from "@/lib/slugify";

describe("slugify", () => {
  it("normalizes case, spaces and special characters", () => {
    expect(slugify("My New Project!")).toBe("my-new-project");
    expect(slugify("café")).toBe("cafe");
    expect(slugify("  hello  world  ")).toBe("hello-world");
  });

  it("returns empty string for special-character-only names", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("toNameKey", () => {
  it("falls back to trimmed lowercase for empty slugs", () => {
    expect(toNameKey("!!!")).toBe("!!!");
    expect(toNameKey("???")).toBe("???");
  });

  it("slugifies normal names", () => {
    expect(toNameKey("My New Project!")).toBe("my-new-project");
  });
});

describe("suggestAlternativeNames", () => {
  it("suggests numbered alternatives that are not taken", () => {
    expect(suggestAlternativeNames("My Project", ["my-project"])).toEqual([
      "My Project 2",
      "My Project 3",
      "My Project 4",
    ]);
  });

  it("skips already taken numbered names", () => {
    expect(
      suggestAlternativeNames("My Project", ["my-project", "my-project-2"]),
    ).toEqual(["My Project 3", "My Project 4", "My Project 5"]);
  });

  it("handles special-character-only names", () => {
    expect(suggestAlternativeNames("!!!", ["!!!"])).toEqual([
      "!!! 2",
      "!!! 3",
      "!!! 4",
    ]);
  });

  it("respects the requested count", () => {
    expect(suggestAlternativeNames("Alpha", ["alpha"], 2)).toEqual([
      "Alpha 2",
      "Alpha 3",
    ]);
  });

  it("truncates suggestions to fit the max name length", () => {
    const longName = "a".repeat(255);
    const suggestion = suggestAlternativeNames(longName, [
      toNameKey(longName),
    ])[0];

    expect(suggestion).toBe(`${"a".repeat(253)} 2`);
    expect(suggestion.length).toBeLessThanOrEqual(255);
  });
});
