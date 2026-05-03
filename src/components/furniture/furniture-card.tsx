"use client";

import { Badge } from "@/components/ui/badge";
import type { Furniture } from "@/types/furniture";
import { useDetailStore } from "@/store/detail-store";
import { Package } from "lucide-react";

interface FurnitureCardProps {
  furniture: Furniture;
}

export default function FurnitureCard({ furniture }: FurnitureCardProps) {
  const { selectFurniture } = useDetailStore();

  return (
    <button
      onClick={() => selectFurniture(furniture)}
      className="group relative w-full text-left rounded-lg border border-border/50 bg-card hover:bg-accent/50 transition-all duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring/40"
    >
      {/* Thumbnail area */}
      <div className="relative aspect-[4/3] bg-muted/30 flex items-center justify-center overflow-hidden">
        <div className="flex items-center justify-center w-full h-full">
          <Package className="w-12 h-12 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-300" />
        </div>

        {/* "Nuevo" badge */}
        {furniture.isNew && (
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 text-[10px] font-medium tracking-wider uppercase bg-foreground text-background border-0 px-2 py-0.5"
          >
            Nuevo
          </Badge>
        )}

        {/* Sale indicator */}
        {furniture.salePrice && (
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 text-[10px] font-medium tracking-wider uppercase bg-amber-600 text-white border-0 px-2 py-0.5"
          >
            Oferta
          </Badge>
        )}
      </div>

      {/* Card content */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm leading-tight truncate">
            {furniture.name}
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold">
              ${furniture.salePrice ?? furniture.basePrice}
            </span>
            {furniture.salePrice && (
              <span className="text-xs text-muted-foreground line-through">
                ${furniture.basePrice}
              </span>
            )}
          </div>

          {/* Variant color dots */}
          <div className="flex items-center gap-1">
            {furniture.variants.slice(0, 4).map((variant) => (
              <span
                key={variant.id}
                className="w-3 h-3 rounded-full border border-border/60"
                style={{ backgroundColor: variant.colorHex }}
                title={variant.name}
              />
            ))}
            {furniture.variants.length > 4 && (
              <span className="text-[10px] text-muted-foreground">
                +{furniture.variants.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Category label */}
        <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wider">
          {furniture.category.name}
        </p>
      </div>
    </button>
  );
}
