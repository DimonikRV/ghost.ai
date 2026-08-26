// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

describe("Tabs components", () => {
  it("renders Tabs with children", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab One</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content One</TabsContent>
      </Tabs>
    );
    expect(screen.getByText("Tab One")).toBeInTheDocument();
    expect(screen.getByText("Content One")).toBeInTheDocument();
  });

  it("renders Tabs with data-slot attribute", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
      </Tabs>
    );
    expect(document.querySelector('[data-slot="tabs"]')).toBeInTheDocument();
  });

  it("renders TabsList", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
      </Tabs>
    );
    expect(document.querySelector('[data-slot="tabs-list"]')).toBeInTheDocument();
  });

  it("renders TabsTrigger", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">First Tab</TabsTrigger>
        </TabsList>
      </Tabs>
    );
    expect(screen.getByText("First Tab")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="tabs-trigger"]')).toBeInTheDocument();
  });

  it("renders TabsContent", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel content</TabsContent>
      </Tabs>
    );
    expect(screen.getByText("Panel content")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="tabs-content"]')).toBeInTheDocument();
  });

  it("renders only active tab panel content", () => {
    render(
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">First panel</TabsContent>
        <TabsContent value="two">Second panel</TabsContent>
      </Tabs>
    );
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
    expect(screen.getByText("First panel")).toBeInTheDocument();
    expect(screen.queryByText("Second panel")).not.toBeInTheDocument();
  });

  it("has correct data-slot on TabsContent", () => {
    render(
      <Tabs defaultValue="x">
        <TabsList>
          <TabsTrigger value="x">X</TabsTrigger>
        </TabsList>
        <TabsContent value="x">Content X</TabsContent>
      </Tabs>
    );
    expect(document.querySelector('[data-slot="tabs-content"]')).toBeInTheDocument();
  });
});
