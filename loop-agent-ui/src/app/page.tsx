"use client";

import { useState, useCallback, useEffect } from "react";
import { Sidebar, Session } from "@/components/dashboard/sidebar";
import { Chat, Message } from "@/components/dashboard/chat";
import { type Agent } from "@/components/dashboard/agent-selector";

const DEFAULT_AGENT_ID = "loop-agent-safe";

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(DEFAULT_AGENT_ID);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loadingSessions, setLoadingSessions] = useState<Set<string>>(new Set()); // Per-session loading state
  const [previewFiles, setPreviewFiles] = useState<Record<string, string>>({}); // sessionId -> filename

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const activeMessages = activeSessionId ? messages[activeSessionId] || [] : [];
  const activeAgent = agents.find((a) => a.id === activeSession?.agentId);
  const activePreviewFile = activeSessionId ? previewFiles[activeSessionId] : null;
  const isActiveSessionLoading = activeSessionId ? loadingSessions.has(activeSessionId) : false;

  // Fetch agents on mount
  useEffect(() => {
    fetch("/api/agents")
      .then((res) => res.json())
      .then((data) => {
        setAgents(data);
        if (data.length > 0 && !data.find((a: Agent) => a.id === selectedAgentId)) {
          setSelectedAgentId(data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  const handleCreateSession = useCallback(async () => {
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Session ${sessions.length + 1}`,
          agentId: selectedAgentId,
        }),
      });

      if (!response.ok) throw new Error("Failed to create session");

      const newSession = await response.json();
      // Convert date string to Date object
      newSession.createdAt = new Date(newSession.createdAt);

      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages((prev) => ({ ...prev, [newSession.id]: [] }));
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  }, [sessions.length, selectedAgentId]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeSessionId) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        type: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] || []), userMessage],
      }));

      // Mark this session as loading (doesn't affect other sessions)
      setLoadingSessions((prev) => new Set(prev).add(activeSessionId));

      try {
        const response = await fetch(`/api/sessions/${activeSessionId}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === "assistant") {
                  assistantContent += parsed.content;
                  // Update assistant message in real-time
                  setMessages((prev) => {
                    const sessionMessages = prev[activeSessionId] || [];
                    const lastMessage = sessionMessages[sessionMessages.length - 1];

                    if (lastMessage?.type === "assistant") {
                      return {
                        ...prev,
                        [activeSessionId]: [
                          ...sessionMessages.slice(0, -1),
                          { ...lastMessage, content: assistantContent },
                        ],
                      };
                    } else {
                      return {
                        ...prev,
                        [activeSessionId]: [
                          ...sessionMessages,
                          {
                            id: crypto.randomUUID(),
                            type: "assistant",
                            content: assistantContent,
                            timestamp: new Date(),
                          },
                        ],
                      };
                    }
                  });
                } else if (parsed.type === "tool") {
                  setMessages((prev) => ({
                    ...prev,
                    [activeSessionId]: [
                      ...(prev[activeSessionId] || []),
                      {
                        id: crypto.randomUUID(),
                        type: "tool",
                        content: parsed.content,
                        toolName: parsed.toolName,
                        timestamp: new Date(),
                      },
                    ],
                  }));
                } else if (parsed.type === "result") {
                  // Update session stats
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === activeSessionId
                        ? {
                            ...s,
                            costUsd: parsed.costUsd || s.costUsd,
                            turns: parsed.turns || s.turns,
                            status: "idle",
                          }
                        : s
                    )
                  );
                  // Track preview file if one was generated
                  if (parsed.previewFile) {
                    setPreviewFiles((prev) => ({
                      ...prev,
                      [activeSessionId]: parsed.previewFile,
                    }));
                  }
                }
              } catch {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => ({
          ...prev,
          [activeSessionId]: [
            ...(prev[activeSessionId] || []),
            {
              id: crypto.randomUUID(),
              type: "system",
              content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
              timestamp: new Date(),
            },
          ],
        }));
      } finally {
        // Remove this session from loading set
        setLoadingSessions((prev) => {
          const next = new Set(prev);
          next.delete(activeSessionId);
          return next;
        });
      }
    },
    [activeSessionId]
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onCreateSession={handleCreateSession}
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={setSelectedAgentId}
      />
      <main className="flex-1 h-full overflow-hidden flex">
        {activeSession ? (
          <>
            {/* Chat panel - takes full width if no preview, half if there is */}
            <div className={activePreviewFile ? "w-1/2 h-full border-r border-border" : "w-full h-full"}>
              <Chat
                messages={activeMessages}
                isLoading={isActiveSessionLoading}
                onSendMessage={handleSendMessage}
                sessionName={activeSession.name}
                agent={activeAgent}
              />
            </div>
            {/* Preview panel - only shown when there's a generated file */}
            {activePreviewFile && (
              <div className="w-1/2 h-full flex flex-col">
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border">
                  <h2 className="text-lg font-semibold">Preview</h2>
                  <span className="text-sm text-muted-foreground">{activePreviewFile}</span>
                </div>
                <div className="flex-1 bg-white">
                  <iframe
                    src={`/api/sessions/${activeSessionId}/preview?file=${encodeURIComponent(activePreviewFile)}`}
                    className="w-full h-full border-0"
                    title="Landing Page Preview"
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Welcome to Loop Agent</h2>
              <p className="text-muted-foreground mb-4">
                Create a new session to start chatting with your coding agent.
              </p>
              <button
                onClick={handleCreateSession}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Session
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
