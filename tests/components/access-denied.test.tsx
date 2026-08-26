// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { AccessDenied } from "@/components/editor/access-denied";

describe("AccessDenied", () => {
  it("renders Access Denied heading", () => {
    render(<AccessDenied />);
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
  });

  it("contains link to /editor", () => {
    render(<AccessDenied />);
    const link = screen.getByRole("link", { name: /Back to Editor/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/editor");
  });
});
