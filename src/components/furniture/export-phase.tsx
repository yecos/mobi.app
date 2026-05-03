"use client";

import { useCallback, useMemo, useRef } from "react";
import { useMobiStore } from "@/store/mobi-store";
import { getFieldLabels } from "@/lib/ficha-layouts";
import FichaCanvas from "./ficha-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  FileImage,
  FileText,
  Copy,
  Printer,
} from "lucide-react";
import { toast } from "sonner";

export default function ExportPhase() {
  const setPhase = useMobiStore((s) => s.setPhase);
  const canvasImage = useMobiStore((s) => s.canvasImage);
  const editedData = useMobiStore((s) => s.editedData);
  const fichaLayout = useMobiStore((s) => s.fichaLayout);
  const extras = useMobiStore((s) => s.extras);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const labels = useMemo(() => getFieldLabels(), []);

  /**
   * Compose the ficha on a hidden canvas: background image + text overlays.
   */
  const composeCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!canvasImage || !fichaLayout || !editedData) return null;

    const LAYOUT_W = fichaLayout.width;
    const LAYOUT_H = fichaLayout.height;

    const canvas = document.createElement("canvas");
    canvas.width = LAYOUT_W;
    canvas.height = LAYOUT_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Draw background image
    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      bgImg.onload = () => resolve();
      bgImg.onerror = reject;
      bgImg.src = canvasImage;
    });
    ctx.drawImage(bgImg, 0, 0, LAYOUT_W, LAYOUT_H);

    // Helper to draw text at field position
    const drawField = (
      fieldId: string,
      field: { x: number; y: number; w: number; h: number; fontSize: number; align?: string; type: string; unit?: string }
    ) => {
      if (field.type === "label") {
        const labelText = labels[`f-${fieldId.replace("l-", "")}`] ?? "";
        ctx.font = `${field.fontSize}px sans-serif`;
        ctx.fillStyle = "rgba(100, 100, 100, 0.7)";
        ctx.textAlign = (field.align as CanvasTextAlign) ?? "left";
        ctx.textBaseline = "top";
        ctx.fillText(labelText, field.x, field.y);
        return;
      }

      const value = getExportValue(fieldId, editedData as unknown as Record<string, unknown>);
      if (!value) return;

      const displayValue = field.unit ? `${value} ${field.unit}` : value;
      ctx.font = `${field.fontSize}px sans-serif`;
      ctx.fillStyle = "#1a1a1a";
      ctx.textAlign = (field.align as CanvasTextAlign) ?? "left";
      ctx.textBaseline = "top";
      ctx.fillText(displayValue, field.x, field.y + 2);
    };

    // Draw all fields
    drawField("brand", fichaLayout.brand);
    drawField("sheetTitle", fichaLayout.sheetTitle);
    drawField("productName", fichaLayout.productName);

    for (const field of fichaLayout.fields) {
      drawField(field.id, field);
    }
    for (const field of fichaLayout.annotations) {
      drawField(field.id, field);
    }

    // Draw extras
    for (const extra of extras) {
      if (extra.type === "image" || extra.type === "logo") {
        if (extra.data) {
          const extraImg = new Image();
          extraImg.crossOrigin = "anonymous";
          try {
            await new Promise<void>((resolve, reject) => {
              extraImg.onload = () => resolve();
              extraImg.onerror = reject;
              extraImg.src = extra.data;
            });
            ctx.drawImage(extraImg, extra.x, extra.y, extra.w, extra.h);
          } catch {
            // Skip invalid images
          }
        }
      } else if (extra.type === "text") {
        ctx.font = `${extra.fontSize ?? 16}px sans-serif`;
        ctx.fillStyle = "#1a1a1a";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(extra.data, extra.x, extra.y);
      } else if (extra.type === "stamp") {
        ctx.font = "bold 14px sans-serif";
        ctx.fillStyle = "#4a4a4a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✓ APROBADO", extra.x + extra.w / 2, extra.y + extra.h / 2);
      }
    }

    return canvas;
  }, [canvasImage, fichaLayout, editedData, extras, labels]);

  const handleDownloadPNG = useCallback(async () => {
    try {
      const canvas = await composeCanvas();
      if (!canvas) {
        toast.error("Error al generar imagen");
        return;
      }
      const link = document.createElement("a");
      link.download = `ficha-tecnica-${editedData?.productType ?? "mueble"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("PNG descargado");
    } catch {
      toast.error("Error al generar PNG");
    }
  }, [composeCanvas, editedData]);

  const handleDownloadJPG = useCallback(async () => {
    try {
      const canvas = await composeCanvas();
      if (!canvas) {
        toast.error("Error al generar imagen");
        return;
      }
      const link = document.createElement("a");
      link.download = `ficha-tecnica-${editedData?.productType ?? "mueble"}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
      toast.success("JPG descargado");
    } catch {
      toast.error("Error al generar JPG");
    }
  }, [composeCanvas, editedData]);

  const handleDownloadPDF = useCallback(() => {
    window.print();
  }, []);

  const jsOutput = useMemo(() => {
    if (!editedData) return "";
    return JSON.stringify(
      { ...editedData, extras: extras.length > 0 ? extras : undefined },
      null,
      2
    );
  }, [editedData, extras]);

  const handleCopyJs = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsOutput);
      toast.success("JS copiado al portapapeles");
    } catch {
      toast.error("Error al copiar");
    }
  }, [jsOutput]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20 print:hidden">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPhase("editing")}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Editor
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-bold">
              <span className="text-primary">Mobili</span>{" "}
              <span className="text-muted-foreground font-normal text-sm">
                — Exportar
              </span>
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col lg:flex-row print:block">
        {/* Preview */}
        <div className="flex-1 p-4 sm:p-6 flex items-center justify-center bg-muted/10 print:bg-white print:p-0">
          <div className="w-full max-w-xl" id="print-area">
            <FichaCanvas
              scale={100}
              onScaleChange={() => {}}
              activeFieldId={null}
              onFieldClick={() => {}}
            />
          </div>
        </div>

        {/* Export options */}
        <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border/50 p-4 sm:p-6 space-y-4 print:hidden">
          <h2 className="text-lg font-bold">Exportar Ficha Técnica</h2>
          <p className="text-sm text-muted-foreground">
            Descarga tu ficha técnica en el formato que necesites.
          </p>

          <Card>
            <CardContent className="p-4 space-y-3">
              <Button
                onClick={handleDownloadPNG}
                className="w-full gap-2"
                size="lg"
              >
                <FileImage className="h-5 w-5" />
                Descargar PNG
              </Button>
              <Button
                onClick={handleDownloadJPG}
                variant="outline"
                className="w-full gap-2"
                size="lg"
              >
                <Download className="h-5 w-5" />
                Descargar JPG
              </Button>
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="w-full gap-2"
                size="lg"
              >
                <Printer className="h-5 w-5" />
                Descargar PDF
              </Button>
              <Separator />
              <Button
                onClick={handleCopyJs}
                variant="secondary"
                className="w-full gap-2"
                size="lg"
              >
                <Copy className="h-5 w-5" />
                Copiar JS
              </Button>
            </CardContent>
          </Card>

          {editedData && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Tipo:</strong> {editedData.productType}
              </p>
              <p>
                <strong>Material:</strong> {editedData.material?.main}
              </p>
              <p>
                <strong>Dimensiones:</strong>{" "}
                {editedData.dimensions?.width}×{editedData.dimensions?.height}×
                {editedData.dimensions?.depth} cm
              </p>
            </div>
          )}

          {/* Hidden canvas for export */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </main>
    </div>
  );
}

