"use client";

import { useDetailStore } from "@/store/detail-store";
import type { Furniture } from "@/types/furniture";

interface PriceDisplayProps {
  furniture: Furniture;
}

export default function PriceDisplay({ furniture }: PriceDisplayProps) {
  const { selectedVariantId } = useDetailStore();

  const selectedVariant = furniture.variants.find(
    (v) => v.id === selectedVariantId
  );
  const priceOffset = selectedVariant?.priceOffset ?? 0;
  const currentPrice = furniture.basePrice + priceOffset;
  const currentSalePrice = furniture.salePrice
    ? furniture.salePrice + priceOffset
    : null;

  const displayPrice = currentSalePrice ?? currentPrice;
  const hasSale = currentSalePrice !== null;

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold tracking-tight">
        ${displayPrice.toLocaleString()}
      </span>
      {hasSale && (
        <span className="text-sm text-muted-foreground line-through">
          ${currentPrice.toLocaleString()}
        </span>
      )}
      {hasSale && (
        <span className="text-xs font-medium text-amber-600 dark:text-amber-500">
          -{Math.round((1 - currentSalePrice! / currentPrice) * 100)}%
        </span>
      )}
    </div>
  );
}
