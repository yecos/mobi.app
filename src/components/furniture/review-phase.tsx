"use client";

import { useMobiStore } from "@/store/mobi-store";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, ImageIcon } from "lucide-react";

export default function ReviewPhase() {
  const referenceImage = useMobiStore((s) => s.referenceImage);
  const canvasImage = useMobiStore((s) => s.canvasImage);
  const furnitureData = useMobiStore((s) => s.furnitureData);
  const setPhase = useMobiStore((s) => s.setPhase);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold">
            <span className="text-primary">Mobili</span>{" "}
            <span className="text-muted-foreground font-normal text-sm">
              — Revisión
            </span>
          </h1>
          <Button onClick={() => setPhase("editing")} className="gap-2">
            Continuar al Editor
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-xl space-y-2"
        >
          <h2 className="text-xl sm:text-2xl font-bold">
            Tu ficha técnica está lista
          </h2>
          <p className="text-muted-foreground text-sm">
            La <strong>Imagen A</strong> es la ficha completa generada por IA
            con todo el texto. La <strong>Imagen B</strong> es la plantilla
            limpia que usarás como lienzo para editar en el editor.
          </p>
          {furnitureData && (
            <p className="text-xs text-muted-foreground">
              {furnitureData.productType} • {furnitureData.material.main} •{" "}
              {furnitureData.style}
            </p>
          )}
        </motion.div>

        {/* Side by side images */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl w-full">
          {/* Image A — Reference */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="h-4 w-4 text-primary" />
              Imagen A — Ficha Completa
            </div>
            <div className="rounded-xl border border-border/50 overflow-hidden bg-muted/30">
              {referenceImage ? (
                <img
                  src={referenceImage}
                  alt="Ficha completa con texto"
                  className="w-full h-auto"
                />
              ) : (
                <div className="aspect-[3/4] flex items-center justify-center text-muted-foreground text-sm">
                  Sin imagen
                </div>
              )}
            </div>
          </motion.div>

          {/* Image B — Canvas */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="h-4 w-4 text-primary" />
              Imagen B — Plantilla Limpia
            </div>
            <div className="rounded-xl border border-border/50 overflow-hidden bg-muted/30">
              {canvasImage ? (
                <img
                  src={canvasImage}
                  alt="Plantilla limpia sin texto"
                  className="w-full h-auto"
                />
              ) : (
                <div className="aspect-[3/4] flex items-center justify-center text-muted-foreground text-sm">
                  Sin imagen
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={() => setPhase("editing")}
            size="lg"
            className="gap-2 text-base"
          >
            Continuar al Editor
            <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
