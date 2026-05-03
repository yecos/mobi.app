"use client";

import { Package } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-5">
        <Package className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <h3 className="text-base font-medium mb-2">Selecciona un mueble</h3>
      <p className="text-sm text-muted-foreground max-w-[250px]">
        Haz clic en cualquier pieza del catálogo para ver sus detalles y la
        vista 3D interactiva
      </p>
    </div>
  );
}
