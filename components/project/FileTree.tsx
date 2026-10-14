"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/cn";
import { getFileIcon, getFileName } from "./utils";
import type { ProjectFile } from "./types";
import { Trash2 } from "lucide-react";

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: Map<string, TreeNode>;
  file?: ProjectFile;
}

function buildTree(files: ProjectFile[]): TreeNode[] {
  const root = new Map<string, TreeNode>();
  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;
    parts.forEach((part, i) => {
      const isLast = i === parts.length - 1;
      let node = current.get(part);
      if (!node) {
        node = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          isFolder: !isLast,
          children: new Map(),
        };
        if (isLast) {
          node.file = file;
        }
        current.set(part, node);
      }
      current = node.children;
    });
  }
  return Array.from(root.values());
}

interface FileTreeProps {
  files: ProjectFile[];
  selectedFile: ProjectFile | null;
  onSelectFile: (file: ProjectFile) => void;
  onDeleteFile: (file: ProjectFile) => void;
  className?: string;
  maxHeight?: string;
}

export function FileTree({
  files,
  selectedFile,
  onSelectFile,
  onDeleteFile,
  className = "",
  maxHeight = "max-h-48",
}: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);

  const toggleFolder = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const nodes = useMemo(() => buildTree(files), [files]);

  const renderNode = (node: TreeNode, depth: number) => {
    const isExpanded = expanded.has(node.path);
    const hasChildren = node.children.size > 0;
    const isSelected = selectedFile?.path === node.file?.path;
    const isDeleting = deleting === node.file?._id;

    if (!node.isFolder && node.file) {
      return (
        <div key={node.path}>
          <div className="relative">
            <button
              onClick={() => onSelectFile(node.file!)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors",
                isSelected
                  ? "bg-accent-primary/20 text-accent-primary"
                  : "text-zinc-400 hover:text-white hover:bg-white/5",
              )}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              <span>{getFileIcon(node.path)}</span>
              <span className="truncate">{node.name}</span>
            </button>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleting(node.file!._id);
                }}
                disabled={isDeleting}
                className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded"
                aria-label="Delete file"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={node.path}>
        <button
          onClick={() => toggleFolder(node.path)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span className="transition-transform" style={{ transform: isExpanded ? "rotate(90deg)" : "none" }}>
            ▸
          </span>
          <span>{node.name}</span>
        </button>
        {isExpanded && hasChildren && (
          <div>
            {Array.from(node.children.values())
              .sort((a, b) => {
                if (a.isFolder !== b.isFolder) return a.isFolder ? 1 : -1;
                return a.name.localeCompare(b.name);
              })
              .map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-0.5 overflow-y-auto scrollbar-thin relative", maxHeight, className)}>
      {nodes.map((node) => renderNode(node, 0))}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-sm mx-4">
            <p className="mb-4">Delete this file?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const file = files.find(f => f._id === deleting);
                  if (file) onDeleteFile(file);
                  setDeleting(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}