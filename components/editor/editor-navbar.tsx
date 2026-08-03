"use client"

import { PanelLeftOpen, PanelLeftClose } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

interface EditorNavbarProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  className?: string
}

export function EditorNavbar({
  sidebarOpen,
  onToggleSidebar,
  className,
}: EditorNavbarProps) {
  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 flex h-12 items-center justify-between px-3 bg-card border-b border-border",
        className
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Center section */}
      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-2">
        <UserButton />
      </div>
    </header>
  )
}
