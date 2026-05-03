"use client";

import { useCallback, useMemo, useState } from "react";
import { useMobiStore, type ExtraElement } from "@/store/mobi-store";
import { getFieldLabels } from "@/lib/ficha-layouts";
import FichaCanvas from "./ficha-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Eye,
  Download,
  Plus,
  Trash2,
  Paperclip,
  Type,
  Stamp,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

export default function EditingPhase() {
  const setPhase = useMobiStore((s) => s.setPhase);
  const editedData = useMobiStore((s) => s.editedData);
  const updateField = useMobiStore((s) => s.updateField);
  const extras = useMobiStore((s) => s.extras);
  const addExtra = useMobiStore((s) => s.addExtra);
  const removeExtra = useMobiStore((s) => s.removeExtra);
  const furnitureData = useMobiStore((s) => s.furnitureData);
  const fichaLayout = useMobiStore((s) => s.fichaLayout);

  const [scale, setScale] = useState(100);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [newAnnotation, setNewAnnotation] = useState("");
  const [jsCopied, setJsCopied] = useState(false);

  const labels = useMemo(() => getFieldLabels(), []);

  const handleUpdateAnnotation = useCallback(
    (index: number, value: string) => {
      if (!editedData) return;
      const current = [...(editedData.annotations ?? [])];
      current[index] = value;
      updateField("annotations", current);
    },
    [editedData, updateField]
  );

  const handleDeleteAnnotation = useCallback(
    (index: number) => {
      if (!editedData) return;
      const current = [...(editedData.annotations ?? [])];
      current.splice(index, 1);
      updateField("annotations", current);
    },
    [editedData, updateField]
  );

  const handleAddAnnotation = useCallback(() => {
    if (!editedData || !newAnnotation.trim()) return;
    const current = [...(editedData.annotations ?? []), newAnnotation.trim()];
    updateField("annotations", current);
    setNewAnnotation("");
  }, [editedData, newAnnotation, updateField]);

  const handleAddExtra = useCallback(
    (type: ExtraElement["type"]) => {
      const id = `extra-${Date.now()}`;
      const defaults: Omit<ExtraElement, "id" | "type"> = {
        data: type === "text" ? "Texto nuevo" : "",
        x: 100,
        y: 100,
        w: 150,
        h: type === "text" ? 40 : 120,
        fontSize: 16,
      };
      addExtra({ id, type, ...defaults });
      toast.success("Elemento añadido al lienzo");
    },
    [addExtra]
  );

  const handleImageExtraUpload = useCallback(
    (extraId: string) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          useMobiStore.getState().updateExtra(extraId, { data: result });
        };
        reader.readAsDataURL(file);
      };
      input.click();
    },
    []
  );

  // Generate JS output
  const jsOutput = useMemo(() => {
    if (!editedData) return "";
    return JSON.stringify(
      {
        ...editedData,
        extras: extras.length > 0 ? extras : undefined,
      },
      null,
      2
    );
  }, [editedData, extras]);

  const handleCopyJs = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsOutput);
      setJsCopied(true);
      toast.success("JS copiado al portapapeles");
      setTimeout(() => setJsCopied(false), 2000);
    } catch {
      toast.error("Error al copiar");
    }
  }, [jsOutput]);

  if (!editedData || !fichaLayout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Sin datos para editar</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPhase("review")}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-bold">
              <span className="text-primary">Mobili</span>{" "}
              <span className="text-muted-foreground font-normal text-sm">
                — Editor de Ficha Técnica
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPhase("export")}
              className="gap-1.5"
            >
              <Eye className="h-4 w-4" />
              Vista Previa
            </Button>
            <Button
              size="sm"
              onClick={() => setPhase("export")}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left: Canvas */}
        <div className="flex-1 p-4 flex flex-col items-center overflow-auto bg-muted/10">
          {/* Scale control */}
          <div className="w-full max-w-2xl mb-3 flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-12 text-right">
              {scale}%
            </span>
            <Slider
              value={[scale]}
              min={25}
              max={150}
              step={5}
              onValueChange={([v]) => setScale(v)}
              className="flex-1"
            />
          </div>

          {/* Canvas area */}
          <div
            className="w-full max-w-2xl origin-top transition-transform duration-200"
            style={{ transform: `scale(${scale / 100})` }}
          >
            <FichaCanvas
              scale={scale}
              onScaleChange={setScale}
              activeFieldId={activeFieldId}
              onFieldClick={setActiveFieldId}
            />
          </div>
        </div>

        {/* Right: Editing panel */}
        <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border/50 bg-background">
          <ScrollArea className="h-[calc(100vh-3.5rem)]">
            <div className="p-4 space-y-5">
              {/* ── Información ── */}
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Información
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{labels["f-productType"]}</Label>
                    <Input
                      value={editedData.productType ?? ""}
                      onChange={(e) => updateField("productType", e.target.value)}
                      onFocus={() => setActiveFieldId("f-productType")}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{labels["f-style"]}</Label>
                    <Input
                      value={editedData.style ?? ""}
                      onChange={(e) => updateField("style", e.target.value)}
                      onFocus={() => setActiveFieldId("f-style")}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{labels["f-material"]}</Label>
                    <Input
                      value={editedData.material?.main ?? ""}
                      onChange={(e) => updateField("material.main", e.target.value)}
                      onFocus={() => setActiveFieldId("f-material")}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{labels["f-finish"]}</Label>
                    <Input
                      value={editedData.finish ?? ""}
                      onChange={(e) => updateField("finish", e.target.value)}
                      onFocus={() => setActiveFieldId("f-finish")}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{labels["f-feature"]}</Label>
                    <Input
                      value={editedData.feature ?? ""}
                      onChange={(e) => updateField("feature", e.target.value)}
                      onFocus={() => setActiveFieldId("f-feature")}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </section>

              <Separator />

              {/* ── Dimensiones ── */}
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Dimensiones
                </h3>
                <div className="space-y-3">
                  {(
                    [
                      { key: "width", label: labels["f-width"], unit: "cm" },
                      { key: "height", label: labels["f-height"], unit: "cm" },
                      { key: "depth", label: labels["f-depth"], unit: "cm" },
                      {
                        key: "seatHeight",
                        label: labels["f-seatHeight"],
                        unit: "cm",
                      },
                      { key: "weight", label: labels["f-weight"], unit: "kg" },
                    ] as const
                  ).map(({ key, label, unit }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={
                            String(
                              (editedData.dimensions as unknown as Record<string, unknown>)?.[
                                key
                              ] ?? ""
                            )
                          }
                          onChange={(e) =>
                            updateField(
                              `dimensions.${key}`,
                              Number(e.target.value) || 0
                            )
                          }
                          onFocus={() => setActiveFieldId(`f-${key}`)}
                          className="h-8 text-sm"
                        />
                        <span className="text-xs text-muted-foreground w-6">
                          {unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <Separator />

              {/* ── Anotaciones ── */}
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Anotaciones
                </h3>
                <div className="space-y-2">
                  {(editedData.annotations ?? []).map((ann, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5">
                        {["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩"][index] ?? `${index + 1}.`}
                      </span>
                      <Input
                        value={ann}
                        onChange={(e) =>
                          handleUpdateAnnotation(index, e.target.value)
                        }
                        className="h-8 text-sm flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={() => handleDeleteAnnotation(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      value={newAnnotation}
                      onChange={(e) => setNewAnnotation(e.target.value)}
                      placeholder="Nueva anotación..."
                      className="h-8 text-sm flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddAnnotation();
                      }}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={handleAddAnnotation}
                      disabled={!newAnnotation.trim()}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </section>

              <Separator />

              {/* ── Colores ── */}
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Colores
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Color primario</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editedData.colorPalette?.primary ?? "#8B6914"}
                        onChange={(e) =>
                          updateField("colorPalette.primary", e.target.value)
                        }
                        className="h-8 w-8 rounded border border-border cursor-pointer"
                      />
                      <Input
                        value={editedData.colorPalette?.primaryName ?? ""}
                        onChange={(e) =>
                          updateField("colorPalette.primaryName", e.target.value)
                        }
                        placeholder="Nombre del color"
                        className="h-8 text-sm flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Color secundario</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editedData.colorPalette?.secondary ?? "#D4C5A9"}
                        onChange={(e) =>
                          updateField("colorPalette.secondary", e.target.value)
                        }
                        className="h-8 w-8 rounded border border-border cursor-pointer"
                      />
                      <Input
                        value={editedData.colorPalette?.secondaryName ?? ""}
                        onChange={(e) =>
                          updateField(
                            "colorPalette.secondaryName",
                            e.target.value
                          )
                        }
                        placeholder="Nombre del color"
                        className="h-8 text-sm flex-1"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* ── Extras ── */}
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Extras
                </h3>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={() => handleAddExtra("logo")}
                  >
                    <Paperclip className="h-3 w-3" />
                    Logo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={() => handleAddExtra("stamp")}
                  >
                    <Stamp className="h-3 w-3" />
                    Sello
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={() => handleAddExtra("image")}
                  >
                    🖼️ Imagen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    onClick={() => handleAddExtra("text")}
                  >
                    <Type className="h-3 w-3" />
                    Texto
                  </Button>
                </div>

                {/* Existing extras */}
                {extras.length > 0 && (
                  <div className="space-y-2">
                    {extras.map((extra) => (
                      <div
                        key={extra.id}
                        className="flex items-center gap-2 p-2 rounded border border-border/50 bg-muted/30"
                      >
                        <span className="text-xs capitalize w-12">
                          {extra.type === "logo"
                            ? "📎"
                            : extra.type === "stamp"
                              ? "🔒"
                              : extra.type === "image"
                                ? "🖼️"
                                : "✏️"}
                        </span>
                        {extra.type === "text" ? (
                          <Input
                            value={extra.data}
                            onChange={(e) =>
                              useMobiStore
                                .getState()
                                .updateExtra(extra.id, { data: e.target.value })
                            }
                            className="h-7 text-xs flex-1"
                          />
                        ) : extra.type === "image" || extra.type === "logo" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 flex-1"
                            onClick={() => handleImageExtraUpload(extra.id)}
                          >
                            Subir imagen
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground flex-1">
                            Sello de aprobación
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeExtra(extra.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <Separator />

              {/* ── JS Output ── */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Salida JS
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1"
                    onClick={handleCopyJs}
                  >
                    <Copy className="h-3 w-3" />
                    {jsCopied ? "Copiado" : "Copiar JS"}
                  </Button>
                </div>
                <Textarea
                  readOnly
                  value={jsOutput}
                  className="font-mono text-xs h-40 resize-none"
                />
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
