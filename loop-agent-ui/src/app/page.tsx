"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  const [previewViewport, setPreviewViewport] = useState<"mobile" | "tablet" | "desktop" | "large">("desktop");
  const [previewFullScreen, setPreviewFullScreen] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Viewport sizes for preview
  const viewportSizes = {
    mobile: { width: 375, label: "Mobile" },
    tablet: { width: 768, label: "Tablet" },
    desktop: { width: 1280, label: "Desktop" },
    large: { width: 1920, label: "Large" },
  };

  // Calculate scale to fit viewport in container
  useEffect(() => {
    const calculateScale = () => {
      if (!previewContainerRef.current) return;

      const containerWidth = previewContainerRef.current.clientWidth - 32; // subtract padding
      const viewportWidth = viewportSizes[previewViewport].width;

      if (viewportWidth <= containerWidth) {
        setPreviewScale(1);
      } else {
        setPreviewScale(containerWidth / viewportWidth);
      }
    };

    // Small delay to ensure container is rendered
    const timeoutId = setTimeout(calculateScale, 50);
    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", calculateScale);
    };
  }, [previewViewport, previewFullScreen, activeSessionId, previewFiles]);

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
              <div className={previewFullScreen
                ? "fixed inset-0 z-50 flex flex-col bg-background"
                : "w-1/2 h-full flex flex-col"
              }>
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">Preview</h2>
                    {/* Viewport toggle buttons */}
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      <button
                        onClick={() => setPreviewViewport("mobile")}
                        className={`p-1.5 rounded-md transition-colors ${previewViewport === "mobile" ? "bg-background shadow-sm" : "hover:bg-background/50"}`}
                        title="Mobile (375px)"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setPreviewViewport("tablet")}
                        className={`p-1.5 rounded-md transition-colors ${previewViewport === "tablet" ? "bg-background shadow-sm" : "hover:bg-background/50"}`}
                        title="Tablet (768px)"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setPreviewViewport("desktop")}
                        className={`p-1.5 rounded-md transition-colors ${previewViewport === "desktop" ? "bg-background shadow-sm" : "hover:bg-background/50"}`}
                        title="Desktop (1280px)"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setPreviewViewport("large")}
                        className={`p-1.5 rounded-md transition-colors ${previewViewport === "large" ? "bg-background shadow-sm" : "hover:bg-background/50"}`}
                        title="Large (1920px)"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 5h4M19 5v4" />
                        </svg>
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {viewportSizes[previewViewport].width}px
                      {previewScale < 1 && ` @ ${Math.round(previewScale * 100)}%`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <button
                      onClick={() => setPreviewFullScreen(!previewFullScreen)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      title={previewFullScreen ? "Exit full screen" : "Full screen"}
                    >
                      {previewFullScreen ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => window.open(`/p/${activeSessionId}`, "_blank")}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      title="Open in new window"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                    <a
                      href={`/api/sessions/${activeSessionId}/preview?file=${encodeURIComponent(activePreviewFile)}`}
                      download={activePreviewFile}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      title="Download HTML"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                </div>
                <div
                  ref={previewContainerRef}
                  className="flex-1 bg-neutral-800 flex items-start justify-center p-4 overflow-hidden"
                >
                  <div
                    className="bg-white shadow-2xl"
                    style={{
                      width: `${viewportSizes[previewViewport].width * previewScale}px`,
                      height: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    <iframe
                      key={previewKey}
                      src={`/api/sessions/${activeSessionId}/preview?file=${encodeURIComponent(activePreviewFile)}`}
                      style={{
                        width: `${viewportSizes[previewViewport].width}px`,
                        height: `${100 / previewScale}%`,
                        border: 'none',
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'top left',
                      }}
                      title="Landing Page Preview"
                    />
                  </div>
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
