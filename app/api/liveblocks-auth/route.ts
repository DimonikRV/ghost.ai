import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkProjectAccess } from "@/lib/project-access";
import { getLiveblocks, getUserCursorColor } from "@/lib/liveblocks";

export async function POST(req: Request) {
  if (!process.env.LIVEBLOCKS_SECRET_KEY) {
    return new NextResponse("LIVEBLOCKS_SECRET_KEY is not configured", { status: 500 });
  }

  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const json = await req.json();
  const roomId: string | undefined = json?.roomId;

  if (!roomId) {
    console.error("[liveblocks-auth] Missing roomId in request body");
    return new NextResponse("Missing roomId", { status: 400 });
  }

  const access = await checkProjectAccess(roomId);
  if (access.found === false) {
    return new NextResponse("Project not found", { status: 403 });
  }
  if (!access.access.hasAccess) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const user = await currentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const displayName =
    (user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.lastName || user.username || "") || "Unknown";

  const avatarUrl = user.imageUrl ?? "";

  const role = access.access.isOwner
    ? ("owner" as const)
    : access.access.isCollaborator
      ? ("member" as const)
      : ("guest" as const);

  const cursorColor = getUserCursorColor(userId);

  const liveblocksClient = getLiveblocks();

  // Create room with explicit permissions (idempotent — safe on every call).
  // Owner gets full write; collaborators get presence write + storage read.
  if (access.access.isOwner) {
    await liveblocksClient.getOrCreateRoom(roomId, {
      defaultAccesses: [],
      usersAccesses: { [userId]: ["room:write"] },
    });
  } else {
    await liveblocksClient.getOrCreateRoom(roomId, {
      defaultAccesses: [],
      usersAccesses: { [userId]: ["room:presence:write", "room:read"] },
    });
  }

  // Identify the user with ID tokens (recommended over access tokens).
  const { status, body } = await liveblocksClient.identifyUser(
    { userId, groupIds: [] },
    {
      userInfo: {
        userId,
        displayName,
        avatarUrl,
        role,
        cursorColor,
      },
    },
  );

  return new NextResponse(body, { status });
}
