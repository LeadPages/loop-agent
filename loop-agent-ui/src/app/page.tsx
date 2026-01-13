"use client";

import { useState, useCallback, useEffect } from "react";
import { Sidebar, Session } from "@/components/dashboard/sidebar";
import { Chat, Message } from "@/components/dashboard/chat";
import { type Agent } from "@/components/dashboard/agent-selector";

const DEFAULT_AGENT_ID = "landing-page-generator";
const DEFAULT_MODEL_ID = "claude-sonnet-4-20250514";
const ACCESS_CODE = process.env.NEXT_PUBLIC_ACCESS_CODE || "demo2024";

export const AVAILABLE_MODELS = [
  { id: "claude-sonnet-4-20250514", name: "Sonnet", description: "Balanced" },
  { id: "claude-opus-4-5-20251101", name: "Opus", description: "Most capable" },
];

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(DEFAULT_AGENT_ID);
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_MODEL_ID);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loadingSessions, setLoadingSessions] = useState<Set<string>>(new Set()); // Per-session loading state
  const [previewFiles, setPreviewFiles] = useState<Record<string, string>>({}); // sessionId -> filename
  const [previewKey, setPreviewKey] = useState(0); // Key to force iframe reload

  // Check for existing auth on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem("lp-auth");
    if (storedAuth === ACCESS_CODE) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = useCallback(() => {
    if (accessCodeInput === ACCESS_CODE) {
      localStorage.setItem("lp-auth", accessCodeInput);
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Invalid access code");
    }
  }, [accessCodeInput]);

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

  // Fetch existing sessions on mount
  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => res.json())
      .then((data) => {
        const loadedSessions = data.map((s: Session & { createdAt: string }) => ({
          ...s,
          createdAt: new Date(s.createdAt),
        }));
        setSessions(loadedSessions);
      })
      .catch(console.error);
  }, []);

  // Fetch session details (messages, preview) when selecting a session
  useEffect(() => {
    if (!activeSessionId) return;

    // Skip if we already have messages for this session
    if (messages[activeSessionId]?.length > 0) return;

    fetch(`/api/sessions/${activeSessionId}`)
      .then((res) => res.json())
      .then((data) => {
        // Load messages
        if (data.messages && data.messages.length > 0) {
          const loadedMessages: Message[] = data.messages.map((m: {
            id: string;
            type: string;
            content: string;
            tool_name?: string;
            created_at: string;
          }) => ({
            id: m.id,
            type: m.type as Message["type"],
            content: m.content,
            toolName: m.tool_name || undefined,
            timestamp: new Date(m.created_at),
          }));
          setMessages((prev) => ({
            ...prev,
            [activeSessionId]: loadedMessages,
          }));
        }

        // Load preview file
        if (data.previewFile) {
          setPreviewFiles((prev) => ({
            ...prev,
            [activeSessionId]: data.previewFile,
          }));
        }
      })
      .catch(console.error);
  }, [activeSessionId, messages]);

  const handleReloadPreview = useCallback(() => {
    setPreviewKey((prev) => prev + 1);
  }, []);

  const handleRenameSession = useCallback(async (id: string, newName: string) => {
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) throw new Error("Failed to rename session");

      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
      );
    } catch (error) {
      console.error("Failed to rename session:", error);
    }
  }, []);

  const handleDeleteSession = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete session");

      setSessions((prev) => prev.filter((s) => s.id !== id));

      // Clear active session if it was deleted
      if (activeSessionId === id) {
        setActiveSessionId(null);
      }

      // Clean up messages and preview for deleted session
      setMessages((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      setPreviewFiles((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  }, [activeSessionId]);

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
          body: JSON.stringify({ message: content, model: selectedModelId }),
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
    [activeSessionId, selectedModelId]
  );

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="w-full max-w-sm p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Landing Page Generator</h1>
            <p className="text-muted-foreground mt-2">Enter access code to continue</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              value={accessCodeInput}
              onChange={(e) => setAccessCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Access code"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            {loginError && (
              <p className="text-sm text-red-500">{loginError}</p>
            )}
            <button
              onClick={handleLogin}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onCreateSession={handleCreateSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={setSelectedAgentId}
        models={AVAILABLE_MODELS}
        selectedModelId={selectedModelId}
        onSelectModel={setSelectedModelId}
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{activePreviewFile}</span>
                    <button
                      onClick={handleReloadPreview}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      title="Reload preview"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-white">
                  <iframe
                    key={previewKey}
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
