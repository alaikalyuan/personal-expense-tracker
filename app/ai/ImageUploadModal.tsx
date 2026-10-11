"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Upload,
  Camera,
  Image as ImageIcon,
  Crop as CropIcon,
  RotateCw,
  RotateCcw,
  Pencil,
  Undo2,
  RotateCcw as ResetIcon,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  Receipt,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { useImageExtract, ExtractStep } from "@/utils/ai/useImageExtract";
import { ExtractedDocument } from "@/utils/ai/vision";

export interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: "expense" | "split";
  onApply: (doc: ExtractedDocument, imageDataUrl?: string) => void;
}

type ModalStep = "upload" | "edit" | "processing" | "detected";
type EditTool = "crop" | "annotate" | "none";

interface CropRect {
  x: number; // in percentage 0..100
  y: number;
  width: number;
  height: number;
}

interface Stroke {
  color: string;
  size: number;
  points: { x: number; y: number }[];
}

export function ImageUploadModal({
  isOpen,
  onClose,
  context,
  onApply,
}: ImageUploadModalProps) {
  const { locale, formatCurrency } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { extract, isExtracting, step: extractStep, error: extractError, clearError, resetState } = useImageExtract({
    hint: context === "split" ? "split" : "receipt",
  });

  // Flow step
  const [modalStep, setModalStep] = useState<ModalStep>("upload");

  // Raw and edited image state
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);
  const [activeTool, setActiveTool] = useState<EditTool>("crop");

  // Cropping state (relative percentages: 0 to 100)
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, width: 100, height: 100 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initialCrop: CropRect } | null>(null);

  // Annotating state
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [strokeColor, setStrokeColor] = useState<string>("#ef4444"); // Default red pen
  const strokeWidth = 3;

  // Render & Processing state
  const [processedImageDataUrl, setProcessedImageDataUrl] = useState<string | null>(null);
  const [extractedDoc, setExtractedDoc] = useState<ExtractedDocument | null>(null);

  // DOM Elements
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotateCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Natural image dimensions
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  // Computed preview stage dimensions constrained inside viewport
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Modal Title based on context
  const modalTitle =
    context === "split"
      ? locale === "id"
        ? "Upload Foto - Split Bill"
        : "Upload Picture - Split Bill"
      : locale === "id"
      ? "Upload Foto - Catat Pengeluaran"
      : "Upload Picture - Logging Expenses";

  // Reset all modal internal states on open or close
  useEffect(() => {
    if (isOpen) {
      setModalStep("upload");
      setOriginalImageSrc(null);
      setRotationDegrees(0);
      setCrop({ x: 0, y: 0, width: 100, height: 100 });
      setStrokes([]);
      setCurrentStroke(null);
      setProcessedImageDataUrl(null);
      setExtractedDoc(null);
      setActiveTool("crop");
      setNaturalSize(null);
      setStageSize({ width: 0, height: 0 });
      resetState();
    }
  }, [isOpen, resetState]);

  // Global paste handler to support Ctrl+V anywhere while modal is open in upload step
  useEffect(() => {
    if (!isOpen || modalStep !== "upload") return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            loadFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, modalStep]);

  // Load a file into memory
  const loadFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setOriginalImageSrc(result);
        setRotationDegrees(0);
        setCrop({ x: 0, y: 0, width: 100, height: 100 });
        setStrokes([]);
        setActiveTool("crop");
        setModalStep("edit");

        const img = new Image();
        img.onload = () => {
          setNaturalSize({ width: img.width, height: img.height });
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadFile(file);
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      loadFile(file);
    }
  };

  // Dynamically calculate responsive stage dimensions to fit tall or wide images inside preview frame
  const updateStageSize = useCallback(() => {
    if (!naturalSize || !viewportRef.current) return;
    const vp = viewportRef.current;
    const vw = vp.clientWidth;
    const vh = vp.clientHeight;
    if (!vw || !vh) return;

    const is90or270 = rotationDegrees % 180 !== 0;
    const targetWidth = is90or270 ? naturalSize.height : naturalSize.width;
    const targetHeight = is90or270 ? naturalSize.width : naturalSize.height;

    // Leave a 24px margin so handles and borders fit cleanly inside the viewport
    const padding = 24;
    const availW = Math.max(60, vw - padding);
    const availH = Math.max(60, vh - padding);

    const scale = Math.min(availW / targetWidth, availH / targetHeight);
    const displayW = Math.max(1, Math.round(targetWidth * scale));
    const displayH = Math.max(1, Math.round(targetHeight * scale));

    setStageSize({ width: displayW, height: displayH });
  }, [naturalSize, rotationDegrees]);

  useEffect(() => {
    if (modalStep !== "edit") return;
    updateStageSize();
    const id = requestAnimationFrame(() => {
      updateStageSize();
    });
    if (!viewportRef.current) return () => cancelAnimationFrame(id);

    const ro = new ResizeObserver(() => {
      updateStageSize();
    });
    ro.observe(viewportRef.current);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [updateStageSize, modalStep]);

  // Image Editor: Renders base rotated image onto canvas
  useEffect(() => {
    if (modalStep !== "edit" || !originalImageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      if (!naturalSize) {
        setNaturalSize({ width: img.width, height: img.height });
      }

      const is90or270 = rotationDegrees % 180 !== 0;
      canvas.width = is90or270 ? img.height : img.width;
      canvas.height = is90or270 ? img.width : img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotationDegrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    };
    img.src = originalImageSrc;
  }, [modalStep, originalImageSrc, rotationDegrees, naturalSize]);

  // Image Editor: Renders annotations onto overlay canvas
  useEffect(() => {
    if (modalStep !== "edit" || !annotateCanvasRef.current || !canvasRef.current) return;
    const canvas = annotateCanvasRef.current;
    const baseCanvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = baseCanvas.width || 1;
    canvas.height = baseCanvas.height || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render completed strokes
    strokes.forEach((s) => {
      if (s.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.moveTo(s.points[0].x * canvas.width, s.points[0].y * canvas.height);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x * canvas.width, s.points[i].y * canvas.height);
      }
      ctx.stroke();
    });

    // Render active drawing stroke
    if (currentStroke && currentStroke.points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = currentStroke.color;
      ctx.lineWidth = currentStroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.moveTo(currentStroke.points[0].x * canvas.width, currentStroke.points[0].y * canvas.height);
      for (let i = 1; i < currentStroke.points.length; i++) {
        ctx.lineTo(currentStroke.points[i].x * canvas.width, currentStroke.points[i].y * canvas.height);
      }
      ctx.stroke();
    }
  }, [modalStep, strokes, currentStroke, rotationDegrees]);

  // Annotation Drawing Handlers
  const handleAnnotatePointerDown = (e: React.PointerEvent) => {
    if (activeTool !== "annotate" || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Scale stroke size relative to natural dimensions
    const is90or270 = rotationDegrees % 180 !== 0;
    const targetW = naturalSize ? (is90or270 ? naturalSize.height : naturalSize.width) : 800;
    const scaledSize = Math.max(3, Math.round(strokeWidth * (targetW / Math.max(1, rect.width))));

    setCurrentStroke({
      color: strokeColor,
      size: scaledSize,
      points: [{ x, y }],
    });
  };

  const handleAnnotatePointerMove = (e: React.PointerEvent) => {
    if (!currentStroke || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, { x, y }] } : null));
  };

  const handleAnnotatePointerUp = () => {
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  };

  // Crop Dragging Handlers
  const handleCropPointerDown = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    setIsDraggingCrop(true);
    setDragHandle(handle);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initialCrop: { ...crop },
    };
  };

  const handleCropPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingCrop || !dragStartRef.current || !containerRef.current) return;
    const { clientX: startX, clientY: startY, initialCrop } = dragStartRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dxPercent = ((e.clientX - startX) / rect.width) * 100;
    const dyPercent = ((e.clientY - startY) / rect.height) * 100;

    let { x, y, width, height } = initialCrop;

    if (dragHandle === "move") {
      x = Math.max(0, Math.min(100 - width, initialCrop.x + dxPercent));
      y = Math.max(0, Math.min(100 - height, initialCrop.y + dyPercent));
    } else {
      if (dragHandle?.includes("l")) {
        const newX = Math.max(0, Math.min(initialCrop.x + initialCrop.width - 5, initialCrop.x + dxPercent));
        width = initialCrop.width - (newX - initialCrop.x);
        x = newX;
      }
      if (dragHandle?.includes("r")) {
        width = Math.max(5, Math.min(100 - initialCrop.x, initialCrop.width + dxPercent));
      }
      if (dragHandle?.includes("t")) {
        const newY = Math.max(0, Math.min(initialCrop.y + initialCrop.height - 5, initialCrop.y + dyPercent));
        height = initialCrop.height - (newY - initialCrop.y);
        y = newY;
      }
      if (dragHandle?.includes("b")) {
        height = Math.max(5, Math.min(100 - initialCrop.y, initialCrop.height + dyPercent));
      }
    }

    setCrop({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      width: Math.round(width * 10) / 10,
      height: Math.round(height * 10) / 10,
    });
  };

  const handleCropPointerUp = () => {
    setIsDraggingCrop(false);
    setDragHandle(null);
    dragStartRef.current = null;
  };

  // Rotation Handlers (90 deg CW and CCW)
  const handleRotateCw = () => {
    setRotationDegrees((prev) => (prev + 90) % 360);
    // Reset crop & annotations on rotate to maintain coordinates
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
    setStrokes([]);
  };

  const handleRotateCcw = () => {
    setRotationDegrees((prev) => (prev - 90 + 360) % 360);
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
    setStrokes([]);
  };

  // Select entire image / Fit Crop
  const handleSelectAllCrop = () => {
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
  };

  // Reset all edits back to fresh state
  const handleResetEdit = () => {
    setRotationDegrees(0);
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
    setStrokes([]);
  };

  // Generate cropped + annotated image and send to AI vision extraction
  const handleProceedToExtract = async () => {
    if (!canvasRef.current || !annotateCanvasRef.current) return;
    const baseCanvas = canvasRef.current;
    const annCanvas = annotateCanvasRef.current;

    // Create an offscreen export canvas
    const exportCanvas = document.createElement("canvas");
    const exportCtx = exportCanvas.getContext("2d");
    if (!exportCtx) return;

    // Crop pixel rectangle in canvas coordinates
    const cropX = Math.round((crop.x / 100) * baseCanvas.width);
    const cropY = Math.round((crop.y / 100) * baseCanvas.height);
    const cropW = Math.max(1, Math.round((crop.width / 100) * baseCanvas.width));
    const cropH = Math.max(1, Math.round((crop.height / 100) * baseCanvas.height));

    exportCanvas.width = cropW;
    exportCanvas.height = cropH;

    // 1. Draw cropped rotated image
    exportCtx.drawImage(baseCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    // 2. Overlay annotations
    exportCtx.drawImage(annCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    const exportDataUrl = exportCanvas.toDataURL("image/jpeg", 0.92);
    setProcessedImageDataUrl(exportDataUrl);
    setModalStep("processing");

    const doc = await extract(exportDataUrl);
    if (doc) {
      setExtractedDoc(doc);
      setModalStep("detected");
    }
  };

  // Retry extraction from processing error
  const handleRetryExtract = async () => {
    if (!processedImageDataUrl) return;
    clearError();
    const doc = await extract(processedImageDataUrl);
    if (doc) {
      setExtractedDoc(doc);
      setModalStep("detected");
    }
  };

  // Apply results to caller form
  const handleApply = () => {
    if (!extractedDoc) return;
    onApply(extractedDoc, processedImageDataUrl || undefined);
    onClose();
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-xs animate-fade-in">
      <div
        className={`relative flex flex-col w-full max-w-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden transition-all ${
          modalStep === "edit"
            ? "h-[90vh] sm:h-[86vh] max-h-[780px]"
            : "max-h-[92vh]"
        }`}
      >
        {/* Pinned Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 px-4 py-3 sm:px-5 shrink-0 bg-zinc-50/80 dark:bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {modalTitle}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExtracting}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= STEP 2: INTERACTIVE EDITOR (ZERO-SCROLL PINNED VIEW) ================= */}
        {modalStep === "edit" && originalImageSrc ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-fade-in">
            {/* Pinned Tool Selector Bar */}
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 bg-zinc-100/90 dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 px-3.5 sm:px-4 py-2 text-xs">
              <div className="flex items-center gap-2">
                {/* Segmented Tool Switcher */}
                <div className="flex items-center rounded-xl bg-zinc-200/70 dark:bg-zinc-800/90 p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTool("crop")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                      activeTool === "crop"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                        : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-700/40"
                    }`}
                  >
                    <CropIcon className="w-3.5 h-3.5" />
                    <span>{locale === "id" ? "Pangkas" : "Crop"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTool("annotate")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                      activeTool === "annotate"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                        : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/40 dark:hover:bg-zinc-700/40"
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{locale === "id" ? "Tandai / Spidol" : "Annotate"}</span>
                  </button>
                </div>

                {/* Fit/Full image button (when Crop is active) */}
                {activeTool === "crop" && (
                  <button
                    type="button"
                    onClick={handleSelectAllCrop}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-500/15 hover:bg-teal-500/25 active:scale-95 transition-all cursor-pointer border border-teal-500/20"
                    title={locale === "id" ? "Pilih Seluruh Gambar" : "Select Entire Image"}
                  >
                    <span>{locale === "id" ? "Penuh" : "Fit/Full"}</span>
                  </button>
                )}
              </div>

              {/* Transform Action Buttons (Rotate & Reset) */}
              <div className="flex items-center rounded-xl bg-zinc-200/50 dark:bg-zinc-800/80 p-1 gap-0.5">
                <button
                  type="button"
                  onClick={handleRotateCcw}
                  className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  title={locale === "id" ? "Putar Kiri 90°" : "Rotate 90° CCW"}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRotateCw}
                  className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  title={locale === "id" ? "Putar Kanan 90°" : "Rotate 90° CW"}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetEdit}
                  className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  title={locale === "id" ? "Reset Edit" : "Reset Edits"}
                >
                  <ResetIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Annotation Color & Undo Sub-bar */}
            {activeTool === "annotate" && (
              <div className="shrink-0 flex items-center justify-between bg-zinc-100/90 dark:bg-zinc-900/95 border-b border-zinc-200/80 dark:border-zinc-800 px-3.5 sm:px-4 py-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium">
                    {locale === "id" ? "Warna:" : "Color:"}
                  </span>
                  {[
                    { color: "#ef4444", label: "Red" },
                    { color: "#f59e0b", label: "Amber" },
                    { color: "#10b981", label: "Emerald" },
                    { color: "#06b6d4", label: "Cyan" },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setStrokeColor(c.color)}
                      className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                        strokeColor === c.color ? "border-zinc-900 dark:border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setStrokes((prev) => prev.slice(0, -1))}
                  disabled={strokes.length === 0}
                  className="flex items-center gap-1 text-[11px] text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>{locale === "id" ? "Urungkan" : "Undo"}</span>
                </button>
              </div>
            )}

            {/* Canvas Interactive Viewport */}
            <div
              ref={viewportRef}
              className="relative flex-1 min-h-[220px] w-full bg-zinc-950 dark:bg-black overflow-hidden flex items-center justify-center p-3 sm:p-4 select-none touch-none"
            >
              <div
                ref={containerRef}
                onPointerMove={(e) => {
                  if (activeTool === "crop") handleCropPointerMove(e);
                  if (activeTool === "annotate") handleAnnotatePointerMove(e);
                }}
                onPointerUp={() => {
                  if (activeTool === "crop") handleCropPointerUp();
                  if (activeTool === "annotate") handleAnnotatePointerUp();
                }}
                style={{
                  width: stageSize.width ? `${stageSize.width}px` : "auto",
                  height: stageSize.height ? `${stageSize.height}px` : "auto",
                }}
                className="relative overflow-visible shadow-2xl select-none touch-none"
              >
                {/* Base rotated image canvas */}
                <canvas
                  ref={canvasRef}
                  style={{ width: "100%", height: "100%" }}
                  className="block pointer-events-none rounded-lg"
                />

                {/* Annotation overlay canvas */}
                <canvas
                  ref={annotateCanvasRef}
                  onPointerDown={handleAnnotatePointerDown}
                  style={{ width: "100%", height: "100%" }}
                  className={`absolute inset-0 block rounded-lg ${
                    activeTool === "annotate" ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"
                  }`}
                />

                {/* Crop Overlay & Handles */}
                {activeTool === "crop" && (
                  <div
                    className="absolute border-2 border-teal-400 bg-teal-500/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move touch-none"
                    style={{
                      left: `${crop.x}%`,
                      top: `${crop.y}%`,
                      width: `${crop.width}%`,
                      height: `${crop.height}%`,
                    }}
                    onPointerDown={(e) => handleCropPointerDown(e, "move")}
                  >
                    {/* Corner Bracket Handles */}
                    <div
                      className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-3 border-l-3 border-teal-400 cursor-nwse-resize bg-teal-500/20"
                      onPointerDown={(e) => handleCropPointerDown(e, "tl")}
                    />
                    <div
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-3 border-r-3 border-teal-400 cursor-nesw-resize bg-teal-500/20"
                      onPointerDown={(e) => handleCropPointerDown(e, "tr")}
                    />
                    <div
                      className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-3 border-l-3 border-teal-400 cursor-nesw-resize bg-teal-500/20"
                      onPointerDown={(e) => handleCropPointerDown(e, "bl")}
                    />
                    <div
                      className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-3 border-r-3 border-teal-400 cursor-nwse-resize bg-teal-500/20"
                      onPointerDown={(e) => handleCropPointerDown(e, "br")}
                    />

                    {/* Edge Handles */}
                    <div
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-teal-400 border border-teal-300 cursor-ns-resize shadow-xs"
                      onPointerDown={(e) => handleCropPointerDown(e, "t")}
                    />
                    <div
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-teal-400 border border-teal-300 cursor-ns-resize shadow-xs"
                      onPointerDown={(e) => handleCropPointerDown(e, "b")}
                    />
                    <div
                      className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-8 w-2 rounded-full bg-teal-400 border border-teal-300 cursor-ew-resize shadow-xs"
                      onPointerDown={(e) => handleCropPointerDown(e, "l")}
                    />
                    <div
                      className="absolute top-1/2 -right-1.5 -translate-y-1/2 h-8 w-2 rounded-full bg-teal-400 border border-teal-300 cursor-ew-resize shadow-xs"
                      onPointerDown={(e) => handleCropPointerDown(e, "r")}
                    />

                    {/* Subtle Rule-of-Thirds Grid */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pinned Bottom Action Bar */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 sm:px-5 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setModalStep("upload")}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {locale === "id" ? "Ganti Gambar" : "Change Image"}
              </button>

              <button
                type="button"
                onClick={handleProceedToExtract}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{locale === "id" ? "Proses dengan AI" : "Process with AI"}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5">
            {/* ================= STEP 1: UPLOAD / INGESTION ================= */}
            {modalStep === "upload" && (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-5 animate-fade-in">
                {/* Hidden file inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* Drag & Drop Box */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center border-2 border-dashed border-teal-500/40 hover:border-teal-500 bg-teal-500/5 dark:bg-teal-950/20 hover:bg-teal-500/10 rounded-2xl p-8 sm:p-10 cursor-pointer transition-all group"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 mb-3 group-hover:scale-105 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center">
                    {locale === "id"
                      ? "Tarik & lepas struk atau foto di sini"
                      : "Drag & drop receipt or photo here"}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-1">
                    {locale === "id"
                      ? "atau klik untuk memilih dari perangkat (PNG, JPG, WebP)"
                      : "or click to browse files (PNG, JPG, WebP)"}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-zinc-200/60 dark:bg-zinc-800/80 px-2.5 py-1 text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                    <span>{locale === "id" ? "Bisa tekan Ctrl+V untuk tempel" : "Or press Ctrl+V to paste"}</span>
                  </div>
                </div>

                {/* Direct Buttons: Take Photo vs Choose File */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    <Camera className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>{locale === "id" ? "Ambil Foto (Kamera)" : "Take Photo (Camera)"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    <ImageIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>{locale === "id" ? "Pilih dari Galeri" : "Choose from Gallery"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 3: PROCESSING STEPPER ================= */}
            {modalStep === "processing" && (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-6 animate-fade-in text-center">
                {/* Image Thumbnail Preview */}
                {processedImageDataUrl && (
                  <div className="relative w-36 h-36 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md bg-zinc-950/20">
                    <img
                      src={processedImageDataUrl}
                      alt="Processed Preview"
                      className="w-full h-full object-cover filter brightness-90"
                    />
                    <div className="absolute inset-0 bg-teal-500/10 backdrop-blur-[1px] flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-teal-600 dark:text-teal-400 animate-spin" />
                    </div>
                  </div>
                )}

                {/* Stepper matching user's drawing: Uploading... -> Extracting... -> */}
                <div className="w-full max-w-sm space-y-3">
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all ${
                        extractStep === "uploading" || extractStep === "compressing"
                          ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/30"
                          : extractStep === "extracting" || extractStep === "completed"
                          ? "text-zinc-400 line-through opacity-70"
                          : "text-zinc-400"
                      }`}
                    >
                      <span>{locale === "id" ? "Mengunggah..." : "Uploading..."}</span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />

                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all ${
                        extractStep === "extracting"
                          ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/30"
                          : extractStep === "completed"
                          ? "text-teal-600 font-bold"
                          : "text-zinc-400"
                      }`}
                    >
                      <span>{locale === "id" ? "Mengekstrak..." : "Extracting..."}</span>
                    </div>
                  </div>

                  {/* Friendly active status text */}
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 animate-pulse">
                    {extractStep === "compressing" && (locale === "id" ? "Mengoptimalkan ukuran gambar..." : "Optimizing image size...")}
                    {extractStep === "uploading" && (locale === "id" ? "Mengunggah gambar ke AI vision..." : "Uploading image to AI vision...")}
                    {extractStep === "extracting" && (locale === "id" ? "AI sedang membaca rincian transaksi & struk..." : "AI is analyzing receipt details & items...")}
                    {extractStep === "idle" && (locale === "id" ? "Mempersiapkan..." : "Preparing...")}
                  </p>
                </div>

                {/* Extraction Error Notice */}
                {extractError && (
                  <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40 p-4 text-xs text-rose-700 dark:text-rose-300 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-semibold">{extractError}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setModalStep("edit")}
                        className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 text-xs font-semibold cursor-pointer"
                      >
                        {locale === "id" ? "Edit Gambar Lagi" : "Re-edit Image"}
                      </button>
                      <button
                        type="button"
                        onClick={handleRetryExtract}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        {locale === "id" ? "Coba Lagi" : "Try Again"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 4: DETECTED RESULTS REVIEW ================= */}
            {modalStep === "detected" && extractedDoc && (
              <div className="flex flex-col space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                    {locale === "id" ? "Hasil Terdeteksi" : "Detected Result"}
                  </h3>
                  <span className="ml-auto rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-700 dark:text-teal-300">
                    {extractedDoc.kind === "receipt"
                      ? "Struk Belanja"
                      : extractedDoc.kind === "transaction_list" || (extractedDoc.transactions && extractedDoc.transactions.length > 1)
                      ? (locale === "id"
                          ? `Mutasi (${extractedDoc.transactions?.length || extractedDoc.items?.length || 0} Transaksi)`
                          : `Statement (${extractedDoc.transactions?.length || extractedDoc.items?.length || 0} Trans.)`)
                      : "Bukti Mutasi / Transfer"}
                  </span>
                </div>

                {/* Detected Overview Card */}
                <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {extractedDoc.merchant ||
                          (extractedDoc.kind === "transaction_list" || (extractedDoc.transactions && extractedDoc.transactions.length > 1)
                            ? (locale === "id" ? "Daftar Transaksi" : "Transaction Statement")
                            : (locale === "id" ? "Transaksi Terdeteksi" : "Detected Transaction"))}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{extractedDoc.date || new Date().toISOString().split("T")[0]}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-medium text-zinc-500 uppercase">
                        {locale === "id" ? "Total Terbaca" : "Total Detected"}
                      </span>
                      <div className="text-base font-extrabold text-teal-600 dark:text-teal-400">
                        {formatCurrency(extractedDoc.total || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Item List / Transactions preview */}
                  {((extractedDoc.transactions && extractedDoc.transactions.length > 0) ||
                    (extractedDoc.items && extractedDoc.items.length > 0)) && (
                    <div className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/80 space-y-1.5 max-h-52 overflow-y-auto no-scrollbar">
                      <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                        {extractedDoc.transactions && extractedDoc.transactions.length > 1
                          ? locale === "id"
                            ? `Transaksi Terdeteksi (${extractedDoc.transactions.length}):`
                            : `Detected Transactions (${extractedDoc.transactions.length}):`
                          : locale === "id"
                          ? `Item Terdeteksi (${extractedDoc.items.length || extractedDoc.transactions?.length || 0}):`
                          : `Detected Items (${extractedDoc.items.length || extractedDoc.transactions?.length || 0}):`}
                      </p>
                      {extractedDoc.transactions && extractedDoc.transactions.length > 1
                        ? extractedDoc.transactions.map((tx, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-white dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800"
                            >
                              <div className="truncate pr-2">
                                <span className="font-semibold text-zinc-800 dark:text-zinc-100 block truncate">
                                  {tx.name}
                                </span>
                                {tx.date && (
                                  <span className="text-[10px] text-zinc-400 block">
                                    {tx.date}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`font-bold shrink-0 ${
                                  tx.direction === "in"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-zinc-900 dark:text-zinc-100"
                                }`}
                              >
                                {tx.direction === "in" ? "+" : "-"} {formatCurrency(tx.amount)}
                              </span>
                            </div>
                          ))
                        : extractedDoc.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800"
                            >
                              <div className="flex items-center gap-1.5 truncate pr-2">
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                  {it.quantity > 1 ? `${it.quantity}x ` : ""}
                                </span>
                                <span className="truncate text-zinc-800 dark:text-zinc-200">{it.name}</span>
                              </div>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100 shrink-0">
                                {formatCurrency(it.unitPrice * (it.quantity || 1))}
                              </span>
                            </div>
                          ))}
                    </div>
                  )}

                  {/* Subtotal, Tax, Service charge metadata if present */}
                  {(extractedDoc.taxAmount || extractedDoc.serviceAmount || extractedDoc.discountAmount) && (
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/80 grid grid-cols-3 gap-2 text-[11px] text-zinc-500">
                      {extractedDoc.taxAmount ? (
                        <div>
                          <span className="block text-[10px] text-zinc-400">Pajak (Tax):</span>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{formatCurrency(extractedDoc.taxAmount)}</span>
                        </div>
                      ) : null}
                      {extractedDoc.serviceAmount ? (
                        <div>
                          <span className="block text-[10px] text-zinc-400">Layanan:</span>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">{formatCurrency(extractedDoc.serviceAmount)}</span>
                        </div>
                      ) : null}
                      {extractedDoc.discountAmount ? (
                        <div>
                          <span className="block text-[10px] text-zinc-400">Diskon:</span>
                          <span className="font-medium text-emerald-600">-{formatCurrency(extractedDoc.discountAmount)}</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setModalStep("edit")}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    {locale === "id" ? "Edit Ulang Foto" : "Re-edit Photo"}
                  </button>

                  <button
                    type="button"
                    onClick={handleApply}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {context === "split"
                        ? locale === "id"
                          ? "Terapkan ke Split Bill"
                          : "Apply to Split Bill"
                        : locale === "id"
                        ? "Terapkan ke Pengeluaran"
                        : "Apply to Expense"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
