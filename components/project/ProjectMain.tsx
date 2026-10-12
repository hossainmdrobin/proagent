"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { FileTree } from "./FileTree";
import { getPreviewHTML } from "./utils";
import type { ProjectFile, ViewMode } from "./types";

interface ProjectMainProps {
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectFiles: ProjectFile[];
  selectedFile: ProjectFile | null;
  onSelectFile: (file: ProjectFile) => void;
}

export function ProjectMain({
  viewMode,
  onToggleViewMode,
  isSidebarOpen,
  onToggleSidebar,
  projectFiles,
  selectedFile,
  onSelectFile,
}: ProjectMainProps) {
  return (
    // /*[calc(100vh-5.5rem)]*/
    <main className="glass-main">
      <div className="min-h-screen flex flex-col">   
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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
            <h2 className="text-lg font-semibold">UI Preview</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "preview" ? "primary" : "ghost"}
              size="sm"
              onClick={() => onToggleViewMode()}
            >
              Preview
            </Button>
            <Button
              variant={viewMode === "code" ? "primary" : "ghost"}
              size="sm"
              onClick={() => onToggleViewMode()}
            >
              Code
            </Button>
          </div>
        </div>

        <div className="flex-1 h-[calc(100vh-5.5rem)] overflow-hidden border border-glass-border bg-zinc-950/50 relative">
          {viewMode === "preview" ? (
            <div className="w-full h-full flex items-center justify-center">
              <iframe
                srcDoc={getPreviewHTML()}
                className="w-full h-full border border-zinc-800 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms"
                title="Project Preview"
              />
            </div>
          ) : (
            <div className="w-full h-full flex">
              <div className="w-64 border-r border-zinc-800 bg-zinc-950 overflow-y-auto scrollbar-thin">
                <FileTree
                  files={projectFiles}
                  selectedFile={selectedFile}
                  onSelectFile={onSelectFile}
                  maxHeight="h-full"
                />
              </div>
              <div className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed">
                {selectedFile ? (
                  <pre className="text-zinc-200">{selectedFile.content}</pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-500">
                    Select a file to view code
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}