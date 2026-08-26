// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

let capturedShareProps: any;

vi.mock("@liveblocks/react", () => ({
  LiveblocksProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  RoomProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/editor/project-sidebar", () => ({
  ProjectSidebar: (props: any) => (
    <div data-testid="sidebar" data-is-open={String(props.isOpen)} />
  ),
}));

vi.mock("@/components/editor/share-dialog", () => {
  return {
    __esModule: true,
    ShareDialog: (props: any) => {
      capturedShareProps = props;
      return (
        <div data-testid="share-dialog" data-open={String(props.open)}>
          {props.open && (
            <>
              <button
                data-testid="invite-btn"
                onClick={() => props.onInvite("test@example.com")}
              >
                Invite
              </button>
              <button
                data-testid="remove-btn"
                onClick={() => props.onRemove("collab_1")}
              >
                Remove
              </button>
            </>
          )}
        </div>
      );
    },
  };
});

vi.mock("@/components/editor/shape-panel", () => ({
  ShapePanel: () => <div data-testid="shape-panel" />,
}));

vi.mock("@/components/editor/ai-sidebar", () => ({
  AiSidebar: (props: any) => (
    <div data-testid="ai-sidebar" data-is-open={String(props.isOpen)} />
  ),
}));

vi.mock("@/components/editor/presence-avatars", () => ({
  PresenceAvatars: () => <div data-testid="presence-avatars" />,
}));

vi.mock("@/hooks/use-canvas-autosave", () => ({
  useCanvasAutosave: () => ({ saveStatus: "idle" }),
}));

import {
  WorkspaceShell,
  CanvasSaveStatusContext,
} from "@/components/editor/workspace-shell";

