"use client";

import { MessageCircle } from "lucide-react";
import { useAiAssistant } from "./AiAssistantProvider";
import { useTranslation } from "@/utils/i18n/context";

interface AiHeaderButtonProps {
  className?: string;
}

/** The single entry point to the assistant: a chat bubble, because it opens a chat. */
export default function AiHeaderButton({ className = "" }: AiHeaderButtonProps) {
  const { openAi, isAiEnabled } = useAiAssistant();
  const { t } = useTranslation();

  if (!isAiEnabled) return null;

  return (
    <button
      type="button"
      onClick={() => openAi()}
      aria-label={t.aiAdvisor.cardTitle}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-ink hover:bg-paper active:bg-line ${className}`}
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
