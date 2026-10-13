"use client";

import { cn } from "@/lib/cn";
import { ChatInterface } from "./ChatInterface";
import { FileTree } from "./FileTree";
import type { Message, ProjectFile } from "./types";

interface ProjectSidebarProps {
  isOpen: boolean;
  messages: Message[];
  onSendMessage: (content: string) => void;
  projectFiles: ProjectFile[];
  selectedFile: ProjectFile | null;
  onSelectFile: (file: ProjectFile) => void;
  projectId:string;
}

export function ProjectSidebar({
  isOpen,
  messages,
  onSendMessage,
  projectId,
  projectFiles,
  selectedFile,
  onSelectFile,
}: ProjectSidebarProps) {
  return (
    <aside className={cn(
      "glass-sidebar z-50 flex flex-col overflow-hidden",
      isOpen ? "open" : ""
    )}>
      <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
        <ChatInterface projectId={projectId} messages={messages} onSendMessage={onSendMessage} />
      </div>
      
    </aside>
  );
}