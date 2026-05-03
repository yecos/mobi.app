"use client";

import { useCallback, useRef, useState } from "react";
import { useMobiStore } from "@/store/mobi-store";
import { getLayoutByType } from "@/lib/ficha-layouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Upload,
  Sparkles,
  Image as ImageIcon,
  X,
  Ruler,
} from "lucide-react";
import { toast } from "sonner";

export default function InputPhase() {
  const {
    uploadedImage,
    uploadedImageName,
    userDimensions,
    userBrand,
    userProductName,
    setUploadedImage,
    setUserDimensions,
    setUserBrand,
    setUserProductName,
    setPhase,
    setFurnitureData,
    setReferenceImage,
    setCanvasImage,
    setFichaLayout,
    setGeneratingStep,
    setError,
  } = useMobiStore();

  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
        setUploadedImage(result, file.name);
        setErrors((prev) => ({ ...prev, image: "" }));
      };
      reader.readAsDataURL(file);
    },
    [setUploadedImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!uploadedImage) newErrors.image = "Sube una foto del mueble";
    if (!userDimensions.width || userDimensions.width <= 0)
      newErrors.width = "Requerido";
    if (!userDimensions.height || userDimensions.height <= 0)
      newErrors.height = "Requerido";
    if (!userDimensions.depth || userDimensions.depth <= 0)
      newErrors.depth = "Requerido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [uploadedImage, userDimensions]);

  const handleGenerate = useCallback(async () => {
    if (!validate()) {
      toast.error("Completa todos los campos requeridos");
      return;
    }

    setPhase("generating");
    setError(null);

    try {
      // Step 1: Analyze photo
      setGeneratingStep("Analizando imagen...");
      const analyzeRes = await fetch("/api/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadedImage,
          dimensions: userDimensions,
          brand: userBrand,
        }),
      });

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json();
        throw new Error(errData.error || "Error al analizar la imagen");
      }

      const analyzeData = await analyzeRes.json();
      const furnitureData = analyzeData.data;

      // Override with user-provided values
      furnitureData.brand = userBrand;
      furnitureData.dimensions = {
        ...furnitureData.dimensions,
        width: userDimensions.width,
        height: userDimensions.height,
        depth: userDimensions.depth,
        seatHeight: userDimensions.seatHeight || furnitureData.dimensions?.seatHeight || null,
      };
      if (userProductName) {
        furnitureData.productName = userProductName;
      }

      setFurnitureData(furnitureData);

      // Step 2: Generate complete sheet
      setGeneratingStep("Generando ficha completa...");
      const completeRes = await fetch("/api/generate-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ furnitureData, type: "complete" }),
      });

      if (!completeRes.ok) {
        const errData = await completeRes.json();
        throw new Error(errData.error || "Error al generar ficha completa");
      }

      const completeData = await completeRes.json();
      setReferenceImage(completeData.image);

      // Step 3: Generate clean sheet
      setGeneratingStep("Generando plantilla limpia...");
      const cleanRes = await fetch("/api/generate-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ furnitureData, type: "clean" }),
      });

      if (!cleanRes.ok) {
        const errData = await cleanRes.json();
        throw new Error(errData.error || "Error al generar plantilla limpia");
      }

      const cleanData = await cleanRes.json();
      setCanvasImage(cleanData.image);

      // Step 4: Prepare layout
      setGeneratingStep("Preparando editor...");
      const layout = getLayoutByType(furnitureData.productType);
      setFichaLayout(layout);

      // Small delay for UX
      await new Promise((r) => setTimeout(r, 500));

      setPhase("review");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      toast.error(message);
      setPhase("input");
    } finally {
      setGeneratingStep(null);
    }
  }, [
    validate,
    uploadedImage,
    userDimensions,
    userBrand,
    userProductName,
    setPhase,
    setError,
    setGeneratingStep,
    setFurnitureData,
    setReferenceImage,
    setCanvasImage,
    setFichaLayout,
  ]);

  const removeImage = useCallback(() => {
    setUploadedImage("", "");
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
            Generador de fichas técnicas para mobiliario
          </motion.p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardContent className="p-6 space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Foto del mueble</Label>
              {!uploadedImage ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 sm:p-12
                    cursor-pointer transition-all duration-200 text-center
                    ${
                      isDragOver
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : errors.image
                          ? "border-destructive/50 bg-destructive/5"
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
                    Arrastra una foto aquí o haz clic para seleccionar
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
                </div>
              )}
              {errors.image && (
                <p className="text-xs text-destructive">{errors.image}</p>
              )}
            </div>

            {/* Dimensions */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Dimensiones
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="width" className="text-xs text-muted-foreground">
                    Ancho (cm) *
                  </Label>
                  <Input
                    id="width"
                    type="number"
                    min={1}
                    placeholder="130"
                    value={userDimensions.width || ""}
                    onChange={(e) =>
                      setUserDimensions({
                        width: Number(e.target.value),
                      })
                    }
                    className={errors.width ? "border-destructive" : ""}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="height" className="text-xs text-muted-foreground">
                    Alto (cm) *
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    min={1}
                    placeholder="75"
                    value={userDimensions.height || ""}
                    onChange={(e) =>
                      setUserDimensions({
                        height: Number(e.target.value),
                      })
                    }
                    className={errors.height ? "border-destructive" : ""}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="depth" className="text-xs text-muted-foreground">
                    Profundidad (cm) *
                  </Label>
                  <Input
                    id="depth"
                    type="number"
                    min={1}
                    placeholder="55"
                    value={userDimensions.depth || ""}
                    onChange={(e) =>
                      setUserDimensions({
                        depth: Number(e.target.value),
                      })
                    }
                    className={errors.depth ? "border-destructive" : ""}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="seatHeight" className="text-xs text-muted-foreground">
                    Alt. Asiento (cm)
                  </Label>
                  <Input
                    id="seatHeight"
                    type="number"
                    min={0}
                    placeholder="45"
                    value={userDimensions.seatHeight || ""}
                    onChange={(e) =>
                      setUserDimensions({
                        seatHeight: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Brand & Product Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="brand" className="text-xs text-muted-foreground">
                  Marca
                </Label>
                <Input
                  id="brand"
                  placeholder="VIVA MOBILI"
                  value={userBrand}
                  onChange={(e) => setUserBrand(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="productName" className="text-xs text-muted-foreground">
                  Nombre del producto
                </Label>
                <Input
                  id="productName"
                  placeholder="Opcional"
                  value={userProductName}
                  onChange={(e) => setUserProductName(e.target.value)}
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              size="lg"
              className="w-full text-base font-semibold h-12 gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Generar Ficha Técnica
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
