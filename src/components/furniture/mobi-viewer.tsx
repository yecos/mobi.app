"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Sun,
  Moon,
  Ruler,
  Trash2,
  Upload,
  Box,
  RulerDimensionLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { useMobiStore } from "@/store/mobi-store";
import { toast } from "sonner";
import UploadZone from "./upload-zone";
import SpecEditor from "./spec-editor";

// Dynamic imports for Three.js components (SSR disabled)
const ModelViewer = dynamic(() => import("./model-viewer"), { ssr: false });
const OrthoViews = dynamic(() => import("./ortho-views"), { ssr: false });

export default function MobiViewer() {
  const {
    isMeasuring,
    measurements,
    setMeasuring,
    clearMeasurements,
    fileUrl,
    fileType,
  } = useMobiStore();
  const { theme, setTheme } = useTheme();

  const handleAddMeasure = useCallback(() => {
    if (isMeasuring) {
      setMeasuring(false);
      toast.info("Medición cancelada");
    } else {
      setMeasuring(true);
      toast.info("Modo medición activado", {
        description: "Haz clic en dos puntos del modelo para medir la distancia.",
      });
    }
  }, [isMeasuring, setMeasuring]);

  const handleClearMeasures = useCallback(() => {
    clearMeasurements();
    toast.success("Mediciones eliminadas");
  }, [clearMeasurements]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-12 sm:h-14">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Box className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight">Mobili</h1>
                <p className="text-[9px] text-muted-foreground leading-tight hidden sm:block">
                  Visor Técnico de Mobiliario
                </p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isMeasuring ? "default" : "ghost"}
                      size="sm"
                      className={`h-8 gap-1.5 text-xs ${
                        isMeasuring ? "bg-red-500 hover:bg-red-600 text-white" : ""
                      }`}
                      onClick={handleAddMeasure}
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {isMeasuring ? "Cancelando..." : "Medir"}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Medir distancia entre dos puntos</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {measurements.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs text-muted-foreground"
                        onClick={handleClearMeasures}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Limpiar</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Eliminar todas las mediciones</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <Separator orientation="vertical" className="h-6" />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                      {theme === "dark" ? (
                        <Sun className="w-4 h-4" />
                      ) : (
                        <Moon className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Cambiar tema</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-3 sm:px-6 py-3 sm:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-3 sm:gap-4">
          {/* Left Column: 3D Viewer + Ortho Views */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Upload zone */}
            <UploadZone />

            {/* Main 3D Viewer */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <div className="h-[350px] sm:h-[450px] lg:h-[500px]">
                <ModelViewer />
              </div>

              {/* Viewer status badges */}
              <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                {!fileUrl && (
                  <Badge
                    variant="secondary"
                    className="bg-background/70 backdrop-blur-sm text-[10px] gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    Demo
                  </Badge>
                )}
                {fileType === "skp" && (
                  <Badge
                    variant="secondary"
                    className="bg-orange-500/15 text-orange-500 text-[10px] gap-1"
                  >
                    SKP — Sin vista previa
                  </Badge>
                )}
                {measurements.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-red-500/10 text-red-500 text-[10px] gap-1"
                  >
                    <Ruler className="w-3 h-3" />
                    {measurements.length}
                  </Badge>
                )}
              </div>
            </motion.div>

            {/* Orthographic Views */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <OrthoViews />
            </motion.div>
          </div>

          {/* Right Column: Spec Editor + Measurements */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Spec Editor */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <SpecEditor />
            </motion.div>

            {/* Measurements List */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="p-3 border-border/40 bg-card/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Mediciones</span>
                  </div>
                  {measurements.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {measurements.length}
                    </Badge>
                  )}
                </div>

                {measurements.length === 0 ? (
                  <div className="py-6 text-center">
                    <RulerDimensionLine className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Sin mediciones
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      Haz clic en &quot;Medir&quot; para añadir
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-48">
                    <div className="space-y-1.5">
                      {measurements.map((m, i) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span className="text-[11px] text-muted-foreground">
                              Medición {i + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold">
                              {m.distance.toFixed(1)} cm
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                useMobiStore
                                  .getState()
                                  .removeMeasurement(m.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-auto">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                <Box className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">
                Mobili — Visor Técnico de Mobiliario
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              Three.js • React Three Fiber • Next.js
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
