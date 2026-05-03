"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFurnitureStore } from "@/store/furniture-store";
import type { SortOption } from "@/types/furniture";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Novedades" },
  { value: "name-asc", label: "Nombre" },
  { value: "price-asc", label: "Precio (bajo a alto)" },
  { value: "price-desc", label: "Precio (alto a bajo)" },
];

export default function SortDropdown() {
  const { filters, setSort } = useFurnitureStore();

  return (
    <Select
      value={filters.sort}
      onValueChange={(value) => setSort(value as SortOption)}
    >
      <SelectTrigger className="w-[160px] h-8 text-xs border-border/50">
        <SelectValue placeholder="Ordenar" />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
