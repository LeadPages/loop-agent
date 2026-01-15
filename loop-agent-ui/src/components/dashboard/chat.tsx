"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AgentBadge, type Agent } from "./agent-selector";
import { ImageUploadButton, uploadFiles, ACCEPTED_TYPES, type Attachment } from "./image-upload";
import { ImagePreview, MessageAttachments } from "./image-preview";

export type { Attachment };

export interface Message {
  id: string;
  type: "user" | "assistant" | "tool" | "system";
  content: string;
  toolName?: string;
  timestamp: Date;
  attachments?: Attachment[];
}

interface ChatProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string, attachments?: Attachment[]) => void;
  sessionId: string;
  sessionName?: string;
  agent?: Agent;
}

export function Chat({
  messages,
  isLoading,
  onSendMessage,
  sessionId,
  sessionName,
  agent,
}: ChatProps) {
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (uploadError) {
      const timer = setTimeout(() => setUploadError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || pendingAttachments.length > 0) && !isLoading) {
      onSendMessage(input.trim(), pendingAttachments.length > 0 ? pendingAttachments : undefined);
      setInput("");
      setPendingAttachments([]);
    }
  };

  const handleUpload = (attachments: Attachment[]) => {
    setPendingAttachments((prev) => [...prev, ...attachments]);
  };

  // Called immediately when files are selected - shows images with analyzing state
  const handleAnalysisStart = (tempAttachments: Attachment[]) => {
    setPendingAttachments((prev) => [...prev, ...tempAttachments]);
  };

  // Called when analysis completes - updates the temp attachment with final data
  const handleAnalysisComplete = (tempId: string, finalAttachment: Attachment) => {
    setPendingAttachments((prev) =>
      prev.map((a) => (a.id === tempId ? finalAttachment : a))
    );
  };

  const handleRemoveAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Check if any images are still being analyzed
  const isAnalyzingImages = pendingAttachments.some((a) => a.isAnalyzing);

  // Handle files from drag-drop or paste
  const handleFilesUpload = useCallback(async (files: File[]) => {
    if (files.length === 0 || isLoading || isUploading) return;

    setUploadError(null);
    setIsUploading(true);

    const { attachments, error } = await uploadFiles(sessionId, files);

    if (error) {
      setUploadError(error);
    } else {
      setPendingAttachments((prev) => [...prev, ...attachments]);
    }

    setIsUploading(false);
  }, [sessionId, isLoading, isUploading]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files).filter(
      (file) => ACCEPTED_TYPES.includes(file.type)
    );
    if (files.length > 0) {
      handleFilesUpload(files);
    }
  }, [handleFilesUpload]);

  // Paste handler for clipboard images
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageFiles: File[] = [];

    for (const item of items) {
      if (item.kind === "file" && ACCEPTED_TYPES.includes(item.type)) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      handleFilesUpload(imageFiles);
    }
  }, [handleFilesUpload]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const canSend = (input.trim() || pendingAttachments.length > 0) &&
                        !isLoading &&
                        !pendingAttachments.some((a) => a.isAnalyzing);
        if (canSend) {
          onSendMessage(input.trim(), pendingAttachments.length > 0 ? pendingAttachments : undefined);
          setInput("");
          setPendingAttachments([]);
        }
      }
    },
    [input, isLoading, onSendMessage, pendingAttachments]
  );

  return (
    <div
      className="flex flex-col h-full relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag and drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 border-2 border-dashed border-primary rounded-lg">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-2 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-lg font-semibold text-primary">Drop images here</p>
            <p className="text-sm text-muted-foreground">JPEG, PNG, WebP, or GIF (max 10MB each)</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">
          {sessionName || "Select a session"}
        </h2>
        <div className="flex items-center gap-2">
          {agent && <AgentBadge agent={agent} />}
          {(isLoading || isUploading) && (
            <Badge variant="secondary" className="animate-pulse">
              {isUploading ? "Uploading..." : "Processing..."}
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
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Upload error message */}
          {uploadError && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{uploadError}</span>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="ml-auto hover:opacity-70"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {/* Pending attachments preview */}
          {pendingAttachments.length > 0 && (
            <ImagePreview
              attachments={pendingAttachments}
              onRemove={handleRemoveAttachment}
            />
          )}
          <div className="flex gap-2 items-end">
            <ImageUploadButton
              onUpload={handleUpload}
              onAnalysisStart={handleAnalysisStart}
              onAnalysisComplete={handleAnalysisComplete}
              disabled={isLoading || isUploading}
              sessionId={sessionId}
            />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Type a message... (Enter to send, Shift+Enter for new line, paste/drop images)"
              disabled={isLoading}
              rows={3}
              className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={isLoading || isUploading || isAnalyzingImages || (!input.trim() && pendingAttachments.length === 0)}
              title={isAnalyzingImages ? "Waiting for image analysis to complete..." : undefined}
            >
              {isAnalyzingImages ? "Analyzing..." : "Send"}
            </Button>
          </div>
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
        {message.content && (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
        {message.attachments && message.attachments.length > 0 && (
          <MessageAttachments
            attachments={message.attachments}
          />
        )}
        <p className="text-xs opacity-50 mt-2">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
