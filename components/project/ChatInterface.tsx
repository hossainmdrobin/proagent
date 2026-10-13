"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "./types";
import { useRunAgentMutation } from "@/store/features/projects-api";
import { useAgentStream } from "@/lib/hooks/use-agent-stream";
import { ChatPanel } from "./chat-panel";

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  projectId: string
}

export function ChatInterface({ projectId, messages, onSendMessage }: ChatInterfaceProps) {
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // const [runAgent, { data, isLoading, }] = useRunAgentMutation()
  // console.log("PLEASE PUT YOUR HAND :", data);
  const { runAgentStream, events, loading, error } = useAgentStream();
  console.log(events, loading, error);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    runAgentStream(projectId, chatInput)

    onSendMessage(chatInput);
    setChatInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen relative">
      <h2 className="text-lg font-semibold h-12 bg-green-400">Chat</h2>
      <div className="flex-1 h-[calc(100vh-3rem)] overflow-y-scrol">
        <ChatPanel events={events} />
        <div ref={messagesEndRef} />
      </div>
      <div className="absolute left-0 right-0 bottom-0 h-20 bg-gradient-to-t from-green-500 to-transparent">
        <textarea
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Type a message..."
          className="h-16 w-full mt-4 pr-12 pl-2 flex-1  border-none focus-visible:outline-none border-gray-400 p-1"
          aria-label="Chat input"
        />
        <Button
          className="absolute right-1 top-7"
          variant="primary"
          size="icon"
          onClick={handleSendMessage}
          disabled={!chatInput.trim()}
          aria-label="Send message"
        >
          <svg className="size-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </Button>
      </div>
    </div>
  );
}