"use client";

import { useCallback, useRef, useState } from "react";
import { useMobiStore, type InputMode, type FurnitureData, type GridField } from "@/store/mobi-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import {
  Upload,
  Sparkles,
  Image as ImageIcon,
  X,
  Ruler,
  FileJson,
  PenTool,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

// ─── Shared file-to-base64 helper ──────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Mode Toggle ───────────────────────────────────────
function ModeToggle({
  mode,
  onChange,
}: {
  mode: InputMode;
  onChange: (m: InputMode) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border/50 p-1 bg-muted/30">
      <button
        onClick={() => onChange("ai")}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
          ${
            mode === "ai"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }
        `}
      >
        <Wand2 className="h-4 w-4" />
        Generar con IA
      </button>
      <button
        onClick={() => onChange("manual")}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
          ${
            mode === "manual"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }
        `}
      >
        <PenTool className="h-4 w-4" />
        Importar Manual
      </button>
    </div>
  );
}

// ─── Fallback fields (when grid detection returns nothing) ──
function createFallbackFields(data: FurnitureData): GridField[] {
  const fields: GridField[] = [];
  let row = 2;

  const addField = (id: string, label: string, type: "text" | "number" = "text") => {
    fields.push({
      id,
      label,
      cells: `A${row}:C${row}`,
      xPct: 0, yPct: (row - 1) / 24 * 100,
      wPct: 37.5, hPct: 1 / 24 * 100,
      x: 0, y: (row - 1) * 64,
      w: 384, h: 64,
      fontSize: "medium",
      bold: id === "brand",
      type,
    });
    row++;
  };

  addField("brand", data.brand || "VIVA MOBILI");
  addField("productType", data.productType);
  addField("f-style", data.style);
  addField("f-material", data.material?.main || "");
  addField("f-finish", data.finish);
  addField("f-feature", data.feature);
  addField("f-width", String(data.dimensions?.width || ""), "number");
  addField("f-height", String(data.dimensions?.height || ""), "number");
  addField("f-depth", String(data.dimensions?.depth || ""), "number");
  if (data.dimensions?.seatHeight) {
    addField("f-seatHeight", String(data.dimensions.seatHeight), "number");
  }
  addField("f-weight", String(data.weight || ""), "number");

  (data.annotations || []).forEach((ann, i) => {
    addField(`ann-${i + 1}`, ann);
  });

  return fields;
}

