"use client";

import { Sparkles } from "lucide-react";
import { useAiAssistant } from "./AiAssistantProvider";
import { useTranslation } from "@/utils/i18n/context";

interface AiHeaderButtonProps {
  className?: string;
}

export default function AiHeaderButton({ className = "" }: AiHeaderButtonProps) {
  const { openAi } = useAiAssistant();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => openAi()}
      aria-label={t.aiAdvisor.cardTitle}
      title={t.aiAdvisor.cardTitle}
      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 dark:hover:bg-teal-500/30 active:scale-95 transition-all shadow-2xs cursor-pointer ${className}`}
    >
      <Sparkles className="w-4 h-4" />
      <span className="sr-only">{t.aiAdvisor.cardTitle}</span>
    </button>
  );
}
