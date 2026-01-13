"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AgentSelector, type Agent } from "./agent-selector";

export interface Model {
  id: string;
  name: string;
  description: string;
}

export interface Session {
  id: string;
  name: string;
  agentId: string;
  createdAt: Date;
  status: "active" | "idle" | "ended" | "error";
  costUsd: number;
  turns: number;
}

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onRenameSession: (id: string, newName: string) => void;
  onDeleteSession: (id: string) => void;
  agents: Agent[];
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
  models: Model[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  agents,
  selectedAgentId,
  onSelectAgent,
  models,
  selectedModelId,
  onSelectModel,
}: SidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      {/* Agent selector */}
      <div className="p-4 border-b border-border">
        <label className="text-xs text-muted-foreground mb-2 block">Agent</label>
        <AgentSelector
          agents={agents}
          selectedAgentId={selectedAgentId}
          onSelectAgent={onSelectAgent}
        />
      </div>

      {/* Model selector */}
      <div className="p-4 border-b border-border">
        <label className="text-xs text-muted-foreground mb-2 block">Model</label>
        <div className="relative">
          <select
            value={selectedModelId}
            onChange={(e) => onSelectModel(e.target.value)}
            className={cn(
              "w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "pr-8"
            )}
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.description}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Sessions header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-lg font-semibold">Sessions</h1>
        <Button size="sm" onClick={onCreateSession}>
          + New
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">
              No sessions yet. Create one to get started.
            </p>
          ) : (
            sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                agents={agents}
                isActive={session.id === activeSessionId}
                onClick={() => onSelectSession(session.id)}
                onRename={(newName) => onRenameSession(session.id, newName)}
                onDelete={() => onDeleteSession(session.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Loop Agent Dashboard
        </p>
      </div>
    </div>
  );
}

function SessionItem({
  session,
  agents,
  isActive,
  onClick,
  onRename,
  onDelete,
}: {
  session: Session;
  agents: Agent[];
  isActive: boolean;
  onClick: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(session.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== session.name) {
      onRename(trimmed);
    } else {
      setEditValue(session.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(session.name);
      setIsEditing(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${session.name}"?`)) {
      onDelete();
    }
  };

  const statusColor: Record<string, string> = {
    active: "bg-green-500",
    idle: "bg-yellow-500",
    ended: "bg-gray-500",
    error: "bg-red-500",
  };

  const agent = agents.find((a) => a.id === session.agentId);
  const agentIcon = agent?.icon === "terminal" ? "⚡" : agent?.icon === "shield" ? "🛡️" : "🤖";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group w-full text-left p-3 rounded-lg transition-colors cursor-pointer relative",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "hover:bg-sidebar-accent/50"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-sm bg-background border border-input rounded px-1 py-0.5 w-full mr-2 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        ) : (
          <span
            className="font-medium text-sm truncate flex items-center gap-1 cursor-text"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Double-click to rename"
          >
            <span>{agentIcon}</span>
            {session.name}
          </span>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 hover:text-destructive transition-opacity"
            title="Delete session"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span
            className={cn("w-2 h-2 rounded-full flex-shrink-0", statusColor[session.status] || "bg-gray-500")}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>${session.costUsd.toFixed(4)}</span>
        <span>·</span>
        <span>{session.turns} turns</span>
      </div>
    </div>
  );
}
