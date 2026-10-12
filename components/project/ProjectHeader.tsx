"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface ProjectHeaderProps {
  projectId: string;
  viewMode: "preview" | "code";
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onToggleViewMode: () => void;
}

export function ProjectHeader({
  projectId,
  viewMode,
  isSidebarOpen,
  onToggleSidebar,
  onToggleViewMode,
}: ProjectHeaderProps) {
  return (
    <header className="glass fixed top-0 left-0 right-0 z-40 border-b border-glass-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
        <h1 className="text-xl font-semibold gradient-text">Project Workspace</h1>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-400 hidden sm:block">Project: {projectId}</span>
        <Button variant="ghost" size="icon" onClick={onToggleViewMode}>
          {viewMode === "preview" ? (
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          ) : (
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </Button>
      </div>
    </header>
  );
}