// ─── Image Uploader Slot ───────────────────────────────
function ImageSlot({
  label,
  description,
  image,
  onImageSet,
  onImageClear,
  error,
}: {
  label: string;
  description: string;
  image: string | null;
  onImageSet: (data: string) => void;
  onImageClear: () => void;
  error?: string;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        toast.error("Formato no soportado. Usa JPG, PNG o WebP.");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error("La imagen es demasiado grande. Máximo 20MB.");
        return;
      }
      const base64 = await fileToBase64(file);
      onImageSet(base64);
    },
    [onImageSet]
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

  if (image) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-border/50 bg-muted/30">
        <div className="flex items-center gap-3 p-3">
          <div className="h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
            <img
              src={image}
              alt={label}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Imagen cargada
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onImageClear}
            className="flex-shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all
          text-center
          ${
            isDragOver
              ? "border-primary bg-primary/5 scale-[1.01]"
              : error
                ? "border-destructive/50 bg-destructive/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          }
        `}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
        <p className="text-sm font-medium">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          JPG, PNG o WebP — máximo 20MB
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── AI Mode ───────────────────────────────────────────
function AIMode() {
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
    setGridFields,
    setSheetBgColor,
    setImgDimensions,
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
      // Step 1: Analyze photo + Generate ficha image IN PARALLEL
      setGeneratingStep("Analizando imagen y generando ficha...");

      const [analyzeRes, sheetRes] = await Promise.all([
        fetch("/api/analyze-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: uploadedImage,
            dimensions: userDimensions,
            brand: userBrand,
          }),
        }),
        // We'll generate the image after we get furniture data,
        // so for now just analyze
        Promise.resolve(null as Response | null),
      ]);

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
        seatHeight:
          userDimensions.seatHeight ||
          furnitureData.dimensions?.seatHeight ||
          null,
      };
      if (userProductName) {
        furnitureData.productName = userProductName;
      }

      setFurnitureData(furnitureData);

      // Step 2: Generate ficha image
      setGeneratingStep("Generando ficha técnica...");

      const sheetResponse = await fetch("/api/generate-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ furnitureData }),
      });

      if (!sheetResponse.ok) {
        const errData = await sheetResponse.json();
        throw new Error(errData.error || "Error al generar ficha");
      }

      const sheetData = await sheetResponse.json();
      setReferenceImage(sheetData.image);

      // Step 3: Detect positions with grid overlay
      setGeneratingStep("Detectando posiciones de texto...");

      const detectRes = await fetch("/api/detect-positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: sheetData.image }),
      });

      if (!detectRes.ok) {
        const errData = await detectRes.json();
        throw new Error(errData.error || "Error al detectar posiciones");
      }

      const detectData = await detectRes.json();

      // If no fields detected, try once more with lower grid
      let fields: GridField[] = detectData.fields || [];
      let bgColor = detectData.sheetBgColor || "#E5E5E5";
      let imgW = detectData.imgWidth || 1024;
      let imgH = detectData.imgHeight || 1536;

      if (fields.length === 0) {
        // Fallback: create basic fields from furniture data
        fields = createFallbackFields(furnitureData);
        bgColor = "#E5E5E5";
      }

      setSheetBgColor(bgColor);
      setImgDimensions(imgW, imgH);
      setGridFields(fields);

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
    setGridFields,
    setSheetBgColor,
    setImgDimensions,
  ]);

  const removeImage = useCallback(() => {
    setUploadedImage("", "");
  }, [setUploadedImage]);

  return (
    <div className="space-y-6">
      {/* Image Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Foto del mueble</Label>
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
                setUserDimensions({ width: Number(e.target.value) })
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
                setUserDimensions({ height: Number(e.target.value) })
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
                setUserDimensions({ depth: Number(e.target.value) })
              }
              className={errors.depth ? "border-destructive" : ""}
            />
          </div>
          <div className="space-y-1">
            <Label
              htmlFor="seatHeight"
              className="text-xs text-muted-foreground"
            >
              Alt. Asiento (cm)
            </Label>
            <Input
              id="seatHeight"
              type="number"
              min={0}
              placeholder="45"
              value={userDimensions.seatHeight || ""}
              onChange={(e) =>
                setUserDimensions({ seatHeight: Number(e.target.value) })
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
          <Label
            htmlFor="productName"
            className="text-xs text-muted-foreground"
          >
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
        Generar Ficha Técnica con IA
      </Button>
    </div>
  );
}

// ─── Manual Mode ───────────────────────────────────────
function ManualMode() {
  const {
    manualReferenceImage,
    manualJsData,
    setManualReferenceImage,
    setManualJsData,
    setPhase,
    setFurnitureData,
    setReferenceImage,
    setGridFields,
    setSheetBgColor,
    setImgDimensions,
    setGeneratingStep,
  } = useMobiStore();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const jsFileRef = useRef<HTMLInputElement>(null);

  const handleJsFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        setManualJsData(text);
        setErrors((prev) => ({ ...prev, js: "" }));
      } catch {
        toast.error("No se pudo leer el archivo JS/JSON");
      }
    },
    [setManualJsData]
  );

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!manualReferenceImage)
      newErrors.refImage = "Sube la ficha técnica (imagen con texto)";
    if (!manualJsData.trim()) newErrors.js = "Pega o sube el JS/JSON";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [manualReferenceImage, manualJsData]);

  const handleImport = useCallback(async () => {
    if (!validate()) {
      toast.error("Completa todos los campos requeridos");
      return;
    }

    try {
      // Parse JS/JSON data — supports multiple formats
      let parsed: FurnitureData;
      let jsStr = manualJsData.trim();

      // Remove JS single-line comments (but preserve URLs with //)
      jsStr = jsStr.replace(/(?<![:"'])\/\/.*$/gm, "");
      // Remove JS multi-line comments
      jsStr = jsStr.replace(/\/\*[\s\S]*?\*\//g, "");
      // Remove export keyword
      jsStr = jsStr.replace(/^export\s+/m, "");
      // Remove variable declarations: const data = , let x = , var foo =
      jsStr = jsStr.replace(/^(?:const|let|var)\s+\w+\s*=\s*/m, "");
      // Remove trailing semicolons
      jsStr = jsStr.replace(/;\s*$/, "");
      // Trim again
      jsStr = jsStr.trim();

      // Extract the JSON object
      const jsonMatch = jsStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No se encontró un objeto JSON válido en el texto");
      }

      let jsonStr = jsonMatch[0];

      // Quote unquoted property names: { key: or , key: → { "key": or , "key":
      // Only matches word characters before colon that aren't already quoted
      jsonStr = jsonStr.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

      // Convert single-quoted strings to double-quoted
      jsonStr = jsonStr.replace(/'([^']*)'/g, '"$1"');

      // Remove trailing commas before } or ] (invalid in strict JSON)
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");

      parsed = JSON.parse(jsonStr);

      // Validate minimum required fields
      if (!parsed.productType) {
        parsed.productType = "mueble";
      }
      if (!parsed.dimensions) {
        parsed.dimensions = { width: 0, height: 0, depth: 0 };
      }
      if (!parsed.annotations) parsed.annotations = [];
      if (!parsed.colorPalette) {
        parsed.colorPalette = {
          primary: "#8B6914",
          primaryName: "Madera",
          secondary: "#D4C5A9",
          secondaryName: "Beige",
          pearlGray: "#E5E5E5",
          darkGray: "#4A4A4A",
        };
      }
      if (!parsed.material) parsed.material = { main: "", details: [] };
      if (!parsed.renderViews) parsed.renderViews = ["front", "side", "top", "perspective"];

      // Set all data in the store
      setFurnitureData(parsed);
      setReferenceImage(manualReferenceImage);

      // Auto-detect positions using grid + VLM
      setPhase("generating");
      setGeneratingStep("Detectando posiciones de texto...");

      try {
        const detectRes = await fetch("/api/detect-positions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: manualReferenceImage }),
        });

        if (detectRes.ok) {
          const detectData = await detectRes.json();
          const fields: GridField[] = detectData.fields || [];
          if (fields.length > 0) {
            setSheetBgColor(detectData.sheetBgColor || "#E5E5E5");
            setImgDimensions(detectData.imgWidth || 1024, detectData.imgHeight || 1536);
            setGridFields(fields);
          } else {
            // Fallback to generated fields
            setGridFields(createFallbackFields(parsed));
            setSheetBgColor("#E5E5E5");
          }
        } else {
          // Fallback if detection fails
          setGridFields(createFallbackFields(parsed));
          setSheetBgColor("#E5E5E5");
        }
      } catch {
        // Fallback if detection fails
        setGridFields(createFallbackFields(parsed));
        setSheetBgColor("#E5E5E5");
      }

      setGeneratingStep(null);
      toast.success("Ficha importada correctamente");
      setPhase("editing");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al importar los datos";
      toast.error(message);
    }
  }, [
    validate,
    manualJsData,
    manualReferenceImage,
    setFurnitureData,
    setReferenceImage,
    setGridFields,
    setSheetBgColor,
    setImgDimensions,
    setPhase,
    setGeneratingStep,
  ]);

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-sm text-foreground">
          <strong>Modo Manual:</strong> Sube la imagen de la ficha técnica y el
          objeto JS con los datos. Las posiciones de texto se detectan
          automáticamente con IA. Podrás editar textos y valores.
        </p>
      </div>

      {/* Ficha image */}
      <ImageSlot
        label="Imagen de la ficha técnica"
        description="Arrastra la ficha completa con textos y números"
        image={manualReferenceImage}
        onImageSet={setManualReferenceImage}
        onImageClear={() => setManualReferenceImage(null)}
        error={errors.refImage}
      />

      {/* JS Data */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <FileJson className="h-4 w-4" />
          Datos JS / JSON
        </Label>
        <p className="text-xs text-muted-foreground">
          Pega el objeto JS o sube un archivo .json / .js con los datos de la
          ficha
        </p>
        <div className="flex gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => jsFileRef.current?.click()}
          >
            <Upload className="h-3 w-3" />
            Subir archivo
          </Button>
          <input
            ref={jsFileRef}
            type="file"
            accept=".json,.js,.txt"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleJsFile(file);
            }}
            className="hidden"
          />
          {manualJsData && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={() => setManualJsData("")}
            >
              <X className="h-3 w-3" />
              Limpiar
            </Button>
          )}
        </div>
        <Textarea
          value={manualJsData}
          onChange={(e) => {
            setManualJsData(e.target.value);
            setErrors((prev) => ({ ...prev, js: "" }));
          }}
          placeholder={`{\n  "productType": "silla",\n  "style": "escandinavo",\n  "material": { "main": "roble", "details": [] },\n  "finish": "mate",\n  "feature": "respaldo curvo",\n  "dimensions": { "width": 50, "height": 85, "depth": 52 },\n  "weight": 6,\n  "annotations": ["Madera maciza", "Acabado natural"],\n  "colorPalette": { "primary": "#8B6914", ... },\n  "brand": "VIVA MOBILI",\n  "productName": "Silla Nordic"\n}`}
          className="font-mono text-xs h-48 resize-none"
        />
        {errors.js && <p className="text-xs text-destructive">{errors.js}</p>}
      </div>

      {/* Import Button */}
      <Button
        onClick={handleImport}
        size="lg"
        className="w-full text-base font-semibold h-12 gap-2"
      >
        <PenTool className="h-5 w-5" />
        Importar y Editar
      </Button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────
export default function InputPhase() {
  const inputMode = useMobiStore((s) => s.inputMode);
  const setInputMode = useMobiStore((s) => s.setInputMode);

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
            {/* Mode Toggle */}
            <div className="flex justify-center">
              <ModeToggle mode={inputMode} onChange={setInputMode} />
            </div>

            {/* Mode Content */}
            {inputMode === "ai" ? <AIMode /> : <ManualMode />}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
