import { vi } from "vitest";

export const clerkState = {
  userId: "user_integration_default" as string | null,
  email: "integration@example.com",
};

export const blobPut = vi.fn();
export const blobGet = vi.fn();
