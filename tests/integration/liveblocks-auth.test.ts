import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

vi.mock("@/lib/project-access", () => ({
  checkProjectAccess: vi.fn(),
}));

vi.mock("@/lib/liveblocks", () => ({
  getLiveblocks: vi.fn(),
  getUserCursorColor: vi.fn().mockReturnValue("#06b6d4"),
}));

import { POST } from "@/app/api/liveblocks-auth/route";
import { auth, currentUser } from "@clerk/nextjs/server";
import { checkProjectAccess } from "@/lib/project-access";
import { getLiveblocks } from "@/lib/liveblocks";

const mockAuth = vi.mocked(auth);
const mockCurrentUser = vi.mocked(currentUser);
const mockCheckProjectAccess = vi.mocked(checkProjectAccess);
const mockGetLiveblocks = vi.mocked(getLiveblocks);

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/liveblocks-auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/liveblocks-auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.LIVEBLOCKS_SECRET_KEY = "test-key";
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null } as any);
    const res = await POST(makeRequest({ roomId: "room_1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when roomId is missing", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" } as any);
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 403 when project not found", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" } as any);
    mockCheckProjectAccess.mockResolvedValue({ found: false, access: { hasAccess: false, isOwner: false, isCollaborator: false } } as any);
    const res = await POST(makeRequest({ roomId: "room_1" }));
    expect(res.status).toBe(403);
  });

  it("returns 403 when user has no access", async () => {
    mockAuth.mockResolvedValue({ userId: "user_1" } as any);
    mockCheckProjectAccess.mockResolvedValue({ found: true, access: { hasAccess: false, isOwner: false, isCollaborator: false } } as any);
    const res = await POST(makeRequest({ roomId: "room_1" }));
    expect(res.status).toBe(403);
  });

  it("creates session with user info when authenticated as owner", async () => {
    const mockIdentifyUser = vi.fn().mockResolvedValue({ status: 200, body: '{"token":"test"}' });
    const mockGetOrCreateRoom = vi.fn().mockResolvedValue({});
    mockAuth.mockResolvedValue({ userId: "user_1" } as any);
    mockCurrentUser.mockResolvedValue({
      firstName: "Jane",
      lastName: "Doe",
      username: "janedoe",
      imageUrl: "https://example.com/avatar.png",
    } as any);
    mockCheckProjectAccess.mockResolvedValue({
      found: true,
      access: { hasAccess: true, isOwner: true, isCollaborator: false },
    } as any);
    mockGetLiveblocks.mockReturnValue({ identifyUser: mockIdentifyUser, getOrCreateRoom: mockGetOrCreateRoom } as any);

    const res = await POST(makeRequest({ roomId: "room_1" }));
    expect(res.status).toBe(200);
    expect(mockIdentifyUser).toHaveBeenCalledWith(
      { userId: "user_1", groupIds: [] },
      expect.objectContaining({
        userInfo: expect.objectContaining({
          userId: "user_1",
          name: "Jane Doe",
          displayName: "Jane Doe",
          avatarUrl: "https://example.com/avatar.png",
          role: "owner",
        }),
      }),
    );
  });

  it("grants room:write to owner", async () => {
    const mockIdentifyUser = vi.fn().mockResolvedValue({ status: 200, body: "ok" });
    const mockGetOrCreateRoom = vi.fn().mockResolvedValue({});
    mockAuth.mockResolvedValue({ userId: "user_1" } as any);
    mockCurrentUser.mockResolvedValue({
      firstName: "Jane",
      lastName: "Doe",
      username: "janedoe",
      imageUrl: null,
    } as any);
    mockCheckProjectAccess.mockResolvedValue({
      found: true,
      access: { hasAccess: true, isOwner: true, isCollaborator: false },
    } as any);
    mockGetLiveblocks.mockReturnValue({ identifyUser: mockIdentifyUser, getOrCreateRoom: mockGetOrCreateRoom } as any);

    await POST(makeRequest({ roomId: "room_1" }));
    expect(mockGetOrCreateRoom).toHaveBeenCalledWith("room_1", {
      defaultAccesses: [],
      usersAccesses: { user_1: ["room:write"] },
    });
  });

  it("grants read + presence write to collaborator", async () => {
    const mockIdentifyUser = vi.fn().mockResolvedValue({ status: 200, body: "ok" });
    const mockGetOrCreateRoom = vi.fn().mockResolvedValue({});
    mockAuth.mockResolvedValue({ userId: "user_2" } as any);
    mockCurrentUser.mockResolvedValue({
      firstName: "Bob",
      lastName: "Smith",
      username: "bobsmith",
      imageUrl: null,
    } as any);
    mockCheckProjectAccess.mockResolvedValue({
      found: true,
      access: { hasAccess: true, isOwner: false, isCollaborator: true },
    } as any);
    mockGetLiveblocks.mockReturnValue({ identifyUser: mockIdentifyUser, getOrCreateRoom: mockGetOrCreateRoom } as any);

    await POST(makeRequest({ roomId: "room_1" }));
    expect(mockGetOrCreateRoom).toHaveBeenCalledWith("room_1", {
      defaultAccesses: [],
      usersAccesses: { user_2: ["room:presence:write", "room:read"] },
    });
  });
});
