"use client";

import { useFurnitureStore } from "@/store/furniture-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, SlidersHorizontal } from "lucide-react";

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FilterPanel({ isOpen, onClose }: FilterPanelProps) {
  const {
    filters,
    categories,
    availableTags,
    setCategory,
    setTags,
    setPriceRange,
    setMaterial,
    resetFilters,
  } = useFurnitureStore();

  if (!isOpen) return null;

  const hasActiveFilters =
    filters.categoryId !== null ||
    filters.tags.length > 0 ||
    filters.priceMin !== null ||
    filters.priceMax !== null ||
    filters.material !== null;

  const toggleTag = (tag: string) => {
    if (filters.tags.includes(tag)) {
      setTags(filters.tags.filter((t) => t !== tag));
    } else {
      setTags([...filters.tags, tag]);
    }
  };

  return (
    <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-sm">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              <h3 className="text-sm font-semibold">Filtros</h3>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Categoría
            </h4>
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={filters.categoryId === null ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setCategory(null)}
              >
                Todas
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={filters.categoryId === cat.id ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    setCategory(filters.categoryId === cat.id ? null : cat.id)
                  }
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Price range */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Rango de precio
            </h4>
            <div className="px-1">
              <Slider
                value={[
                  filters.priceMin ?? 0,
                  filters.priceMax ?? 3000,
                ]}
                max={3000}
                step={50}
                onValueChange={([min, max]) => {
                  setPriceRange(
                    min === 0 ? null : min,
                    max === 3000 ? null : max
                  );
                }}
                className="mt-2"
              />
              <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground">
                <span>${filters.priceMin ?? 0}</span>
                <span>${filters.priceMax ?? 3000}+</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tags */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Estilo
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={filters.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer text-[11px] hover:bg-accent transition-colors"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Reset */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => {
                resetFilters();
                onClose();
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
