import "dotenv/config";
import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

vi.mock("@clerk/nextjs/server", async () => {
  const { clerkState } = await import("./clerk-state");
  return {
    auth: async () => ({ userId: clerkState.userId }),
    currentUser: async () => {
      if (clerkState.userId === null) return null;
      return { primaryEmailAddress: { emailAddress: clerkState.email } };
    },
    clerkClient: async () => ({
      users: {
        getUser: async (id: string) => ({
          id,
          emailAddresses: [{ id: "idn_primary", emailAddress: clerkState.email }],
          primaryEmailAddressId: "idn_primary",
          firstName: "Test",
          lastName: "User",
          username: "testuser",
          imageUrl: null,
        }),
        getUserList: async (params: { emailAddress?: string[] }) => ({
          data: (params.emailAddress ?? []).map((email) => ({
            id: "user_test",
            emailAddresses: [{ id: "idn_primary", emailAddress: email }],
            primaryEmailAddressId: "idn_primary",
            firstName: "Test",
            lastName: "User",
            username: "testuser",
            imageUrl: null,
          })),
        }),
      },
    }),
  };
});

vi.mock("@vercel/blob", async () => {
  const { blobPut, blobGet } = await import("./clerk-state");
  return { put: blobPut, get: blobGet };
});

vi.mock("@trigger.dev/sdk", () => ({
  tasks: {
    trigger: vi.fn().mockResolvedValue({ id: "run_test" }),
  },
  auth: {
    createPublicToken: vi.fn().mockResolvedValue("tok_test"),
  },
}));

vi.mock("@liveblocks/node", () => {
  const allowSession = vi.fn().mockReturnValue({});
  const prepareSession = vi.fn().mockReturnValue({ allowSession });
  const identifyUser = vi.fn();
  return {
    Liveblocks: vi.fn().mockImplementation(() => ({
      prepareSession,
      identifyUser,
    })),
  };
});
