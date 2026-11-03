"use client";

import { cn } from "@/lib/cn";
import { ChatInterface } from "./ChatInterface";
import { FileTree } from "./FileTree";
import type { Message, ProjectFile } from "./types";
import { BeforeChat } from "./BeforeChat";

interface ProjectSidebarProps {
  isOpen: boolean;
  messages: Message[];
  onSendMessage: (content: string) => void;
  projectFiles: ProjectFile[];
  selectedFile: ProjectFile | null;
  onSelectFile: (file: ProjectFile) => void;
  projectId: string;
  chatId: string | null,
  setChatId: (chatId: string) => void;
}

export function ProjectSidebar({
  isOpen,
  messages,
  onSendMessage,
  projectId,
  chatId,
  setChatId,
  projectFiles,
  selectedFile,
  onSelectFile,
}: ProjectSidebarProps) {


  return (
    <aside className={cn(
      "glass-sidebar z-50 fixed w-1/4 h-screen",
      isOpen ? "open" : ""
    )}>
      {!chatId && <BeforeChat setChatId={setChatId} projectId={projectId} />}
      {chatId && <ChatInterface chatId={chatId} setChatId={setChatId} projectId={projectId} messages={messages} onSendMessage={onSendMessage} />}
    </aside>
  );
}