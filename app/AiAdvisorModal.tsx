"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  KeyRound,
  Bot,
  User,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "@/utils/i18n/context";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGuest?: boolean;
}

const STORAGE_KEY = "sakutrack_deepseek_key";

export default function AiAdvisorModal({ isOpen, onClose }: AiAdvisorModalProps) {
  const { t, locale } = useTranslation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Custom API key configuration drawer
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [customApiKey, setCustomApiKey] = useState("");
  const [savedApiKey, setSavedApiKey] = useState<string | null>(null);
  const [keyToast, setKeyToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize stored API key & welcome message
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedApiKey(stored);
        setCustomApiKey(stored);
      }
    }
  }, []);

  // Set initial welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: t.aiAdvisor.welcomeMessage,
        },
      ]);
    }
  }, [isOpen, messages.length, t.aiAdvisor.welcomeMessage]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    if (typeof window === "undefined") return;
    const trimmed = customApiKey.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
      setSavedApiKey(trimmed);
      setKeyToast(t.aiAdvisor.apiKeySavedToast);
      setErrorMessage(null);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setSavedApiKey(null);
      setKeyToast(t.aiAdvisor.apiKeyRemovedToast);
    }
    setTimeout(() => setKeyToast(null), 3000);
  };

  const handleRemoveKey = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    setSavedApiKey(null);
    setCustomApiKey("");
    setKeyToast(t.aiAdvisor.apiKeyRemovedToast);
    setTimeout(() => setKeyToast(null), 3000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "assistant",
        content: t.aiAdvisor.welcomeMessage,
      },
    ]);
    setErrorMessage(null);
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    setErrorMessage(null);
    const userMsgId = "user-" + Date.now();
    const assistantMsgId = "assistant-" + Date.now();

    const newMessages: Message[] = [
      ...messages,
      { id: userMsgId, role: "user", content: trimmed },
    ];

    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          apiKeyOverride: savedApiKey || undefined,
          language: locale,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === "MISSING_API_KEY") {
          setShowKeyConfig(true);
          setErrorMessage(t.aiAdvisor.apiKeyRequiredError);
        } else {
          setErrorMessage(errorData.message || t.aiAdvisor.networkError);
        }
        setIsLoading(false);
        return;
      }

      // Add empty assistant placeholder to populate stream
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "" },
      ]);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("ReadableStream not supported by browser");
      }

      const decoder = new TextDecoder();
      let accumulatedText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.startsWith(":")) continue;

          if (trimmedLine === "data: [DONE]") {
            break;
          }

          if (trimmedLine.startsWith("data: ")) {
            const jsonStr = trimmedLine.slice(6);
            try {
              const parsed = JSON.parse(jsonStr);
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent) {
                accumulatedText += deltaContent;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: accumulatedText }
                      : msg
                  )
                );
              }
            } catch {
              // Ignore partial or non-json stream frames
            }
          }
        }
      }
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || t.aiAdvisor.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // Pre-process markdown: normalize unicode bullets and repair inline/merged tables
  const preprocessMarkdown = (content: string) => {
    let res = content.replace(/^([ \t]*)•\s+/gm, "$1- ");

    // Separate table start from preceding text if inline: "Heading: | Col 1 | Col 2 |"
    res = res.replace(/([^\n|]+:?)[ \t]+(\|(?:\s*[^|\n]+\s*\|){2,})/g, "$1\n\n$2");

    // Separate rows merged on one line with "| |"
    res = res.replace(/\|[ \t]+\|/g, "|\n|");

    return res;
  };

  const promptChips = [
    t.aiAdvisor.promptChips.budgetPacing,
    t.aiAdvisor.promptChips.whereToCut,
    t.aiAdvisor.promptChips.subscriptions,
    t.aiAdvisor.promptChips.savingsGoal,
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-advisor-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-[90vh] sm:h-[82vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 id="ai-advisor-title" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {t.aiAdvisor.modalTitle}
                </h3>
                <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                  {t.aiAdvisor.cardBadge}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                deepseek-chat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Key config toggle */}
            <button
              type="button"
              onClick={() => setShowKeyConfig((prev) => !prev)}
              aria-label={t.aiAdvisor.apiKeyModalTitle}
              title={t.aiAdvisor.apiKeyModalTitle}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                showKeyConfig || savedApiKey
                  ? "bg-teal-500/10 text-teal-600 dark:text-teal-400"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Reset chat */}
            <button
              type="button"
              onClick={handleResetChat}
              aria-label={t.aiAdvisor.resetChat}
              title={t.aiAdvisor.resetChat}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label={t.common.close}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Key Config Drawer */}
        {showKeyConfig && (
          <div className="p-3.5 bg-zinc-100/90 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-500" />
                {t.aiAdvisor.apiKeyModalTitle}
              </span>
              <button
                type="button"
                onClick={() => setShowKeyConfig(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
              {t.aiAdvisor.apiKeyHint}
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder={t.aiAdvisor.apiKeyPlaceholder}
                className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/50"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs cursor-pointer active:scale-95 transition-all"
              >
                {t.aiAdvisor.apiKeySave}
              </button>
              {savedApiKey && (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs cursor-pointer"
                >
                  {t.aiAdvisor.apiKeyRemove}
                </button>
              )}
            </div>
            {keyToast && (
              <p className="mt-1.5 text-[11px] text-teal-600 dark:text-teal-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> {keyToast}
              </p>
            )}
          </div>
        )}

        {/* Error notification banner */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border-b border-red-500/20 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Messages transcript area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-xs ${
                  msg.role === "user"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-normal rounded-tr-xs"
                    : "bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 rounded-tl-xs"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="space-y-1.5 leading-relaxed text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ children }) => (
                          <div className="my-2.5 w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white/70 dark:bg-zinc-900/70 shadow-2xs">
                            <table className="w-full text-left text-xs border-collapse">
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead className="bg-zinc-200/60 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-700">
                            {children}
                          </thead>
                        ),
                        tbody: ({ children }) => (
                          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-850">
                            {children}
                          </tbody>
                        ),
                        tr: ({ children }) => (
                          <tr className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                            {children}
                          </tr>
                        ),
                        th: ({ children }) => (
                          <th className="px-3 py-2 font-semibold text-zinc-900 dark:text-zinc-100 text-[11px] uppercase tracking-wider whitespace-nowrap">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300 text-xs whitespace-nowrap">
                            {children}
                          </td>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mt-3 mb-1.5 first:mt-0">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white mt-2.5 mb-1 first:mt-0 flex items-center gap-1">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-2 mb-0.5 first:mt-0 flex items-center gap-1">
                            {children}
                          </h3>
                        ),
                        h4: ({ children }) => (
                          <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-1.5 mb-0.5 first:mt-0">
                            {children}
                          </h4>
                        ),
                        p: ({ children }) => (
                          <p className="leading-relaxed mb-1.5 last:mb-0">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="my-1.5 ml-4 list-disc space-y-1 text-zinc-700 dark:text-zinc-300">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="my-1.5 ml-4 list-decimal space-y-1 text-zinc-700 dark:text-zinc-300">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        strong: ({ children }) => (
                          <strong className="font-bold text-zinc-950 dark:text-white">
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic text-zinc-800 dark:text-zinc-200">{children}</em>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="my-2 border-l-2 border-teal-500 pl-3 italic text-zinc-600 dark:text-zinc-400">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children }) => (
                          <code className="rounded bg-zinc-200/80 dark:bg-zinc-700 px-1 py-0.5 font-mono text-[11px] text-teal-600 dark:text-teal-400">
                            {children}
                          </code>
                        ),
                        hr: () => <hr className="my-2 border-zinc-200 dark:border-zinc-700" />,
                      }}
                    >
                      {preprocessMarkdown(msg.content)}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="rounded-2xl rounded-tl-xs px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse delay-150" />
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse delay-300" />
                <span className="ml-1 text-[11px] font-medium">{t.aiAdvisor.thinking}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Prompt Chips */}
        <div className="px-3.5 py-2 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/70 overflow-x-auto flex gap-1.5 no-scrollbar">
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => sendMessage(chip)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-teal-500/50 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(inputValue);
            }}
            className="flex items-center gap-2"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.aiAdvisor.inputPlaceholder}
              disabled={isLoading}
              className="flex-1 resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3.5 py-2 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 max-h-24 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              aria-label={t.aiAdvisor.send}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Disclaimer footer */}
          <p className="mt-2 text-[10px] text-center text-zinc-400 dark:text-zinc-500">
            {t.aiAdvisor.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
