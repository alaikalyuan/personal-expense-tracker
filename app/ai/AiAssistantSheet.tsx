"use client";

import { useState, useRef, useEffect } from "react";
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
  ChevronUp,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "@/utils/i18n/context";
import { usePathname } from "next/navigation";
import { useAiAssistant } from "./AiAssistantProvider";
import ActionProposalCard from "./ActionProposalCard";
import { preprocessAiMarkdown } from "@/utils/ai/markdown";
import { useImageExtract } from "@/utils/ai/useImageExtract";

export default function AiAssistantSheet() {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const {
    isOpen,
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
    isAiEnabled,
  } = useAiAssistant();

  const [inputValue, setInputValue] = useState("");
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey || "");
  const [keyToast, setKeyToast] = useState<string | null>(null);

  // Vision Image Attachment State
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);
  const [imageExtractError, setImageExtractError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { extract, isExtracting, statusMessage: extractStatus } = useImageExtract();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setKeyInput(apiKey || "");
  }, [apiKey]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen, statusLabel, isExtracting, extractStatus]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeAi();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeAi]);

  if (!isOpen || !isAiEnabled) return null;

  const handleSaveKey = () => {
    const trimmed = keyInput.trim();
    setApiKey(trimmed || null);
    setKeyToast(trimmed ? t.aiAdvisor.apiKeySavedToast : t.aiAdvisor.apiKeyRemovedToast);
    setTimeout(() => setKeyToast(null), 3000);
  };

  const handleRemoveKey = () => {
    setKeyInput("");
    setApiKey(null);
    setKeyToast(t.aiAdvisor.apiKeyRemovedToast);
    setTimeout(() => setKeyToast(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageExtractError(locale === "id" ? "File harus berupa gambar." : "File must be an image.");
      return;
    }

    setImageExtractError(null);
    setAttachedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAttachedPreview(objectUrl);
    // Reset file input value so user can reselect same file if needed
    e.target.value = "";
  };

  const removeAttachment = () => {
    if (attachedPreview) {
      URL.revokeObjectURL(attachedPreview);
    }
    setAttachedFile(null);
    setAttachedPreview(null);
    setImageExtractError(null);
  };

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if ((!trimmed && !attachedFile) || isLoading || isExtracting) return;

    setImageExtractError(null);

    if (attachedFile) {
      // Step 1: Extract receipt/image
      const extracted = await extract(attachedFile, "receipt");
      if (!extracted) {
        setImageExtractError(
          locale === "id"
            ? "Gagal membaca gambar/struk. Silakan coba lagi atau unggah foto yang lebih jelas."
            : "Failed to read the image/receipt. Please try again with a clearer photo."
        );
        return;
      }

      // Step 2: Format prompt with extracted data
      let detailsSummary = "";
      if (extracted.merchant) detailsSummary += `Merchant/Toko: ${extracted.merchant}\n`;
      if (extracted.date) detailsSummary += `Tanggal: ${extracted.date}\n`;
      if (extracted.total) detailsSummary += `Total: Rp ${extracted.total.toLocaleString()}\n`;
      if (extracted.items.length > 0) {
        detailsSummary += `Item:\n` + extracted.items.map((it) => `- ${it.name} (${it.quantity}x @ Rp ${it.unitPrice.toLocaleString()})`).join("\n") + "\n";
      }
      if (extracted.transactions.length > 0) {
        detailsSummary += `Transaksi: ` + extracted.transactions.map((tx) => `${tx.name} (Rp ${tx.amount.toLocaleString()})`).join(", ") + "\n";
      }

      const userNote = trimmed
        ? trimmed
        : locale === "id"
        ? "Tolong catat pengeluaran dari struk/bukti ini."
        : "Please log the expense from this receipt/proof.";

      const finalMessage = `${userNote}\n\n[Data Struk Terlampir]\n${detailsSummary.trim()}`;

      removeAttachment();
      setInputValue("");
      sendMessage(finalMessage);
    } else {
      sendMessage(trimmed);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Contextual page chips
  const getContextChips = () => {
    if (pathname.startsWith("/savings")) {
      return locale === "id"
        ? [
            "Kapan target tabungan tercapai?",
            "Berapa surplus yang bisa disapu ke tabungan?",
            "Buat target tabungan baru Dana Darurat 5jt",
          ]
        : [
            "When will my savings goals be reached?",
            "How much surplus can I sweep to savings?",
            "Create Emergency Fund goal of 5M",
          ];
    }
    if (pathname.startsWith("/compare")) {
      return locale === "id"
        ? [
            "Kenapa pengeluaran bulan ini berbeda dari bulan lalu?",
            "Kategori apa yang paling boros dibanding lalu?",
            "Bagaimana tren rata-rata belanja harianku?",
          ]
        : [
            "Why is this month's spending different?",
            "Which category surged compared to last month?",
            "How is my daily spend trend pacing?",
          ];
    }
    if (pathname.startsWith("/saku")) {
      return locale === "id"
        ? [
            "Bagaimana distribusi saldo antar saku?",
            "Ubah budget mingguan saku utama jadi 400rb",
            "Saran alokasi dana antar saku",
          ]
        : [
            "How is balance distributed across wallets?",
            "Change primary weekly budget to 400k",
            "Suggestions for wallet allocations",
          ];
    }
    return [
      t.aiAdvisor.promptChips.budgetPacing,
      t.aiAdvisor.promptChips.whereToCut,
      "Catat makan siang 35rb dan bensin 20rb",
      t.aiAdvisor.promptChips.savingsGoal,
    ];
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-assistant-title"
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
                <h3 id="ai-assistant-title" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
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
                showKeyConfig || apiKey
                  ? "bg-teal-500/10 text-teal-600 dark:text-teal-400"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Reset chat */}
            <button
              type="button"
              onClick={resetChat}
              aria-label={t.aiAdvisor.resetChat}
              title={t.aiAdvisor.resetChat}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={closeAi}
              aria-label={t.common.close}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Key Config Drawer */}
        {showKeyConfig && (
          <div className="p-3.5 bg-zinc-100/90 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 text-xs animate-fade-in">
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
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
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
              {apiKey && (
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
                      }}
                    >
                      {preprocessAiMarkdown(msg.content)}
                    </ReactMarkdown>

                    {/* Interactive Action Proposal Cards */}
                    {msg.proposals && msg.proposals.length > 0 && (
                      <div className="mt-2.5 space-y-2">
                        {msg.proposals.map((prop) => (
                          <ActionProposalCard
                            key={prop.id}
                            proposal={prop}
                            onUpdateProposal={(updated) => updateProposal(msg.id, updated)}
                          />
                        ))}
                      </div>
                    )}
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

          {/* Tool status or loading indicator */}
          {(isLoading || isExtracting) && (
            <div className="flex gap-2.5 justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="rounded-2xl rounded-tl-xs px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <Loader2 className="w-3.5 h-3.5 text-teal-500 animate-spin" />
                <span className="text-[11px] font-medium">
                  {extractStatus || statusLabel || t.aiAdvisor.thinking}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Prompt Chips */}
        <div className="px-3.5 py-2 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/70 overflow-x-auto flex gap-1.5 no-scrollbar">
          {getContextChips().map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading || isExtracting}
              onClick={() => sendMessage(chip)}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-teal-500/50 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          {/* Image error banner */}
          {imageExtractError && (
            <div className="mb-2 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30 p-2 text-[11px] text-rose-600 dark:text-rose-400">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{imageExtractError}</span>
              </div>
              <button
                type="button"
                onClick={() => setImageExtractError(null)}
                className="text-rose-400 hover:text-rose-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Attached image preview thumbnail */}
          {attachedPreview && (
            <div className="mb-2 flex items-center gap-2 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 w-fit">
              <img
                src={attachedPreview}
                alt="Receipt preview"
                className="w-12 h-12 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700"
              />
              <div className="pr-2">
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 block truncate max-w-[140px]">
                  {attachedFile?.name || "Foto Struk"}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {attachedFile ? `${Math.round(attachedFile.size / 1024)} KB` : "Gambar"}
                </span>
              </div>
              <button
                type="button"
                onClick={removeAttachment}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                title="Hapus gambar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Attach image button */}
            <button
              type="button"
              disabled={isLoading || isExtracting}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Unggah foto struk atau bukti transfer"
              title={locale === "id" ? "Unggah foto struk / bukti transfer" : "Upload receipt or payment proof"}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                attachedFile
                  ? "border-teal-500 bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              } disabled:opacity-40 disabled:cursor-not-allowed active:scale-95`}
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                attachedFile
                  ? locale === "id"
                    ? "Tulis catatan tambahan atau langsung kirim..."
                    : "Add optional note or press send..."
                  : t.aiAdvisor.inputPlaceholder
              }
              disabled={isLoading || isExtracting}
              className="flex-1 resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3.5 py-2 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 max-h-24 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={(!inputValue.trim() && !attachedFile) || isLoading || isExtracting}
              aria-label={t.aiAdvisor.send}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
            >
              {isExtracting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
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
