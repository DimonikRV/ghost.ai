// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

describe("Card components", () => {
  it("renders Card with children", () => {
    render(
      <Card>
        <div>Card content</div>
      </Card>
    );
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("renders Card with data-slot attribute", () => {
    render(<Card />);
    expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
  });

  it("renders CardHeader", () => {
    render(
      <Card>
        <CardHeader>
          <span>Header</span>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="card-header"]')).toBeInTheDocument();
  });

  it("renders CardTitle", () => {
    render(
      <Card>
        <CardTitle>My Title</CardTitle>
      </Card>
    );
    expect(screen.getByText("My Title")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="card-title"]')).toBeInTheDocument();
  });

  it("renders CardContent", () => {
    render(
      <Card>
        <CardContent>
          <span>Content area</span>
        </CardContent>
      </Card>
    );
    expect(screen.getByText("Content area")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="card-content"]')).toBeInTheDocument();
  });

  it("renders CardDescription", () => {
    render(
      <Card>
        <CardDescription>A description</CardDescription>
      </Card>
    );
    expect(screen.getByText("A description")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="card-description"]')).toBeInTheDocument();
  });

  it("renders CardFooter", () => {
    render(
      <Card>
        <CardFooter>
          <button>Footer action</button>
        </CardFooter>
      </Card>
    );
    expect(screen.getByText("Footer action")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="card-footer"]')).toBeInTheDocument();
  });

  it("renders all subcomponents together", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Desc</CardDescription>
        </CardHeader>
        <CardContent>
          <span>Body</span>
        </CardContent>
        <CardFooter>
          <span>Footer</span>
        </CardFooter>
      </Card>
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Desc")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});
