"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { AiProposal } from "@/utils/ai/tools";
import { useTranslation } from "@/utils/i18n/context";
import { usePathname } from "next/navigation";
import AiAssistantSheet from "./AiAssistantSheet";

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  proposals?: AiProposal[];
}

interface AiAssistantContextType {
  isOpen: boolean;
  openAi: (initialPrompt?: string) => void;
  closeAi: () => void;
  messages: AiMessage[];
  sendMessage: (textToSend: string) => Promise<void>;
  isLoading: boolean;
  statusLabel: string | null;
  errorMessage: string | null;
  resetChat: () => void;
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  updateProposal: (messageId: string, updatedProposal: AiProposal) => void;
}

const AiAssistantContext = createContext<AiAssistantContextType | null>(null);

const STORAGE_KEY_API = "sakutrack_deepseek_key";
const STORAGE_KEY_THREAD = "sakutrack_ai_thread";

export function AiAssistantProvider({ children }: { children: ReactNode }) {
  const { t, locale } = useTranslation();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_THREAD);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [
      {
        id: "welcome",
        role: "assistant",
        content: t.aiAdvisor.welcomeMessage,
      },
    ];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY_API);
    }
    return null;
  });

  // Persist messages thread to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      try {
        // Keep last 50 messages
        localStorage.setItem(STORAGE_KEY_THREAD, JSON.stringify(messages.slice(-50)));
      } catch {}
    }
  }, [messages]);

  const setApiKey = useCallback((key: string | null) => {
    setApiKeyState(key);
    if (typeof window !== "undefined") {
      if (key && key.trim()) {
        localStorage.setItem(STORAGE_KEY_API, key.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_API);
      }
    }
  }, []);

  const resetChat = useCallback(() => {
    const welcomeMsg: AiMessage = {
      id: "welcome-" + (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "1"),
      role: "assistant",
      content: t.aiAdvisor.welcomeMessage,
    };
    setMessages([welcomeMsg]);
    setErrorMessage(null);
    setStatusLabel(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_THREAD);
    }
  }, [t.aiAdvisor.welcomeMessage]);

  const updateProposal = useCallback((messageId: string, updatedProposal: AiProposal) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.proposals) {
          return {
            ...msg,
            proposals: msg.proposals.map((p) => (p.id === updatedProposal.id ? updatedProposal : p)),
          };
        }
        return msg;
      })
    );
  }, []);

  const sendMessage = useCallback(
    async (textToSend: string) => {
      const trimmed = textToSend.trim();
      if (!trimmed || isLoading) return;

      setErrorMessage(null);
      setStatusLabel(null);

      const userMsgId = "user-" + (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
      const assistantMsgId = "assistant-" + (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + 1));

      const newMessages: AiMessage[] = [
        ...messages,
        { id: userMsgId, role: "user", content: trimmed },
      ];

      setMessages(newMessages);
      setIsLoading(true);

      // Read selected saku from cookie if present
      let selectedSakuId = "all";
      if (typeof document !== "undefined") {
        const match = document.cookie.match(/(?:^|;\s*)selected_saku=([^;]*)/);
        if (match && match[1]) selectedSakuId = decodeURIComponent(match[1]);
      }

      try {
        const response = await fetch("/api/ai/advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            apiKeyOverride: apiKey || undefined,
            language: locale,
            pageContext: {
              path: pathname,
              selectedSakuId,
            },
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          setErrorMessage(errData.message || t.aiAdvisor.networkError);
          setIsLoading(false);
          return;
        }

        // Add assistant placeholder
        setMessages((prev) => [
          ...prev,
          { id: assistantMsgId, role: "assistant", content: "", proposals: [] },
        ]);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Stream not readable");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            try {
              const event = JSON.parse(trimmedLine);

              if (event.type === "text" && event.delta) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: msg.content + event.delta }
                      : msg
                  )
                );
              } else if (event.type === "status") {
                setStatusLabel(event.label || null);
              } else if (event.type === "proposal" && event.proposal) {
                setMessages((prev) =>
                  prev.map((msg) => {
                    if (msg.id === assistantMsgId) {
                      const existing = msg.proposals || [];
                      // Prevent duplicate proposals by id
                      if (existing.some((p) => p.id === event.proposal.id)) return msg;
                      return {
                        ...msg,
                        proposals: [...existing, event.proposal],
                      };
                    }
                    return msg;
                  })
                );
              } else if (event.type === "error") {
                setErrorMessage(event.message || "Terjadi kesalahan pada AI");
              } else if (event.type === "done") {
                setStatusLabel(null);
              }
            } catch {
              // Ignore non-json frames
            }
          }
        }
      } catch (err: any) {
        setErrorMessage(err?.message || t.aiAdvisor.networkError);
      } finally {
        setIsLoading(false);
        setStatusLabel(null);
      }
    },
    [isLoading, messages, apiKey, locale, pathname, t.aiAdvisor.networkError]
  );

  const openAi = useCallback(
    (initialPrompt?: string) => {
      setIsOpen(true);
      if (initialPrompt && initialPrompt.trim()) {
        setTimeout(() => {
          sendMessage(initialPrompt.trim());
        }, 150);
      }
    },
    [sendMessage]
  );

  const closeAi = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AiAssistantContext.Provider
      value={{
        isOpen,
        openAi,
        closeAi,
        messages,
        sendMessage,
        isLoading,
        statusLabel,
        errorMessage,
        resetChat,
        apiKey,
        setApiKey,
        updateProposal,
      }}
    >
      {children}
      <AiAssistantSheet />
    </AiAssistantContext.Provider>
  );
}

export function useAiAssistant() {
  const context = useContext(AiAssistantContext);
  if (!context) {
    throw new Error("useAiAssistant must be used within an AiAssistantProvider");
  }
  return context;
}
