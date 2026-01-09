"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AgentSelector, type Agent } from "./agent-selector";

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
  agents: Agent[];
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  agents,
  selectedAgentId,
  onSelectAgent,
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
}: {
  session: Session;
  agents: Agent[];
  isActive: boolean;
  onClick: () => void;
}) {
  const statusColor: Record<string, string> = {
    active: "bg-green-500",
    idle: "bg-yellow-500",
    ended: "bg-gray-500",
    error: "bg-red-500",
  };

  const agent = agents.find((a) => a.id === session.agentId);
  const agentIcon = agent?.icon === "terminal" ? "⚡" : agent?.icon === "shield" ? "🛡️" : "🤖";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "hover:bg-sidebar-accent/50"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm truncate flex items-center gap-1">
          <span>{agentIcon}</span>
          {session.name}
        </span>
        <span
          className={cn("w-2 h-2 rounded-full", statusColor[session.status] || "bg-gray-500")}
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>${session.costUsd.toFixed(4)}</span>
        <span>·</span>
        <span>{session.turns} turns</span>
      </div>
    </button>
  );
}
