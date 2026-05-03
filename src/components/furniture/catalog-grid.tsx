"use client";

import { useFurnitureStore } from "@/store/furniture-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import FurnitureCard from "./furniture-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Furniture } from "@/types/furniture";

interface CatalogGridProps {
  items: Furniture[];
  isLoading: boolean;
}

export default function CatalogGrid({ items, isLoading }: CatalogGridProps) {
  const { filters } = useFurnitureStore();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[4/3] rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <span className="text-2xl">🪑</span>
        </div>
        <h3 className="text-sm font-medium mb-1">Sin resultados</h3>
        <p className="text-xs text-muted-foreground max-w-[200px]">
          {filters.search
            ? `No encontramos muebles para "${filters.search}"`
            : "No hay muebles con los filtros seleccionados"}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-64px)]">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
        {items.map((furniture) => (
          <FurnitureCard key={furniture.id} furniture={furniture} />
        ))}
      </div>
      <div className="h-4" />
    </ScrollArea>
  );
}
