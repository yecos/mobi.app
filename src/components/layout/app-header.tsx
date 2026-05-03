"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "./theme-toggle";
import SortDropdown from "@/components/furniture/sort-dropdown";
import { useFurnitureStore } from "@/store/furniture-store";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState, useCallback } from "react";

interface AppHeaderProps {
  onFilterToggle: () => void;
  isFilterOpen: boolean;
}

export default function AppHeader({
  onFilterToggle,
  isFilterOpen,
}: AppHeaderProps) {
  const { filters, setSearch } = useFurnitureStore();
  const [localSearch, setLocalSearch] = useState(filters.search);

  const handleSearch = useCallback(
    (value: string) => {
      setLocalSearch(value);
      setSearch(value);
    },
    [setSearch]
  );

  const clearSearch = useCallback(() => {
    setLocalSearch("");
    setSearch("");
  }, [setSearch]);

  const activeFilterCount =
    (filters.categoryId ? 1 : 0) +
    filters.tags.length +
    (filters.priceMin !== null || filters.priceMax !== null ? 1 : 0) +
    (filters.material !== null ? 1 : 0);

  return (
    <header className="h-16 border-b border-border/40 flex items-center gap-3 px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <h1 className="text-lg font-bold tracking-tight">Mobili</h1>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-auto relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={localSearch}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar muebles..."
          className="h-8 text-xs pl-8 pr-8 border-border/40 bg-muted/20"
        />
        {localSearch && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <SortDropdown />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 relative"
          onClick={onFilterToggle}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-foreground text-background border-0">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        <ThemeToggle />
      </div>
    </header>
  );
}
