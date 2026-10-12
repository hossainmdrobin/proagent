"use client";

import { cn } from "@/lib/cn";
import { formatTime } from "./utils";
import type { Message } from "./types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        message.role === "user" && "flex-row-reverse"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
          message.role === "user"
            ? "bg-accent-primary text-white"
            : message.role === "assistant"
            ? "bg-accent-secondary text-white"
            : "bg-zinc-600 text-white"
        )}
      >
        {message.role === "user" ? "U" : message.role === "assistant" ? "AI" : "S"}
      </div>
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-3",
          message.role === "user"
            ? "bg-accent-primary/20 border border-accent-primary/30 text-white"
            : "glass-border bg-glass-bg border-glass-border"
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        <span className="text-xs text-zinc-500 mt-1 block">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}