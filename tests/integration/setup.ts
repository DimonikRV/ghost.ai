import "dotenv/config";
import { vi } from "vitest";

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
