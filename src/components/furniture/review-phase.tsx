"use client";

import { useMobiStore } from "@/store/mobi-store";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

/**
 * Review phase is no longer used in the main flow
 * (we go directly from generating → editing).
 * Kept for compatibility but redirects to editing.
 */
export default function ReviewPhase() {
  const setPhase = useMobiStore((s) => s.setPhase);
  const editedRegions = useMobiStore((s) => s.editedRegions);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-6">
      <h2 className="text-xl font-bold">Texto detectado</h2>
      <p className="text-muted-foreground text-sm">
        Se detectaron <strong>{editedRegions.length}</strong> campos de texto.
      </p>
      <Button onClick={() => setPhase("editing")} className="gap-2">
        Ir al Editor
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
