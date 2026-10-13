"use client";

import { useState } from "react";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import { ProjectMain } from "@/components/project/ProjectMain";
import { DEFAULT_PROJECT_FILES } from "@/components/project/utils";
import type { Message, ProjectFile, ViewMode } from "@/components/project/types";
import { useParams } from "next/navigation";

export default function ProjectPage() {
  const params = useParams();
  const { projectId } = params || "";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [projectFiles] = useState<ProjectFile[]>(DEFAULT_PROJECT_FILES);

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `I received your message: "${content}". This is a simulated AI response. In a real implementation, this would connect to your AI backend.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleSelectFile = (file: ProjectFile) => {
    setSelectedFile(file);
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "preview" ? "code" : "preview"));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background">

      <ProjectSidebar
        isOpen={isSidebarOpen}
        messages={messages}
        onSendMessage={handleSendMessage}
        projectFiles={projectFiles}
        selectedFile={selectedFile}
        onSelectFile={handleSelectFile}
        projectId={String(projectId)}
      />

      <ProjectMain
      projectId={String(projectId)}
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        projectFiles={projectFiles}
        selectedFile={selectedFile}
        onSelectFile={handleSelectFile}
      />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        >
        </div>
      )}
    </div>
  );
}