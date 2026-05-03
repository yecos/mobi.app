"use client";

import { useCallback, useRef, useState } from "react";
import { useMobiStore, type DetectionResult } from "@/store/mobi-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Upload, Sparkles, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

export default function InputPhase() {
  const {
    uploadedImage,
    uploadedImageName,
    setUploadedImage,
    setPhase,
    setDetectionResult,
    setGeneratingStep,
    setError,
  } = useMobiStore();

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        toast.error("Formato no soportado. Usa JPG, PNG o WebP.");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error("La imagen es demasiado grande. Máximo 20MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          setUploadedImage(result, file.name, img.naturalWidth, img.naturalHeight);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    },
    [setUploadedImage]
  );

  const handleDetect = useCallback(async () => {
    if (!uploadedImage) {
      toast.error("Sube una imagen primero");
      return;
    }

    const { uploadedImageWidth, uploadedImageHeight } = useMobiStore.getState();
    setPhase("generating");
    setError(null);
    setGeneratingStep("Detectando texto en la imagen...");

    try {
      const detectRes = await fetch("/api/detect-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadedImage,
          imageWidth: uploadedImageWidth,
          imageHeight: uploadedImageHeight,
        }),
      });

      if (!detectRes.ok) {
        const errData = await detectRes.json();
        throw new Error(errData.error || "Error al detectar texto");
      }

      const detectData = await detectRes.json();
      const result: DetectionResult = detectData.result;

      if (!result.regions || result.regions.length === 0) {
        throw new Error("No se detectó texto en la imagen. Intenta con otra imagen más clara.");
      }

      setDetectionResult(result);

      // Small delay for UX
      await new Promise((r) => setTimeout(r, 500));

      setPhase("editing");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      toast.error(message);
      setPhase("input");
    } finally {
      setGeneratingStep(null);
    }
  }, [uploadedImage, setPhase, setError, setGeneratingStep, setDetectionResult]);

  const removeImage = useCallback(() => {
    setUploadedImage("", "", 0, 0);
  }, [setUploadedImage]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight"
          >
            <span className="text-primary">Mobili</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground mt-2"
          >
            Detecta y edita texto en fichas técnicas con IA
          </motion.p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardContent className="p-6 space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Sube tu ficha técnica</h3>
              <p className="text-xs text-muted-foreground">
                La IA detectará todo el texto y crearás campos editables en las posiciones exactas
              </p>
              {!uploadedImage ? (
                <div
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleFile(file);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 sm:p-12
                    cursor-pointer transition-all duration-200 text-center
                    ${
                      isDragOver
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                    }
                  `}
                >
                  <motion.div
                    animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Upload className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
                  </motion.div>
                  <p className="text-sm font-medium">
                    Arrastra una imagen aquí o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG o WebP — máximo 20MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-border/50 bg-muted/30">
                  <div className="flex items-center gap-3 p-3">
                    <div className="h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={uploadedImage}
                        alt="Vista previa"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-medium truncate">
                          {uploadedImageName}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Imagen lista para analizar
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeImage}
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Image preview */}
                  <div className="border-t border-border/30 p-2">
                    <img
                      src={uploadedImage}
                      alt="Preview"
                      className="w-full h-auto max-h-80 object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Detect Button */}
            <Button
              onClick={handleDetect}
              size="lg"
              disabled={!uploadedImage}
              className="w-full text-base font-semibold h-12 gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Detectar Texto con IA
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
