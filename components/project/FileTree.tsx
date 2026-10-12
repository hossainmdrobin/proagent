"use client";

import { cn } from "@/lib/cn";
import { getFileIcon } from "./utils";
import type { ProjectFile } from "./types";

interface FileTreeProps {
  files: ProjectFile[];
  selectedFile: ProjectFile | null;
  onSelectFile: (file: ProjectFile) => void;
  className?: string;
  maxHeight?: string;
}

export function FileTree({
  files,
  selectedFile,
  onSelectFile,
  className = "",
  maxHeight = "max-h-48",
}: FileTreeProps) {
  return (
    <div className={cn("space-y-1 overflow-y-auto scrollbar-thin", maxHeight, className)}>
      {files.map((file) => (
        <button
          key={file.name}
          onClick={() => onSelectFile(file)}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors",
            selectedFile?.name === file.name
              ? "bg-accent-primary/20 text-accent-primary"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          )}
        >
          <span>{getFileIcon(file.name)}</span>
          <span className="truncate">{file.name}</span>
        </button>
      ))}
    </div>
  );
}