describe("WorkspaceShell", () => {
  const project = { id: "proj_1", name: "My Project" };
  const ownedProjects = [
    {
      id: "proj_1",
      name: "My Project",
      description: null,
      status: "active",
      createdAt: "",
      updatedAt: "",
    },
  ];
  const sharedProjects: {
    id: string;
    name: string;
    description: null;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[] = [];

  it("renders children content", () => {
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[]}
      >
        <div data-testid="workspace-content">Editor</div>
      </WorkspaceShell>,
    );
    expect(screen.getByTestId("workspace-content")).toBeInTheDocument();
    expect(screen.getByText("Editor")).toBeInTheDocument();
  });

  it("shows project name in navbar", () => {
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[]}
      >
        <div />
      </WorkspaceShell>,
    );
    expect(screen.getByText("My Project")).toBeInTheDocument();
  });

  it("has sidebar toggle button", () => {
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[]}
      >
        <div />
      </WorkspaceShell>,
    );
    expect(
      screen.getByRole("button", { name: /Open sidebar/ }),
    ).toBeInTheDocument();
  });

  it("has share button", () => {
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[]}
      >
        <div />
      </WorkspaceShell>,
    );
    expect(
      screen.getByRole("button", { name: /Share project/ }),
    ).toBeInTheDocument();
  });

  it("has AI sidebar toggle button", () => {
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[]}
      >
        <div />
      </WorkspaceShell>,
    );
    expect(
      screen.getByRole("button", { name: /Toggle AI sidebar/ }),
    ).toBeInTheDocument();
  });

  it("provides CanvasSaveStatusContext to children", () => {
    const TestConsumer = () => {
      const value = React.useContext(CanvasSaveStatusContext);
      return (
        <div data-testid="ctx-value">
          {value === null ? "null" : "function"}
        </div>
      );
    };
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[]}
      >
        <TestConsumer />
      </WorkspaceShell>,
    );
    expect(screen.getByTestId("ctx-value")).toHaveTextContent("function");
  });

  it("has back link to /editor", () => {
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[]}
      >
        <div />
      </WorkspaceShell>,
    );
    const backLink = screen.getByRole("link", { name: /Back to projects/ });
    expect(backLink).toHaveAttribute("href", "/editor");
  });

  it("toggles sidebar on button click", () => {
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[]}
      >
        <div />
      </WorkspaceShell>,
    );
    const toggleBtn = screen.getByRole("button", { name: /Open sidebar/ });
    fireEvent.click(toggleBtn);
    expect(
      screen.getByRole("button", { name: /Close sidebar/ }),
    ).toBeInTheDocument();
  });

  it("opens share dialog on share button click", () => {
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[]}
      >
        <div />
      </WorkspaceShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Share project/ }));
    const shareDialogs = screen.getAllByTestId("share-dialog");
    const openDialog = shareDialogs.find(
      (d) => d.getAttribute("data-open") === "true",
    );
    expect(openDialog).toBeDefined();
  });

  it("renders shape panel", () => {
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[]}
      >
        <div />
      </WorkspaceShell>,
    );
    expect(screen.getByTestId("shape-panel")).toBeInTheDocument();
  });

  it("renders presence avatars", () => {
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[]}
      >
        <div />
      </WorkspaceShell>,
    );
    expect(screen.getByTestId("presence-avatars")).toBeInTheDocument();
  });

  it("toggle AI sidebar", () => {
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[]}
      >
        <div />
      </WorkspaceShell>,
    );
    const aiBtn = screen.getByRole("button", { name: /Toggle AI sidebar/ });
    fireEvent.click(aiBtn);
    expect(screen.getByTestId("ai-sidebar")).toHaveAttribute(
      "data-is-open",
      "true",
    );
    fireEvent.click(aiBtn);
    expect(screen.getByTestId("ai-sidebar")).toHaveAttribute(
      "data-is-open",
      "false",
    );
  });

  it("invite handler makes POST to collaborators API", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ collaborators: [] }),
    });
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[]}
      >
        <div />
      </WorkspaceShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Share project/ }));
    fireEvent.click(screen.getByTestId("invite-btn"));
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/projects/proj_1/collaborators",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("invite handler sets error on failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Already a collaborator" }),
    });
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[]}
      >
        <div />
      </WorkspaceShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Share project/ }));
    fireEvent.click(screen.getByTestId("invite-btn"));
    await vi.waitFor(() => {
      expect(capturedShareProps.error).toBe("Already a collaborator");
    });
  });

  it("invite handler sets error on network failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[]}
      >
        <div />
      </WorkspaceShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Share project/ }));
    fireEvent.click(screen.getByTestId("invite-btn"));
    await vi.waitFor(() => {
      expect(capturedShareProps.error).toBeTruthy();
    });
  });

  it("remove handler makes DELETE to collaborators API", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ collaborators: [] }),
    });
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[{ id: "collab_1", email: "a@b.com", createdAt: "" }]}
      >
        <div />
      </WorkspaceShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Share project/ }));
    fireEvent.click(screen.getByTestId("remove-btn"));
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/projects/proj_1/collaborators",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  it("remove handler sets error on failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Not found" }),
    });
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[{ id: "collab_1", email: "a@b.com", createdAt: "" }]}
      >
        <div />
      </WorkspaceShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Share project/ }));
    fireEvent.click(screen.getByTestId("remove-btn"));
    await vi.waitFor(() => {
      expect(capturedShareProps.error).toBe("Not found");
    });
  });

  it("remove handler sets error on network failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("fail"));
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[{ id: "collab_1", email: "a@b.com", createdAt: "" }]}
      >
        <div />
      </WorkspaceShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Share project/ }));
    fireEvent.click(screen.getByTestId("remove-btn"));
    await vi.waitFor(() => {
      expect(capturedShareProps.error).toBeTruthy();
    });
  });

  it("invite handler handles non-JSON error response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error("not json");
      },
    });
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[]}
      >
        <div />
      </WorkspaceShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Share project/ }));
    fireEvent.click(screen.getByTestId("invite-btn"));
    await vi.waitFor(() => {
      expect(capturedShareProps.error).toBe("Failed to invite collaborator");
    });
  });

  it("remove handler handles non-JSON error response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error("not json");
      },
    });
    render(
      <WorkspaceShell
        project={project}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        isOwner={true}
        collaborators={[{ id: "collab_1", email: "a@b.com", createdAt: "" }]}
      >
        <div />
      </WorkspaceShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Share project/ }));
    fireEvent.click(screen.getByTestId("remove-btn"));
    await vi.waitFor(() => {
      expect(capturedShareProps.error).toBe("Failed to remove collaborator");
    });
  });
});
