"use client";

import { cn } from "@/lib/utils";

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
  disabled?: boolean;
}

export function AgentSelector({
  agents,
  selectedAgentId,
  onSelectAgent,
  disabled = false,
}: AgentSelectorProps) {
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  const getIconEmoji = (icon: string) => {
    switch (icon) {
      case "terminal":
        return "⚡";
      case "shield":
        return "🛡️";
      case "sparkles":
        return "✨";
      default:
        return "🤖";
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case "red":
        return "text-red-500";
      case "green":
        return "text-green-500";
      case "blue":
        return "text-blue-500";
      case "purple":
        return "text-purple-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="relative">
      <select
        value={selectedAgentId}
        onChange={(e) => onSelectAgent(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "pr-8"
        )}
      >
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {getIconEmoji(agent.icon)} {agent.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <svg
          className="h-4 w-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

// Badge component to show agent in chat header
export function AgentBadge({ agent }: { agent: Agent }) {
  const getIconEmoji = (icon: string) => {
    switch (icon) {
      case "terminal":
        return "⚡";
      case "shield":
        return "🛡️";
      case "sparkles":
        return "✨";
      default:
        return "🤖";
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "red":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "green":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "blue":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "purple":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        getColorClasses(agent.color)
      )}
    >
      {getIconEmoji(agent.icon)} {agent.name}
    </span>
  );
}
