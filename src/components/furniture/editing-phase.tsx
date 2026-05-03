"use client";

import { useMemo, useState } from "react";
import { useMobiStore, type TextRegion } from "@/store/mobi-store";
import FichaCanvas from "./ficha-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Download, ZoomIn, ZoomOut, Type } from "lucide-react";
import { toast } from "sonner";

export default function EditingPhase() {
  const setPhase = useMobiStore((s) => s.setPhase);
  const editedRegions = useMobiStore((s) => s.editedRegions);
  const activeFieldId = useMobiStore((s) => s.activeFieldId);
  const setActiveFieldId = useMobiStore((s) => s.setActiveFieldId);
  const updateRegion = useMobiStore((s) => s.updateRegion);
  const scale = useMobiStore((s) => s.scale);
  const setScale = useMobiStore((s) => s.setScale);
  const detectionResult = useMobiStore((s) => s.detectionResult);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredRegions = useMemo(() => {
    if (!searchTerm.trim()) return editedRegions;
    const lower = searchTerm.toLowerCase();
    return editedRegions.filter(
      (r) => r.text.toLowerCase().includes(lower) || r.id.toLowerCase().includes(lower)
    );
  }, [editedRegions, searchTerm]);

  const activeRegion = useMemo(
    () => editedRegions.find((r) => r.id === activeFieldId) ?? null,
    [editedRegions, activeFieldId]
  );

  if (!detectionResult || editedRegions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Sin datos para editar</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setPhase("input")} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Volver
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-bold">
              <span className="text-primary">Mobili</span>{" "}
              <span className="text-muted-foreground font-normal text-sm">— Editor de Texto</span>
            </h1>
          </div>
          <Button size="sm" onClick={() => setPhase("export")} className="gap-1.5">
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Canvas */}
        <div className="flex-1 p-4 flex flex-col items-center overflow-auto bg-muted/10">
          <div className="w-full max-w-2xl mb-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(Math.max(25, scale - 10))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Slider value={[scale]} min={25} max={200} step={5} onValueChange={([v]) => setScale(v)} className="flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setScale(Math.min(200, scale + 10))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-right">{scale}%</span>
          </div>
          <div className="w-full max-w-2xl origin-top transition-transform duration-200">
            <FichaCanvas inlineEditing={true} />
          </div>
          <p className="text-xs text-muted-foreground mt-3">{editedRegions.length} campos de texto detectados</p>
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border/50 bg-background">
          <ScrollArea className="h-[calc(100vh-3.5rem)]">
            <div className="p-4 space-y-5">
              {activeRegion && (
                <section className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Campo activo</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Texto</Label>
                      <Input value={activeRegion.text} onChange={(e) => updateRegion(activeRegion.id, { text: e.target.value })} className="h-8 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Tamaño (px)</Label>
                        <Input type="number" value={activeRegion.fontSize} onChange={(e) => updateRegion(activeRegion.id, { fontSize: Number(e.target.value) || 12 })} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Color</Label>
                        <div className="flex items-center gap-1">
                          <input type="color" value={activeRegion.color} onChange={(e) => updateRegion(activeRegion.id, { color: e.target.value })} className="h-8 w-8 rounded border border-border cursor-pointer" />
                          <Input value={activeRegion.color} onChange={(e) => updateRegion(activeRegion.id, { color: e.target.value })} className="h-8 text-xs flex-1" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Negrita</Label>
                      <button onClick={() => updateRegion(activeRegion.id, { bold: !activeRegion.bold })} className={`px-2 py-1 text-xs rounded border transition-colors ${activeRegion.bold ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border hover:bg-muted/80"}`}>B</button>
                    </div>
                  </div>
                </section>
              )}
              <Separator />
              <Input placeholder="Buscar texto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-8 text-sm" />
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Campos ({filteredRegions.length})</h3>
                <div className="space-y-1.5">
                  {filteredRegions.map((region) => (
                    <RegionListItem key={region.id} region={region} isActive={activeFieldId === region.id} onClick={() => setActiveFieldId(region.id)} onUpdate={(updates) => updateRegion(region.id, updates)} />
                  ))}
                </div>
              </section>
              <Separator />
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Acciones</h3>
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => { const original = detectionResult.regions; useMobiStore.getState().setEditedRegions(original.map((r) => ({ ...r }))); toast.success("Campos restaurados"); }}>Restaurar texto original</Button>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function RegionListItem({ region, isActive, onClick, onUpdate }: { region: TextRegion; isActive: boolean; onClick: () => void; onUpdate: (updates: Partial<TextRegion>) => void }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all text-sm ${isActive ? "bg-primary/10 border border-primary/30 text-primary" : "hover:bg-muted/50 border border-transparent"}`}>
      <span className="w-3 h-3 rounded-sm flex-shrink-0 border border-border/50" style={{ backgroundColor: region.color }} />
      <Input value={region.text} onChange={(e) => onUpdate({ text: e.target.value })} onClick={(e) => e.stopPropagation()} className={`h-6 text-xs flex-1 border-none bg-transparent focus:bg-background p-0 px-1 ${isActive ? "text-primary" : ""}`} />
      <span className="text-[10px] text-muted-foreground flex-shrink-0">{region.fontSize}px</span>
    </div>
  );
}
