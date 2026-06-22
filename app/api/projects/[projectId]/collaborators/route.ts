import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import type { EmailAddress } from "@clerk/backend";
import { checkProjectAccess } from "@/lib/project-access";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPrimaryEmail(emailAddresses: EmailAddress[], primaryId: string | null): EmailAddress | null {
  return emailAddresses.find((ea) => ea.id === primaryId) ?? null;
}

/**
 * GET /api/projects/[projectId]/collaborators
 * List collaborators with Clerk-enriched profile data.
 * Access: owner or collaborator.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const access = await checkProjectAccess(projectId);
  if (access.found === false) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!access.access.hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const collaborators = await prisma.projectCollaborator.findMany({
    where: { projectId },
    select: { id: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Enrich with Clerk user data
  const enriched = await enrichWithClerkData(collaborators.map((c) => c.email));

  return NextResponse.json({
    isOwner: access.access.isOwner,
    collaborators: collaborators.map((c) => ({
      id: c.id,
      email: c.email,
      createdAt: c.createdAt.toISOString(),
      ...enriched[c.email],
    })),
  });
}

/**
 * POST /api/projects/[projectId]/collaborators
 * Invite a collaborator by email.
 * Access: owner only.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const email: string | undefined = body.email;

  if (!email || email.trim() === "") {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 }
    );
  }

  // Check if email matches the owner
  const ownerEmail = await getOwnerEmail(userId);
  if (ownerEmail && ownerEmail.toLowerCase() === normalizedEmail) {
    return NextResponse.json(
      { error: "Cannot invite the project owner" },
      { status: 400 }
    );
  }

  // Check if already a collaborator (explicit check, not relying on DB constraint)
  const existing = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_email: { projectId, email: normalizedEmail },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "User is already a collaborator" },
      { status: 400 }
    );
  }

  const collaborator = await prisma.projectCollaborator.create({
    data: {
      projectId,
      email: normalizedEmail,
    },
    select: { id: true, email: true, createdAt: true },
  });

  // Enrich response with Clerk data
  const enriched = await enrichWithClerkData([normalizedEmail]);

  return NextResponse.json(
    {
      id: collaborator.id,
      email: collaborator.email,
      createdAt: collaborator.createdAt.toISOString(),
      ...enriched[normalizedEmail],
    },
    { status: 201 }
  );
}

/**
 * DELETE /api/projects/[projectId]/collaborators
 * Revoke collaborator access.
 * Access: owner only.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Support deleting by collaboratorId or email
  const body = await req.json().catch(() => ({}));
  const { collaboratorId, email } = body;

  if (!collaboratorId && !email) {
    return NextResponse.json(
      { error: "collaboratorId or email is required" },
      { status: 400 }
    );
  }

  const whereClause: Record<string, unknown> = { projectId };
  if (collaboratorId) {
    whereClause.id = collaboratorId;
  } else {
    whereClause.email = email.trim().toLowerCase();
  }

  const deleted = await prisma.projectCollaborator.deleteMany({
    where: whereClause,
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Collaborator not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Collaborator removed" });
}

// ─── Helpers ───────────────────────────────────────────────────────────────

async function getCurrentUserEmail(): Promise<{ email: string | null } | null> {
  const { userId } = await auth();
  if (!userId) return null;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const primaryEmail = getPrimaryEmail(user.emailAddresses, user.primaryEmailAddressId);
    return { email: primaryEmail?.emailAddress ?? null };
  } catch {
    return { email: null };
  }
}

async function getOwnerEmail(ownerId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(ownerId);
    const primaryEmail = getPrimaryEmail(user.emailAddresses, user.primaryEmailAddressId);
    return primaryEmail?.emailAddress ?? null;
  } catch {
    return null;
  }
}

interface EnrichedData {
  displayName?: string;
  avatarUrl?: string;
}

async function enrichWithClerkData(
  emails: string[]
): Promise<Record<string, EnrichedData>> {
  if (emails.length === 0) return {};

  const result: Record<string, EnrichedData> = {};

  try {
    // Batch-fetch users by email
    const client = await clerkClient();
    const response = await client.users.getUserList({
      emailAddress: emails,
      limit: emails.length,
    });

    // Map email → user data
    for (const user of response.data) {
      const primaryEmail = getPrimaryEmail(user.emailAddresses, user.primaryEmailAddressId);
      if (!primaryEmail) continue;

      const email = primaryEmail.emailAddress.toLowerCase();
      const displayName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.lastName || user.username || undefined;

      result[email] = {
        ...(displayName && { displayName }),
        ...(user.imageUrl && { avatarUrl: user.imageUrl }),
      };
    }
  } catch {
    // If Clerk API fails, return empty enrichment (fallback to email-only)
  }

  // Ensure all emails have an entry (even if empty)
  for (const email of emails) {
    result[email.toLowerCase()] ??= {};
  }

  return result;
}
