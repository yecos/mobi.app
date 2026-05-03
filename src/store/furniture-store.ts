import { create } from "zustand";
import type { FilterState, SortOption, Category } from "@/types/furniture";

interface FurnitureStore {
  // Filters
  filters: FilterState;
  setSearch: (search: string) => void;
  setCategory: (categoryId: string | null) => void;
  setTags: (tags: string[]) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setMaterial: (material: string | null) => void;
  setSort: (sort: SortOption) => void;
  resetFilters: () => void;

  // Categories cache
  categories: Category[];
  setCategories: (categories: Category[]) => void;

  // All available tags
  availableTags: string[];
  setAvailableTags: (tags: string[]) => void;

  // All available materials
  availableMaterials: string[];
  setAvailableMaterials: (materials: string[]) => void;
}

const defaultFilters: FilterState = {
  categoryId: null,
  tags: [],
  priceMin: null,
  priceMax: null,
  material: null,
  search: "",
  sort: "newest",
};

export const useFurnitureStore = create<FurnitureStore>((set) => ({
  filters: { ...defaultFilters },
  setSearch: (search) =>
    set((state) => ({ filters: { ...state.filters, search } })),
  setCategory: (categoryId) =>
    set((state) => ({ filters: { ...state.filters, categoryId } })),
  setTags: (tags) =>
    set((state) => ({ filters: { ...state.filters, tags } })),
  setPriceRange: (priceMin, priceMax) =>
    set((state) => ({ filters: { ...state.filters, priceMin, priceMax } })),
  setMaterial: (material) =>
    set((state) => ({ filters: { ...state.filters, material } })),
  setSort: (sort) =>
    set((state) => ({ filters: { ...state.filters, sort } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),

  categories: [],
  setCategories: (categories) => set({ categories }),

  availableTags: [],
  setAvailableTags: (availableTags) => set({ availableTags }),

  availableMaterials: [],
  setAvailableMaterials: (availableMaterials) => set({ availableMaterials }),
}));
