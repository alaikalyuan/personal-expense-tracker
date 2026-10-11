"use client";

import { useState, useCallback } from "react";
import { compressImageToDataUrl } from "./imageCompress";
import { ExtractedDocument } from "./vision";
import { useAiAssistant } from "@/app/ai/AiAssistantProvider";
import { useTranslation } from "@/utils/i18n/context";

export interface UseImageExtractOptions {
  hint?: "receipt" | "split" | "any";
}

export function useImageExtract(options?: UseImageExtractOptions) {
  const { apiKey } = useAiAssistant();
  const { locale } = useTranslation();
  const [isExtracting, setIsExtracting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extract = useCallback(
    async (
      file: File | Blob,
      overrideHint?: "receipt" | "split" | "any"
    ): Promise<ExtractedDocument | null> => {
      setIsExtracting(true);
      setError(null);
      setStatusMessage(
        locale === "id" ? "Mengompres gambar..." : "Compressing image..."
      );

      try {
        // Step 1: Compress in browser
        const { dataUrl } = await compressImageToDataUrl(file, 1280, 0.8);

        // Step 2: Send to /api/ai/extract
        setStatusMessage(
          locale === "id"
            ? "Menganalisis struk & transaksi..."
            : "Analyzing receipt & transactions..."
        );

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

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json.success) {
          const errMsg =
            json.message ||
            (locale === "id"
              ? "Gagal membaca struk atau bukti transfer."
              : "Failed to read receipt or transaction proof.");
          setError(errMsg);
          return null;
        }

        return json.data as ExtractedDocument;
      } catch (err: unknown) {
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
        setStatusMessage(null);
      }
    },
    [apiKey, locale, options?.hint]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    extract,
    isExtracting,
    statusMessage,
    error,
    clearError,
  };
}
