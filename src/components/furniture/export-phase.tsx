"use client";

import { useCallback, useMemo, useRef } from "react";
import { useMobiStore } from "@/store/mobi-store";
import FichaCanvas from "./ficha-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  FileImage,
  Copy,
  Printer,
} from "lucide-react";
import { toast } from "sonner";

export default function ExportPhase() {
  const setPhase = useMobiStore((s) => s.setPhase);
  const referenceImage = useMobiStore((s) => s.referenceImage);
  const editedData = useMobiStore((s) => s.editedData);
  const gridPositions = useMobiStore((s) => s.gridPositions);
  const extras = useMobiStore((s) => s.extras);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Get a field value for export canvas rendering.
   */
  function getExportValue(fieldId: string, data: Record<string, unknown>): string {
    if (fieldId === "brand") return String(data.brand ?? "");
    if (fieldId === "sheetTitle") return "FICHA TÉCNICA";
    if (fieldId === "productType") return String(data.productType ?? "");

    const key = fieldId.replace("f-", "");
    switch (key) {
      case "style":
        return String(data.style ?? "");
      case "material":
        return String((data.material as Record<string, unknown>)?.main ?? "");
      case "finish":
        return String(data.finish ?? "");
      case "feature":
        return String(data.feature ?? "");
      case "width":
        return String((data.dimensions as Record<string, unknown>)?.width ?? "");
      case "height":
        return String((data.dimensions as Record<string, unknown>)?.height ?? "");
      case "depth":
        return String((data.dimensions as Record<string, unknown>)?.depth ?? "");
      case "seatHeight":
        return String((data.dimensions as Record<string, unknown>)?.seatHeight ?? "");
      case "weight":
        return String(data.weight ?? "");
      default:
        if (fieldId.startsWith("ann-")) {
          const idx = parseInt(fieldId.replace("ann-", ""), 10) - 1;
          const annotations = data.annotations as string[] | undefined;
          return annotations?.[idx] ?? "";
        }
        return "";
    }
  }

  function fontSizeNumToPx(size: number): number {
    switch (size) {
      case 1: return 10;
      case 2: return 14;
      case 3: return 20;
      default: return 14;
    }
  }

  const composeCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!referenceImage || !gridPositions || !editedData) return null;

    const { fields, sheetBgColor, imageWidth, imageHeight } = gridPositions;
    const editableFields = fields.filter((f) => f.editable);

    if (editableFields.length === 0) return null;

    const canvas = document.createElement("canvas");
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Draw background image
    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      bgImg.onload = () => resolve();
      bgImg.onerror = reject;
      bgImg.src = referenceImage;
    });
    ctx.drawImage(bgImg, 0, 0, imageWidth, imageHeight);

    // Draw each editable field — paint bg color rect then text on top
    for (const field of editableFields) {
      const value = getExportValue(field.id, editedData as unknown as Record<string, unknown>);
      if (!value) continue;

      // Paint background color rect to cover original text
      ctx.fillStyle = sheetBgColor;
      ctx.fillRect(field.x, field.y, field.w, field.h);

      // Draw the edited text
      const pxSize = fontSizeNumToPx(field.fontSize);
      const isBold = field.fontSize === 3;
      ctx.font = `${isBold ? "bold " : ""}${pxSize}px sans-serif`;
      ctx.fillStyle = "#1a1a1a";
      ctx.textBaseline = "top";
      ctx.fillText(value, field.x + 2, field.y + 2);
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
            // Convert percentage-based position to pixels
            const ex = (extra.x / 100) * imageWidth;
            const ey = (extra.y / 100) * imageHeight;
            const ew = (extra.w / imageWidth) * imageWidth;
            const eh = (extra.h / imageHeight) * imageHeight;
            ctx.drawImage(extraImg, ex, ey, ew, eh);
          } catch {
            // Skip invalid images
          }
        }
      } else if (extra.type === "text") {
        const ex = (extra.x / 100) * imageWidth;
        const ey = (extra.y / 100) * imageHeight;
        ctx.font = `${extra.fontSize ?? 16}px sans-serif`;
        ctx.fillStyle = "#1a1a1a";
        ctx.textBaseline = "top";
        ctx.fillText(extra.data, ex, ey);
      } else if (extra.type === "stamp") {
        const ex = (extra.x / 100) * imageWidth;
        const ey = (extra.y / 100) * imageHeight;
        const ew = (extra.w / imageWidth) * imageWidth;
        const eh = (extra.h / imageHeight) * imageHeight;
        ctx.font = "bold 14px sans-serif";
        ctx.fillStyle = "#4a4a4a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✓ APROBADO", ex + ew / 2, ey + eh / 2);
      }
    }

    return canvas;
  }, [referenceImage, gridPositions, editedData, extras]);

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
