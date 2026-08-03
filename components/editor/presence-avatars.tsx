"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useOthers } from "@liveblocks/react";

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function PresenceAvatars() {
  const { user } = useUser();
  const others = useOthers();

  // Filter out any presence entry whose Clerk user ID matches the current user,
  // then deduplicate by userId so a collaborator with multiple tabs/devices
  // renders as a single avatar chip.
  const collaborators = others
    .filter(
      (other) => other.info?.userId && other.info?.userId !== user?.id
    )
    .reduce<Array<(typeof others)[number]>>((acc, other) => {
      const uid = other.info.userId as string;
      if (!acc.some((entry) => (entry.info.userId as string) === uid)) {
        acc.push(other);
      }
      return acc;
    }, []);

  const maxVisible = 5;
  const visibleCollaborators = collaborators.slice(0, maxVisible);
  const overflowCount = collaborators.length - maxVisible;
  const hasCollaborators = collaborators.length > 0;

  return (
    <div className="flex items-center gap-3">
      {hasCollaborators && (
        <>
          <div className="flex items-center -space-x-2.5">
            {visibleCollaborators.map((other) => {
              const avatarUrl = other.info?.avatarUrl;
              const displayName = other.info?.displayName || "Collaborator";
              const initials = getInitials(displayName);
              const ringColor = other.info?.cursorColor || "var(--color-border)";

              return (
                <div
                  key={other.info?.userId as string}
                  className="relative inline-flex h-8 w-8 select-none items-center justify-center rounded-full bg-card text-xs font-semibold text-foreground ring-2 ring-background overflow-hidden border"
                  style={{ borderColor: ringColor }}
                  title={displayName}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] tracking-tighter">{initials}</span>
                  )}
                </div>
              );
            })}

            {overflowCount > 0 && (
              <div
                className="relative inline-flex h-8 w-8 select-none items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground ring-2 ring-background border border-border"
                title={`${overflowCount} more collaborators`}
              >
                +{overflowCount}
              </div>
            )}
          </div>

          {/* Divider visible only when collaborators exist */}
          <div className="h-5 w-px bg-border" />
        </>
      )}

      {/* Clerk User Button */}
      <div className="flex h-8 w-8 items-center justify-center">
        <UserButton />
      </div>
    </div>
  );
}
