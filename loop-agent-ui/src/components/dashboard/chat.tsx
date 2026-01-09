"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AgentBadge, type Agent } from "./agent-selector";

export interface Message {
  id: string;
  type: "user" | "assistant" | "tool" | "system";
  content: string;
  toolName?: string;
  timestamp: Date;
}

interface ChatProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  sessionName?: string;
  agent?: Agent;
}

export function Chat({
  messages,
  isLoading,
  onSendMessage,
  sessionName,
  agent,
}: ChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (input.trim() && !isLoading) {
          onSendMessage(input.trim());
          setInput("");
        }
      }
    },
    [input, isLoading, onSendMessage]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">
          {sessionName || "Select a session"}
        </h2>
        <div className="flex items-center gap-2">
          {agent && <AgentBadge agent={agent} />}
          {isLoading && (
            <Badge variant="secondary" className="animate-pulse">
              Processing...
            </Badge>
          )}
        </div>
      </div>

      {/* Messages - scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p>No messages yet.</p>
              <p className="text-sm mt-2">Send a message to start the conversation.</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - fixed at bottom */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 border-t border-border">
        <div className="flex gap-2 max-w-3xl mx-auto items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            disabled={isLoading}
            rows={3}
            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.type === "user";
  const isTool = message.type === "tool";
  const isSystem = message.type === "system";

  return (
    <div
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg p-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : isTool
            ? "bg-muted border border-border font-mono text-sm"
            : isSystem
            ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-200"
            : "bg-card border border-border"
        )}
      >
        {isTool && message.toolName && (
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {message.toolName}
            </Badge>
          </div>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className="text-xs opacity-50 mt-2">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
