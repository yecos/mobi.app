"use client";

import dynamic from "next/dynamic";
import { useDetailStore } from "@/store/detail-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, RotateCw, ShoppingBag } from "lucide-react";
import VariantSelector from "./variant-selector";
import SpecsTable from "./specs-table";
import PriceDisplay from "./price-display";
import { useState } from "react";
import { toast } from "sonner";

const FurnitureViewer = dynamic(
  () => import("@/components/viewer/furniture-viewer"),
  { ssr: false }
);

export default function DetailPanel() {
  const { selectedFurniture, selectedVariantId, closeDetail } =
    useDetailStore();
  const [autoRotate, setAutoRotate] = useState(true);

  if (!selectedFurniture) return null;

  const selectedVariant = selectedFurniture.variants.find(
    (v) => v.id === selectedVariantId
  );
  const color = selectedVariant?.colorHex ?? "#C4A882";

  const handleAddToProject = () => {
    toast.success(
      `${selectedFurniture.name} agregado al proyecto`,
      {
        description: selectedVariant
          ? `Acabado: ${selectedVariant.name}`
          : undefined,
      }
    );
  };

  return (
    <ScrollArea className="h-[calc(100vh-64px)]">
      <div className="p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={closeDetail}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold leading-tight">
                {selectedFurniture.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedFurniture.category.name}
                {selectedFurniture.designer &&
                  ` · ${selectedFurniture.designer}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? "Detener rotación" : "Auto-rotar"}
          >
            <RotateCw
              className={`w-4 h-4 ${autoRotate ? "text-foreground" : "text-muted-foreground"}`}
            />
          </Button>
        </div>

        {/* 3D Viewer */}
        <div className="rounded-lg border border-border/30 overflow-hidden bg-muted/10">
          <FurnitureViewer
            categorySlug={selectedFurniture.category.slug}
            category={selectedFurniture.category}
            color={color}
            autoRotate={autoRotate}
          />
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {selectedFurniture.description}
        </p>

        {/* Tags */}
        {selectedFurniture.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedFurniture.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-[10px] font-normal tracking-wide"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        <Separator />

        {/* Variant selector */}
        <VariantSelector />

        <Separator />

        {/* Price */}
        <PriceDisplay furniture={selectedFurniture} />

        {/* CTA */}
        <Button
          className="w-full h-11 text-sm font-medium"
          onClick={handleAddToProject}
          disabled={!selectedFurniture.inStock}
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          {selectedFurniture.inStock
            ? "Agregar al proyecto"
            : "Agotado"}
        </Button>

        <Separator />

        {/* Specs */}
        <SpecsTable furniture={selectedFurniture} />
      </div>
    </ScrollArea>
  );
}
