"use client";

import { Button } from "@/components/ui/button";
import { FileTree } from "./FileTree";
import type { ProjectFile, ViewMode } from "./types";
import { useGetProjectByIdQuery, useGetProjectFilesQuery } from "@/store/features/projects-api";
import { Plus, Save, X, Trash2, File as FileIcon, Power } from "lucide-react";
import { useGetSandboxStateQuery, useStartSandboxMutation, useStopSandboxMutation } from "@/store/features/sandbox_action-api";

interface ProjectMainProps {
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectFiles: ProjectFile[];
  selectedFile: ProjectFile | null;
  onSelectFile: (file: ProjectFile) => void;
  projectId: string;
  editingContent: string;
  setEditingContent: (content: string) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  isLoading: boolean;
  error: unknown;
  onSave: () => void;
  onNewFile: () => void;
  onDeleteFile: (file: ProjectFile) => void;
  showNewFileDialog: boolean;
  setShowNewFileDialog: (show: boolean) => void;
  newFilePath: string;
  setNewFilePath: (path: string) => void;
  onCreateFile: () => void;
}

export function ProjectMain({
  projectId,
  viewMode,
  onToggleViewMode,
  isSidebarOpen,
  onToggleSidebar,
  projectFiles,
  selectedFile,
  onSelectFile,
  editingContent,
  setEditingContent,
  isEditing,
  setIsEditing,
  isLoading,
  error,
  onSave,
  onNewFile,
  onDeleteFile,
  showNewFileDialog,
  setShowNewFileDialog,
  newFilePath,
  setNewFilePath,
  onCreateFile,
}: ProjectMainProps) {
  const { data, isLoading: queryLoading } = useGetProjectFilesQuery({ projectId });
  const files = data && data.length > 0 ? data : projectFiles;
  const loading = isLoading || queryLoading;

  const { data: projectData, } = useGetProjectByIdQuery({ projectId });
  const { data: sandboxData, error: sandboxError, isLoading: sandboxLoading } = useGetSandboxStateQuery({ projectId })
  console.log("Get sandbox query", sandboxData)
  const [startPreview, { data: previewData, isLoading: previewLoading, error: previewerror }] = useStartSandboxMutation()
  const [stopPreview, { data: stopData, isLoading: stopIsLoading, error: stopError }] = useStopSandboxMutation();
  console.log("preview error", previewData, previewerror)
  return (
    <main className="glass-main">
      <div className="flex items-center justify-between mx-4 h-12">
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
        {previewData && <Button size="sm" variant="danger"><Power size={20} /> Stop Preview</Button>}
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

      <div className="flex-1 h-[calc(100vh-3.1rem)] overflow-hidden border border-glass-border bg-zinc-950/50 relative">
        {viewMode === "preview" ? (
          <div className="w-full h-full flex items-center justify-center">
            {previewData && <iframe
              src={previewData.url || ""}
              className="w-full h-full border border-zinc-800 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms"
              title="Project Preview"
            />}
            {!previewData && !previewLoading && <Button onClick={() => startPreview({ projectId })} variant="secondary"> <Power size={20} />Start Project</Button>}
            {previewLoading && <Button>Loading...</Button>}
          </div>
        ) : (
          <div className="w-full h-full flex">
            <div className="w-64 border-r border-zinc-800 bg-zinc-950 overflow-y-auto scrollbar-thin flex flex-col">
              <div className="p-2 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">FILES</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNewFile}
                  aria-label="New file"
                  className="h-7 w-7"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <FileTree
                files={files}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
                maxHeight="flex-1"
                onDeleteFile={onDeleteFile}
              />
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed flex flex-col">
              {loading ? (
                <div className="flex items-center justify-center h-full text-zinc-500">
                  Loading files...
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full text-red-500">
                  Error loading files
                </div>
              ) : selectedFile ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-400 text-xs">{selectedFile.path}</span>
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={onSave}
                            disabled={loading}
                          >
                            <Save className="size-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(false)}
                          >
                            <X className="size-3 mr-1" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteFile(selectedFile)}
                        aria-label="Delete file"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-zinc-100 resize-none font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent-primary"
                      spellCheck={false}
                    />
                  ) : (
                    <pre className="flex-1 text-zinc-200 overflow-auto">{selectedFile.content}</pre>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
                  <FileIcon className="size-12 opacity-50" />
                  <span>Select a file to view code</span>
                  <Button variant="primary" size="sm" onClick={onNewFile}>
                    <Plus className="size-3 mr-1" />
                    Create New File
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showNewFileDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New File</h3>
            <input
              type="text"
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              placeholder="path/to/file.tsx"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-primary mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowNewFileDialog(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={onCreateFile} disabled={!newFilePath.trim()}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}