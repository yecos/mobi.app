"use client";

import { useMobiStore } from "@/store/mobi-store";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, ImageIcon } from "lucide-react";

export default function ReviewPhase() {
  const referenceImage = useMobiStore((s) => s.referenceImage);
  const furnitureData = useMobiStore((s) => s.furnitureData);
  const gridFields = useMobiStore((s) => s.gridFields);
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
            La IA generó tu ficha y detectó{" "}
            <strong>{gridFields.length} campos editables</strong>. En el editor
            podrás modificar textos y valores — las cajas editarás se
            superpondrán sobre el texto original.
          </p>
          {furnitureData && (
            <p className="text-xs text-muted-foreground">
              {furnitureData.productType} • {furnitureData.material.main} •{" "}
              {furnitureData.style}
            </p>
          )}
        </motion.div>

        {/* Generated image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-md w-full space-y-2"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <ImageIcon className="h-4 w-4 text-primary" />
            Ficha generada por IA
          </div>
          <div className="rounded-xl border border-border/50 overflow-hidden bg-muted/30">
            {referenceImage ? (
              <img
                src={referenceImage}
                alt="Ficha técnica generada"
                className="w-full h-auto"
              />
            ) : (
              <div className="aspect-[3/4] flex items-center justify-center text-muted-foreground text-sm">
                Sin imagen
              </div>
            )}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
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
