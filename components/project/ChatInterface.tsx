"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "./types";
import { useRunAgentMutation } from "@/store/features/projects-api";
import { useAgentStream } from "@/lib/hooks/use-agent-stream";

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
    <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Chat</h2>
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-3">
            <svg className="size-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-center">Start a conversation</p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="relative">
        <textarea
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Type a message..."
          className="h-16 flex-1 bg-transparent border-none focus-visible:outline-none border-gray-400 p-1"
          aria-label="Chat input"
        />
        <Button
          className="absolute right-1 "
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