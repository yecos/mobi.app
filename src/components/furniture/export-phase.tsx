"use client";

import { useCallback } from "react";
import { useMobiStore } from "@/store/mobi-store";
import FichaCanvas from "./ficha-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, FileImage, Printer } from "lucide-react";
import { toast } from "sonner";

export default function ExportPhase() {
  const setPhase = useMobiStore((s) => s.setPhase);
  const uploadedImage = useMobiStore((s) => s.uploadedImage);
  const detectionResult = useMobiStore((s) => s.detectionResult);
  const editedRegions = useMobiStore((s) => s.editedRegions);

  const composeCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!uploadedImage || !detectionResult || editedRegions.length === 0) return null;

    const { imageWidth, imageHeight } = detectionResult;

    const canvas = document.createElement("canvas");
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 1. Draw original image
    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      bgImg.onload = () => resolve();
      bgImg.onerror = reject;
      bgImg.src = uploadedImage;
    });
    ctx.drawImage(bgImg, 0, 0, imageWidth, imageHeight);

    // 2. For each edited region, paint a background cover rect and then the new text
    for (const region of editedRegions) {
      const x = (region.x / 100) * imageWidth;
      const y = (region.y / 100) * imageHeight;
      const w = (region.w / 100) * imageWidth;
      const h = (region.h / 100) * imageHeight;

      if (!region.text) continue;

      // Paint a white/background rect to cover the original text
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(x, y, w, h);

      // Draw the edited text
      const isBold = region.bold ? "bold " : "";
      ctx.font = `${isBold}${region.fontSize}px sans-serif`;
      ctx.fillStyle = region.color || "#1a1a1a";
      ctx.textBaseline = "top";
      ctx.fillText(region.text, x + 2, y + 2);
    }

    return canvas;
  }, [uploadedImage, detectionResult, editedRegions]);

  const handleDownloadPNG = useCallback(async () => {
    try {
      const canvas = await composeCanvas();
      if (!canvas) {
        toast.error("Error al generar imagen");
        return;
      }
      const link = document.createElement("a");
      link.download = "ficha-editada.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("PNG descargado");
    } catch {
      toast.error("Error al generar PNG");
    }
  }, [composeCanvas]);

  const handleDownloadJPG = useCallback(async () => {
    try {
      const canvas = await composeCanvas();
      if (!canvas) {
        toast.error("Error al generar imagen");
        return;
      }
      const link = document.createElement("a");
      link.download = "ficha-editada.jpg";
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
      toast.success("JPG descargado");
    } catch {
      toast.error("Error al generar JPG");
    }
  }, [composeCanvas]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

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
            <FichaCanvas inlineEditing={false} />
          </div>
        </div>

        {/* Export options */}
        <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border/50 p-4 sm:p-6 space-y-4 print:hidden">
          <h2 className="text-lg font-bold">Exportar Ficha</h2>
          <p className="text-sm text-muted-foreground">
            Descarga tu ficha con los textos editados.
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
                onClick={handlePrint}
                variant="outline"
                className="w-full gap-2"
                size="lg"
              >
                <Printer className="h-5 w-5" />
                Imprimir PDF
              </Button>
            </CardContent>
          </Card>

          {detectionResult && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Campos editados:</strong> {editedRegions.length}
              </p>
              <p>
                <strong>Resolución original:</strong>{" "}
                {detectionResult.imageWidth}×{detectionResult.imageHeight}px
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
