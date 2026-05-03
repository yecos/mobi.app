"use client";

import { useCallback } from "react";
import { Code, Play, AlertTriangle, Palette, Ruler, Weight, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useMobiStore, type FurnitureSpecs } from "@/store/mobi-store";
import { toast } from "sonner";

export default function SpecEditor() {
  const { specCode, parsedSpecs, specsError, setSpecCode, setParsedSpecs, setSpecsError } =
    useMobiStore();

  const runSpec = useCallback(() => {
    try {
      // Wrap the code in parentheses to evaluate as expression
      const fn = new Function(`return (${specCode});`);
      const result = fn() as FurnitureSpecs;

      if (typeof result !== "object" || result === null) {
        setSpecsError("El resultado debe ser un objeto");
        setParsedSpecs(null);
        return;
      }

      setParsedSpecs(result);
      setSpecsError(null);
      toast.success("Especificaciones cargadas", {
        description: result.name
          ? `Modelo: ${result.name}`
          : "Objeto parseado correctamente",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setSpecsError(msg);
      setParsedSpecs(null);
    }
  }, [specCode, setSpecCode, setParsedSpecs, setSpecsError]);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Code editor header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Especificaciones JS</span>
        </div>
        <Button
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={runSpec}
        >
          <Play className="w-3 h-3" />
          Ejecutar
        </Button>
      </div>

      {/* Code textarea */}
      <div className="relative">
        <textarea
          value={specCode}
          onChange={(e) => setSpecCode(e.target.value)}
          className="w-full h-36 p-3 rounded-lg bg-muted/30 border border-border/40 text-xs font-mono text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all placeholder:text-muted-foreground/50"
          placeholder="Escribe las especificaciones en JS..."
          spellCheck={false}
        />
      </div>

      {/* Error display */}
      {specsError && (
        <Card className="p-2.5 border-red-500/30 bg-red-500/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-500 font-mono break-all">
              {specsError}
            </p>
          </div>
        </Card>
      )}

      {/* Parsed specs display */}
      {parsedSpecs && <ParsedSpecsCard specs={parsedSpecs} />}
    </div>
  );
}

function ParsedSpecsCard({ specs }: { specs: FurnitureSpecs }) {
  return (
    <Card className="p-3 border-border/40 bg-card/60">
      <ScrollArea className="max-h-72">
        <div className="space-y-3">
          {/* Name */}
          {specs.name && (
            <div>
              <h4 className="text-sm font-bold">{specs.name}</h4>
            </div>
          )}

          {/* Dimensions */}
          {specs.dimensions && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Dimensiones
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Ancho", value: specs.dimensions.width },
                  { label: "Prof.", value: specs.dimensions.depth },
                  { label: "Alto", value: specs.dimensions.height },
                ].map((dim) => (
                  <div
                    key={dim.label}
                    className="px-2 py-1.5 rounded-md bg-muted/30 text-center"
                  >
                    <p className="text-[10px] text-muted-foreground">
                      {dim.label}
                    </p>
                    <p className="text-xs font-semibold">
                      {dim.value} <span className="text-[10px] text-muted-foreground">cm</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weight */}
          {specs.weight != null && (
            <div className="flex items-center gap-3">
              <Weight className="w-3.5 h-3.5 text-muted-foreground" />
              <div>
                <span className="text-[10px] text-muted-foreground">Peso</span>
                <p className="text-xs font-semibold">
                  {specs.weight} <span className="text-[10px] text-muted-foreground">kg</span>
                </p>
              </div>
            </div>
          )}

          {/* Materials */}
          {specs.materials && specs.materials.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Package className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Materiales
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {specs.materials.map((mat, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-[10px] h-5"
                  >
                    {mat}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Finishes */}
          {specs.finishes && specs.finishes.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Acabados
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {specs.finishes.map((finish, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-4 rounded-full border border-border/40"
                      style={{ backgroundColor: finish.hex }}
                    />
                    <span className="text-[11px]">{finish.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other properties */}
          {Object.entries(specs)
            .filter(
              ([key]) =>
                !["name", "dimensions", "weight", "materials", "finishes"].includes(key)
            )
            .map(([key, value]) => (
              <div key={key}>
                <Separator className="mb-2" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground capitalize">
                    {key}
                  </span>
                  <span className="text-xs font-medium">
                    {typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
