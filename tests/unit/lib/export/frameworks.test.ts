import { describe, expect, it } from "vitest";
import { FRAMEWORKS, getFramework } from "@/lib/export/frameworks";

describe("FRAMEWORKS", () => {
  it("has exactly 10 entries", () => {
    expect(FRAMEWORKS).toHaveLength(10);
  });

  it.each(FRAMEWORKS)("has required fields for %s", (fw) => {
    expect(typeof fw.id).toBe("string");
    expect(fw.id.length).toBeGreaterThan(0);
    expect(typeof fw.name).toBe("string");
    expect(fw.name.length).toBeGreaterThan(0);
    expect(typeof fw.language).toBe("string");
    expect(fw.language.length).toBeGreaterThan(0);
    expect(typeof fw.promptHints).toBe("string");
    expect(fw.promptHints.length).toBeGreaterThan(0);
    expect(typeof fw.description).toBe("string");
    expect(typeof fw.icon).toBe("string");
    expect(Array.isArray(fw.fileExtensions)).toBe(true);
  });
});

describe("getFramework", () => {
  it("returns the correct framework by id", () => {
    const fw = getFramework("spring-boot");
    expect(fw).toBeDefined();
    expect(fw?.name).toBe("Java Spring Boot");
  });

  it("returns undefined for an unknown id", () => {
    expect(getFramework("nonexistent")).toBeUndefined();
  });
});
