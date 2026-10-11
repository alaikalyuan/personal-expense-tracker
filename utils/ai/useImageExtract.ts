"use client";

import { useState, useCallback } from "react";
import { compressImageToDataUrl } from "./imageCompress";
import { ExtractedDocument } from "./vision";
import { useAiAssistant } from "@/app/ai/AiAssistantProvider";
import { useTranslation } from "@/utils/i18n/context";

export interface UseImageExtractOptions {
  hint?: "receipt" | "split" | "any";
}

export type ExtractStep = "idle" | "compressing" | "uploading" | "extracting" | "completed" | "error";

export function useImageExtract(options?: UseImageExtractOptions) {
  const { apiKey, refreshUsage } = useAiAssistant();
  const { locale } = useTranslation();
  const [isExtracting, setIsExtracting] = useState(false);
  const [step, setStep] = useState<ExtractStep>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setIsExtracting(false);
    setStep("idle");
    setStatusMessage(null);
    setError(null);
  }, []);

  const extract = useCallback(
    async (
      file: File | Blob | string,
      overrideHint?: "receipt" | "split" | "any"
    ): Promise<ExtractedDocument | null> => {
      setIsExtracting(true);
      setError(null);
      setStep("compressing");
      setStatusMessage(
        locale === "id" ? "Mengompres & menyiapkan gambar..." : "Compressing & preparing image..."
      );

      let stepTimer: NodeJS.Timeout | null = null;

      try {
        // Step 1: Compress in browser
        const { dataUrl } = await compressImageToDataUrl(file, 1280, 0.8);

        // Step 2: Uploading & Extracting
        setStep("uploading");
        setStatusMessage(
          locale === "id" ? "Mengunggah gambar ke AI..." : "Uploading image to AI..."
        );

        // After upload is dispatched, transition status to extracting
        stepTimer = setTimeout(() => {
          setStep("extracting");
          setStatusMessage(
            locale === "id"
              ? "Menganalisis struk & transaksi..."
              : "Analyzing receipt & transactions..."
          );
        }, 700);

        const res = await fetch("/api/ai/extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: dataUrl,
            hint: overrideHint || options?.hint || "any",
            apiKeyOverride: apiKey || undefined,
            language: locale,
          }),
        });

        if (stepTimer) clearTimeout(stepTimer);

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json.success) {
          setStep("error");
          const errMsg =
            json.message ||
            (locale === "id"
              ? "Gagal membaca struk atau bukti transfer."
              : "Failed to read receipt or transaction proof.");
          setError(errMsg);
          return null;
        }

        if (refreshUsage) {
          refreshUsage().catch(() => {});
        }

        setStep("completed");
        return json.data as ExtractedDocument;
      } catch (err: unknown) {
        if (stepTimer) clearTimeout(stepTimer);
        setStep("error");
        const msg =
          err instanceof Error
            ? err.message
            : locale === "id"
            ? "Terjadi kesalahan saat memproses gambar."
            : "An error occurred while processing the image.";
        setError(msg);
        return null;
      } finally {
        setIsExtracting(false);
      }
    },
    [apiKey, locale, options?.hint, refreshUsage]
  );

  const clearError = useCallback(() => {
    setError(null);
    setStep("idle");
  }, []);

  return {
    extract,
    isExtracting,
    step,
    statusMessage,
    error,
    clearError,
    resetState,
  };
}
