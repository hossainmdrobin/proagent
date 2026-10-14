export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface ProjectFile {
  _id: string;
  projectId: string;
  snapshotId: string;
  path: string;
  content: string;
  sizeBytes: number;
  language?: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = "preview" | "code";

export type AgentEvent =
  | { type: "thinking" }
  | { type: "tool_call"; tool: string; args: unknown }
  | { type: "tool_result"; tool: string; result: unknown }
  | { type: "message"; content: string }
  | { type: "done" }
  | { type: "error", message: string }
  | {
    type: "process_output";
    pid: number;
    stream: "stdout" | "stderr";
    data: string;
  }
  | { type: "preview"; url: string; pid: number }

