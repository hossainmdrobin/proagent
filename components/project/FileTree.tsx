"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/cn";
import { getFileIcon, getFileName } from "./utils";
import type { ProjectFile } from "./types";

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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

    if (!node.isFolder && node.file) {
      return (
        <button
          key={node.path}
          onClick={() => onSelectFile(node.file!)}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors",
            selectedFile?.path === node.file.path
              ? "bg-accent-primary/20 text-accent-primary"
              : "text-zinc-400 hover:text-white hover:bg-white/5",
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span>{getFileIcon(node.path)}</span>
          <span className="truncate">{node.name}</span>
        </button>
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
    <div className={cn("space-y-0.5 overflow-y-auto scrollbar-thin", maxHeight, className)}>
      {nodes.map((node) => renderNode(node, 0))}
    </div>
  );
}