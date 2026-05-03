"use client";

import { useMobiStore } from "@/store/mobi-store";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const steps = [
  { key: "Analizando imagen...", icon: "🔍" },
  { key: "Generando ficha técnica...", icon: "🎨" },
  { key: "Detectando posiciones...", icon: "📐" },
  { key: "Preparando editor...", icon: "✨" },
];

export default function GeneratingPhase() {
  const generatingStep = useMobiStore((s) => s.generatingStep);
  const error = useMobiStore((s) => s.error);

  const currentStepIndex = steps.findIndex((s) => s.key === generatingStep);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mx-auto w-16 h-16 rounded-full border-4 border-muted border-t-primary"
        />
        <div>
          <h2 className="text-2xl font-bold">Generando ficha técnica</h2>
          <p className="text-muted-foreground mt-1 text-sm">Esto puede tomar unos segundos...</p>
        </div>
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isActive = step.key === generatingStep;
            const isCompleted = currentStepIndex > index;
            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-300 ${
                  isActive ? "border-primary/50 bg-primary/10 text-primary"
                    : isCompleted ? "border-green-500/30 bg-green-500/10 text-green-400"
                    : "border-transparent bg-muted/30 text-muted-foreground/50"
                }`}
              >
                <span className="text-lg">{step.icon}</span>
                <span className="text-sm font-medium flex-1 text-left">{step.key}</span>
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </motion.div>
                  )}
                  {isCompleted && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-400">✓</motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-destructive text-sm bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            {error}
          </motion.div>
        )}
      </div>
    </div>
  );
}
