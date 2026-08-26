// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { ProjectNotFound } from "@/components/editor/project-not-found";

describe("ProjectNotFound", () => {
  it("renders Project Not Found heading", () => {
    render(<ProjectNotFound />);
    expect(screen.getByText("Project Not Found")).toBeInTheDocument();
  });

  it("contains link to /editor", () => {
    render(<ProjectNotFound />);
    const link = screen.getByRole("link", { name: /Back to Editor/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/editor");
  });
});
