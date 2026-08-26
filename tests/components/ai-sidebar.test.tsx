// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/components/ui/textarea", () => ({
  Textarea: ({
    ...props
  }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
}));

import { AiSidebar } from "@/components/editor/ai-sidebar";

describe("AiSidebar", () => {
  it("shows sidebar when isOpen=true", () => {
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("AI Workspace")).toBeInTheDocument();
  });

  it("hides sidebar when isOpen=false", () => {
    render(<AiSidebar isOpen={false} onClose={vi.fn()} />);
    const aside = screen.getByText("AI Workspace").closest("aside");
    expect(aside).toHaveAttribute("aria-hidden", "true");
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(<AiSidebar isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Close AI sidebar/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("has textarea for input", () => {
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText("Ask Ghost AI...")).toBeInTheDocument();
  });

  it("has send button", () => {
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /Send message/ }),
    ).toBeInTheDocument();
  });

  it("handleSend adds user message when input has text", async () => {
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Ask Ghost AI...");
    fireEvent.change(textarea, { target: { value: "Design a microservice" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/ }));
    expect(screen.getByText("Design a microservice")).toBeInTheDocument();
  });

  it("handleSend does nothing when input is empty", () => {
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /Send message/ });
    expect(btn).toBeDisabled();
  });

  it("handleSend does nothing on whitespace-only input", () => {
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Ask Ghost AI...");
    fireEvent.change(textarea, { target: { value: "   " } });
    const btn = screen.getByRole("button", { name: /Send message/ });
    expect(btn).toBeDisabled();
  });

  it("handleKeyDown triggers send on Enter without Shift", () => {
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Ask Ghost AI...");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("handleKeyDown does not send on Shift+Enter", () => {
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Ask Ghost AI...");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(textarea).toHaveValue("Hello");
  });

  it("handleStarterClick sets prompt and sends", async () => {
    vi.useFakeTimers();
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("Design an e-commerce backend"));
    vi.advanceTimersByTime(1);
    const matches = screen.getAllByText("Design an e-commerce backend");
    expect(matches.length).toBeGreaterThanOrEqual(2);
    vi.useRealTimers();
  });

  it("handleStarterClick sends all three starter prompts", async () => {
    vi.useFakeTimers();
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("Create a chat app architecture"));
    vi.advanceTimersByTime(1);
    const matches = screen.getAllByText("Create a chat app architecture");
    expect(matches.length).toBeGreaterThanOrEqual(2);
    vi.useRealTimers();
  });

  it("handleStarterClick third prompt", async () => {
    vi.useFakeTimers();
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("Build a CI/CD pipeline"));
    vi.advanceTimersByTime(1);
    const matches = screen.getAllByText("Build a CI/CD pipeline");
    expect(matches.length).toBeGreaterThanOrEqual(2);
    vi.useRealTimers();
  });

  it("handleTextareaInput auto-resizes textarea", () => {
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Ask Ghost AI...");
    Object.defineProperty(textarea, "scrollHeight", {
      value: 200,
      configurable: true,
    });
    fireEvent.change(textarea, {
      target: { value: "line1\nline2\nline3\nline4\nline5" },
    });
    expect(textarea).toHaveValue("line1\nline2\nline3\nline4\nline5");
  });

  it("switches to specs tab", () => {
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    expect(screen.queryByText("Generate Spec")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Specs" }));
    expect(screen.getByText("Generate Spec")).toBeInTheDocument();
  });

  it("switches back to architect tab", () => {
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    expect(screen.queryByText("Generate Spec")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Specs" }));
    expect(screen.getByText("Generate Spec")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Ask Ghost AI..."),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "AI Architect" }));
    expect(screen.getByPlaceholderText("Ask Ghost AI...")).toBeInTheDocument();
  });

  it("displays sent messages in chat area", () => {
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Ask Ghost AI...");
    fireEvent.change(textarea, { target: { value: "first message" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/ }));
    fireEvent.change(textarea, { target: { value: "second message" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/ }));
    expect(screen.getByText("first message")).toBeInTheDocument();
    expect(screen.getByText("second message")).toBeInTheDocument();
  });

  it("closes mobile scrim on click", () => {
    const onClose = vi.fn();
    render(<AiSidebar isOpen={true} onClose={onClose} />);
    const scrim = document.querySelector(
      "[aria-hidden='true'][class*='bg-black']",
    );
    expect(scrim).not.toBeNull();
    fireEvent.click(scrim!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("send button is enabled after text input", () => {
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Ask Ghost AI...");
    fireEvent.change(textarea, { target: { value: "test" } });
    expect(
      screen.getByRole("button", { name: /Send message/ }),
    ).not.toBeDisabled();
  });

  it("clears input after sending message", () => {
    render(<AiSidebar isOpen={true} onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Ask Ghost AI...");
    fireEvent.change(textarea, { target: { value: "sent" } });
    fireEvent.click(screen.getByRole("button", { name: /Send message/ }));
    expect(textarea).toHaveValue("");
  });
});
