import { create } from "zustand";
import type { Furniture } from "@/types/furniture";

interface DetailStore {
  // Selected furniture for detail view
  selectedFurniture: Furniture | null;
  selectedVariantId: string | null;
  isDetailOpen: boolean;

  selectFurniture: (furniture: Furniture) => void;
  closeDetail: () => void;
  selectVariant: (variantId: string) => void;
}

export const useDetailStore = create<DetailStore>((set) => ({
  selectedFurniture: null,
  selectedVariantId: null,
  isDetailOpen: false,

  selectFurniture: (furniture) =>
    set({
      selectedFurniture: furniture,
      selectedVariantId: furniture.variants[0]?.id ?? null,
      isDetailOpen: true,
    }),

  closeDetail: () =>
    set({
      selectedFurniture: null,
      selectedVariantId: null,
      isDetailOpen: false,
    }),

  selectVariant: (variantId) => set({ selectedVariantId: variantId }),
}));
