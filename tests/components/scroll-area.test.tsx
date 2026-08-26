// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@base-ui/react/scroll-area", () => {
  const ScrollAreaRoot = React.forwardRef(
    ({ children, className, ...props }: any, ref: any) => (
      <div ref={ref} data-slot="scroll-area" className={className} {...props}>
        {children}
      </div>
    ),
  );
  ScrollAreaRoot.displayName = "ScrollAreaRoot";

  const ScrollAreaViewport = React.forwardRef(
    ({ children, className, ...props }: any, ref: any) => (
      <div ref={ref} data-slot="scroll-area-viewport" className={className} {...props}>
        {children}
      </div>
    ),
  );
  ScrollAreaViewport.displayName = "ScrollAreaViewport";

  const ScrollAreaScrollbar = React.forwardRef(
    ({ children, className, orientation = "vertical", ...props }: any, ref: any) => (
      <div
        ref={ref}
        data-slot="scroll-area-scrollbar"
        data-orientation={orientation}
        className={className}
        {...props}
      >
        {children}
      </div>
    ),
  );
  ScrollAreaScrollbar.displayName = "ScrollAreaScrollbar";

  const ScrollAreaThumb = React.forwardRef(
    ({ className, ...props }: any, ref: any) => (
      <div ref={ref} data-slot="scroll-area-thumb" className={className} {...props} />
    ),
  );
  ScrollAreaThumb.displayName = "ScrollAreaThumb";

  const ScrollAreaCorner = React.forwardRef(
    ({ ...props }: any, ref: any) => <div ref={ref} {...props} />,
  );
  ScrollAreaCorner.displayName = "ScrollAreaCorner";

  return {
    ScrollArea: {
      Root: ScrollAreaRoot,
      Viewport: ScrollAreaViewport,
      Scrollbar: ScrollAreaScrollbar,
      Thumb: ScrollAreaThumb,
      Corner: ScrollAreaCorner,
    },
  };
});

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

describe("ScrollArea", () => {
  it("renders ScrollArea with children", () => {
    render(
      <ScrollArea>
        <div data-testid="scroll-content">Scrollable content</div>
      </ScrollArea>
    );
    expect(screen.getByTestId("scroll-content")).toBeInTheDocument();
    expect(screen.getByText("Scrollable content")).toBeInTheDocument();
  });

  it("renders ScrollArea with data-slot", () => {
    render(
      <ScrollArea>
        <span>Content</span>
      </ScrollArea>
    );
    expect(document.querySelector('[data-slot="scroll-area"]')).toBeInTheDocument();
  });

  it("renders ScrollBar inside ScrollArea", () => {
    render(
      <ScrollArea>
        <span>Content</span>
      </ScrollArea>
    );
    expect(document.querySelector('[data-slot="scroll-area-scrollbar"]')).toBeInTheDocument();
  });

  it("renders viewport", () => {
    render(
      <ScrollArea>
        <span>Content</span>
      </ScrollArea>
    );
    expect(document.querySelector('[data-slot="scroll-area-viewport"]')).toBeInTheDocument();
  });
});

describe("ScrollBar", () => {
  it("renders ScrollBar with vertical orientation by default", () => {
    render(<ScrollBar />);
    const scrollbar = document.querySelector('[data-slot="scroll-area-scrollbar"]');
    expect(scrollbar).toBeInTheDocument();
    expect(scrollbar).toHaveAttribute("data-orientation", "vertical");
  });

  it("renders ScrollBar with horizontal orientation", () => {
    render(<ScrollBar orientation="horizontal" />);
    const scrollbar = document.querySelector('[data-slot="scroll-area-scrollbar"]');
    expect(scrollbar).toHaveAttribute("data-orientation", "horizontal");
  });
});
