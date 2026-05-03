"use client";

import { useDetailStore } from "@/store/detail-store";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export default function VariantSelector() {
  const { selectedFurniture, selectedVariantId, selectVariant } =
    useDetailStore();

  if (!selectedFurniture) return null;

  const { variants } = selectedFurniture;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Acabado
      </h4>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = selectedVariantId === variant.id;
          return (
            <button
              key={variant.id}
              onClick={() => selectVariant(variant.id)}
              className={cn(
                "group relative flex items-center gap-2 px-3 py-2 rounded-md border text-xs transition-all",
                isSelected
                  ? "border-foreground bg-foreground/5"
                  : "border-border/50 hover:border-border bg-transparent"
              )}
            >
              {/* Color swatch */}
              <span
                className="relative w-5 h-5 rounded-full border border-border/60 flex-shrink-0"
                style={{ backgroundColor: variant.colorHex }}
              >
                {isSelected && (
                  <Check
                    className="absolute inset-0 w-5 h-5 p-0.5 text-white drop-shadow-sm"
                    strokeWidth={3}
                  />
                )}
              </span>
              <span className={isSelected ? "font-medium" : "text-muted-foreground"}>
                {variant.name}
              </span>
              {variant.priceOffset !== 0 && (
                <span className="text-muted-foreground/60">
                  ({variant.priceOffset > 0 ? "+" : ""}${variant.priceOffset})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
