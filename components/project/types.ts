export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface ProjectFile {
  name: string;
  content: string;
  language: string;
}

export type ViewMode = "preview" | "code";