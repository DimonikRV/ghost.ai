import { describe, expect, it } from "vitest";
import { projectNameError } from "@/lib/validate-project-name";

describe("projectNameError", () => {
  it("returns null for valid Latin names", () => {
    expect(projectNameError("My Project")).toBeNull();
    expect(projectNameError("Project 2")).toBeNull();
    expect(projectNameError("my-project_name")).toBeNull();
    expect(projectNameError("A - B_1")).toBeNull();
  });

  it("returns an error for an empty name", () => {
    expect(projectNameError("")).toContain("required");
  });

  it("rejects Cyrillic characters", () => {
    expect(projectNameError("Привет")).toContain("Latin letters");
    expect(projectNameError("Привет Project")).toContain("Latin letters");
  });

  it("rejects special symbols", () => {
    expect(projectNameError("My Project!!")).toContain("Latin letters");
    expect(projectNameError("!!!")).toContain("Latin letters");
    expect(projectNameError("100%")).toContain("Latin letters");
  });

  it("rejects other scripts", () => {
    expect(projectNameError("プロジェクト")).toContain("Latin letters");
    expect(projectNameError("ελψ")).toContain("Latin letters");
  });
});