/**
 * Get a field value for export canvas rendering.
 */
function getExportValue(
  fieldId: string,
  editedData: Record<string, unknown>
): string {
  if (fieldId === "brand") return String(editedData.brand ?? "");
  if (fieldId === "sheetTitle") return "FICHA TÉCNICA";
  if (fieldId === "productName") return String(editedData.productName ?? "");

  const key = fieldId.replace("f-", "");
  switch (key) {
    case "productType":
      return String(editedData.productType ?? "");
    case "style":
      return String(editedData.style ?? "");
    case "material":
      return String(
        (editedData.material as Record<string, unknown>)?.main ?? ""
      );
    case "finish":
      return String(editedData.finish ?? "");
    case "feature":
      return String(editedData.feature ?? "");
    case "width":
      return String(
        (editedData.dimensions as Record<string, unknown>)?.width ?? ""
      );
    case "height":
      return String(
        (editedData.dimensions as Record<string, unknown>)?.height ?? ""
      );
    case "depth":
      return String(
        (editedData.dimensions as Record<string, unknown>)?.depth ?? ""
      );
    case "seatHeight":
      return String(
        (editedData.dimensions as Record<string, unknown>)?.seatHeight ?? ""
      );
    case "weight":
      return String(editedData.weight ?? "");
    default:
      // Annotations
      if (fieldId.startsWith("ann-")) {
        const idx = parseInt(fieldId.replace("ann-", ""), 10) - 1;
        const annotations = editedData.annotations as string[] | undefined;
        return annotations?.[idx] ?? "";
      }
      return "";
  }
}
