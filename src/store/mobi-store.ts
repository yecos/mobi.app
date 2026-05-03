import { create } from "zustand";

export interface FurnitureDimensions {
  width: number;
  height: number;
  depth: number;
  seatHeight?: number;
}

export interface FurnitureData {
  productType: string;
  style: string;
  material: {
    main: string;
    details: string[];
  };
  finish: string;
  feature: string;
  dimensions: FurnitureDimensions;
  weight: number;
  annotations: string[];
  colorPalette: {
    primary: string;
    primaryName: string;
    secondary: string;
    secondaryName: string;
    pearlGray: string;
    darkGray: string;
  };
  brand: string;
  productName: string;
  renderViews: string[];
}

export interface GridField {
  id: string;
  cells: string;
  text: string;
  fontSize: number;
  type: "text" | "number" | "label" | "color";
  editable: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GridPositions {
  sheetBgColor: string;
  fields: GridField[];
  imageWidth: number;
  imageHeight: number;
}

export interface ExtraElement {
  id: string;
  type: "logo" | "stamp" | "image" | "text";
  data: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize?: number;
}

export type AppPhase = "input" | "generating" | "review" | "editing" | "export";

interface MobiStore {
  phase: AppPhase;
  setPhase: (phase: AppPhase) => void;
  uploadedImage: string | null;
  uploadedImageName: string | null;
  userDimensions: FurnitureDimensions;
  userBrand: string;
  userProductName: string;
  setUploadedImage: (data: string, name: string) => void;
  setUserDimensions: (dims: Partial<FurnitureDimensions>) => void;
  setUserBrand: (brand: string) => void;
  setUserProductName: (name: string) => void;
  furnitureData: FurnitureData | null;
  referenceImage: string | null;
  gridPositions: GridPositions | null;
  setFurnitureData: (data: FurnitureData) => void;
  setReferenceImage: (img: string | null) => void;
  setGridPositions: (positions: GridPositions) => void;
  editedData: FurnitureData | null;
  updateField: (path: string, value: unknown) => void;
  extras: ExtraElement[];
  addExtra: (extra: ExtraElement) => void;
  removeExtra: (id: string) => void;
  updateExtra: (id: string, updates: Partial<ExtraElement>) => void;
  generatingStep: string | null;
  error: string | null;
  setGeneratingStep: (step: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const defaultDimensions: FurnitureDimensions = {
  width: 0,
  height: 0,
  depth: 0,
  seatHeight: 0,
};

const initialState = {
  phase: "input" as AppPhase,
  uploadedImage: null as string | null,
  uploadedImageName: null as string | null,
  userDimensions: { ...defaultDimensions },
  userBrand: "VIVA MOBILI",
  userProductName: "",
  furnitureData: null as FurnitureData | null,
  referenceImage: null as string | null,
  gridPositions: null as GridPositions | null,
  editedData: null as FurnitureData | null,
  extras: [] as ExtraElement[],
  generatingStep: null as string | null,
  error: null as string | null,
};

function setPathValue(obj: Record<string, any>, path: string, value: unknown): Record<string, any> {
  const keys = path.split(".");
  const result: Record<string, any> = JSON.parse(JSON.stringify(obj));
  let current: Record<string, unknown> = result as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    if (current[keys[i]] === undefined) {
      current[keys[i]] = {};
    }
    current = current[keys[i]] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
  return result;
}

export const useMobiStore = create<MobiStore>((set) => ({
  ...initialState,
  setPhase: (phase) => set({ phase }),
  setUploadedImage: (data, name) => set({ uploadedImage: data, uploadedImageName: name }),
  setUserDimensions: (dims) => set((state) => ({ userDimensions: { ...state.userDimensions, ...dims } })),
  setUserBrand: (brand) => set({ userBrand: brand }),
  setUserProductName: (name) => set({ userProductName: name }),
  setFurnitureData: (data) => set({ furnitureData: data, editedData: JSON.parse(JSON.stringify(data)) }),
  setReferenceImage: (img) => set({ referenceImage: img }),
  setGridPositions: (positions) => set({ gridPositions: positions }),
  updateField: (path, value) =>
    set((state) => {
      if (!state.editedData) return {};
      const updated = setPathValue(state.editedData as unknown as Record<string, unknown>, path, value);
      return { editedData: updated as unknown as FurnitureData };
    }),
  addExtra: (extra) => set((state) => ({ extras: [...state.extras, extra] })),
  removeExtra: (id) => set((state) => ({ extras: state.extras.filter((e) => e.id !== id) })),
  updateExtra: (id, updates) => set((state) => ({ extras: state.extras.map((e) => e.id === id ? { ...e, ...updates } : e) })),
  setGeneratingStep: (step) => set({ generatingStep: step }),
  setError: (error) => set({ error }),
  reset: () => set({ ...initialState, userDimensions: { ...defaultDimensions } }),
}));
