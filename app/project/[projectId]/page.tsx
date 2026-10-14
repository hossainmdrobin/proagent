"use client";

import { useState, useCallback } from "react";
import { ProjectSidebar } from "@/components/project/ProjectSidebar";
import { ProjectMain } from "@/components/project/ProjectMain";
import type { Message, ProjectFile, ViewMode } from "@/components/project/types";
import { useParams } from "next/navigation";
import {
  useGetProjectFilesQuery,
  useCreateProjectFileMutation,
  useUpdateProjectFileMutation,
  useDeleteProjectFileMutation,
} from "@/store/features/projects-api";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save } from "lucide-react";

export default function ProjectPage() {
  const params = useParams();
  const { projectId } = params || "";
  const projectIdStr = String(projectId);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);

  const {
    data: projectFiles = [],
    isLoading,
    error,
    refetch,
  } = useGetProjectFilesQuery({ projectId: projectIdStr });

  const [createFile] = useCreateProjectFileMutation();
  const [updateFile] = useUpdateProjectFileMutation();
  const [deleteFile] = useDeleteProjectFileMutation();

  const handleSendMessage = useCallback((content: string) => {
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
  }, []);

  const handleSelectFile = useCallback((file: ProjectFile) => {
    setSelectedFile(file);
    setEditingContent(file.content);
    setIsEditing(false);
  }, []);

  const handleCreateFile = async () => {
    if (!newFilePath.trim()) return;
    try {
      await createFile({
        projectId: projectIdStr,
        path: newFilePath,
        content: "",
      }).unwrap();
      setNewFilePath("");
      setShowNewFileDialog(false);
      refetch();
    } catch (err) {
      console.error("Failed to create file:", err);
    }
  };

  const handleUpdateFile = async () => {
    if (!selectedFile) return;
    try {
      await updateFile({
        projectId: projectIdStr,
        fileId: selectedFile._id,
        path: selectedFile.path,
        content: editingContent,
      }).unwrap();
      setIsEditing(false);
      refetch();
    } catch (err) {
      console.error("Failed to update file:", err);
    }
  };

  const handleDeleteFile = async (file: ProjectFile) => {
    if (!confirm(`Delete ${file.path}?`)) return;
    try {
      await deleteFile({
        projectId: projectIdStr,
        fileId: file._id,
      }).unwrap();
      if (selectedFile?._id === file._id) {
        setSelectedFile(null);
      }
      refetch();
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  const handleNewFile = () => {
    setShowNewFileDialog(true);
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
        projectId={projectIdStr}
      />

      <ProjectMain
        projectId={projectIdStr}
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        projectFiles={projectFiles}
        selectedFile={selectedFile}
        onSelectFile={handleSelectFile}
        editingContent={editingContent}
        setEditingContent={setEditingContent}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        isLoading={isLoading}
        error={error}
        onSave={handleUpdateFile}
        onNewFile={handleNewFile}
        onDeleteFile={handleDeleteFile}
        showNewFileDialog={showNewFileDialog}
        setShowNewFileDialog={setShowNewFileDialog}
        newFilePath={newFilePath}
        setNewFilePath={setNewFilePath}
        onCreateFile={handleCreateFile}
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