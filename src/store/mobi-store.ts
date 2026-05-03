import { create } from "zustand";

// ─── Types ────────────────────────────────────────────

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

export interface LayoutField {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize: number;
  fontWeight?: string;
  align?: "left" | "center" | "right";
  type: "text" | "number" | "color" | "label";
  unit?: string;
  editable: boolean;
}

export interface FichaLayout {
  width: number;
  height: number;
  brand: LayoutField;
  sheetTitle: LayoutField;
  productName: LayoutField;
  views: { id: string; x: number; y: number; w: number; h: number }[];
  dimensions: {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    valueX: number;
    valueY: number;
    arrowDir: "h" | "v";
  }[];
  fields: LayoutField[];
  annotations: LayoutField[];
  palette: {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    labelX: number;
    labelY: number;
  }[];
}

export interface ExtraElement {
  id: string;
  type: "logo" | "stamp" | "image" | "text";
  data: string; // base64 for images, text for text
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize?: number;
}

export type AppPhase = "input" | "generating" | "review" | "editing" | "export";
export type InputMode = "ai" | "manual";

interface MobiStore {
  // Phase
  phase: AppPhase;
  setPhase: (phase: AppPhase) => void;

  // Input mode
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;

  // Input
  uploadedImage: string | null; // base64
  uploadedImageName: string | null;
  userDimensions: FurnitureDimensions;
  userBrand: string;
  userProductName: string;
  setUploadedImage: (data: string, name: string) => void;
  setUserDimensions: (dims: Partial<FurnitureDimensions>) => void;
  setUserBrand: (brand: string) => void;
  setUserProductName: (name: string) => void;

  // Manual import
  manualReferenceImage: string | null;
  manualCanvasImage: string | null;
  manualJsData: string;
  setManualReferenceImage: (img: string | null) => void;
  setManualCanvasImage: (img: string | null) => void;
  setManualJsData: (js: string) => void;

  // AI Generated
  furnitureData: FurnitureData | null;
  referenceImage: string | null; // Image A: ficha completa con texto
  canvasImage: string | null; // Image B: ficha sin texto
  fichaLayout: FichaLayout | null;
  setFurnitureData: (data: FurnitureData) => void;
  setReferenceImage: (img: string | null) => void;
  setCanvasImage: (img: string | null) => void;
  setFichaLayout: (layout: FichaLayout) => void;

  // Editable fields (values the user can modify)
  editedData: FurnitureData | null;
  updateField: (path: string, value: unknown) => void;

  // Extras
  extras: ExtraElement[];
  addExtra: (extra: ExtraElement) => void;
  removeExtra: (id: string) => void;
  updateExtra: (id: string, updates: Partial<ExtraElement>) => void;

  // Generation status
  generatingStep: string | null;
  error: string | null;
  setGeneratingStep: (step: string | null) => void;
  setError: (error: string | null) => void;

  // Reset
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
  inputMode: "ai" as InputMode,
  uploadedImage: null as string | null,
  uploadedImageName: null as string | null,
  userDimensions: { ...defaultDimensions },
  userBrand: "VIVA MOBILI",
  userProductName: "",
  manualReferenceImage: null as string | null,
  manualCanvasImage: null as string | null,
  manualJsData: "",
  furnitureData: null as FurnitureData | null,
  referenceImage: null as string | null,
  canvasImage: null as string | null,
  fichaLayout: null as FichaLayout | null,
  editedData: null as FurnitureData | null,
  extras: [] as ExtraElement[],
  generatingStep: null as string | null,
  error: null as string | null,
};

/**
 * Deep-set a value at a dot-separated path inside a nested object.
 * Returns a new object (immutable).
 */
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

  // Phase
  setPhase: (phase) => set({ phase }),

  // Input mode
  setInputMode: (mode) => set({ inputMode: mode }),

  // Input
  setUploadedImage: (data, name) =>
    set({ uploadedImage: data, uploadedImageName: name }),
  setUserDimensions: (dims) =>
    set((state) => ({
      userDimensions: { ...state.userDimensions, ...dims },
    })),
  setUserBrand: (brand) => set({ userBrand: brand }),
  setUserProductName: (name) => set({ userProductName: name }),

  // Manual import
  setManualReferenceImage: (img) => set({ manualReferenceImage: img }),
  setManualCanvasImage: (img) => set({ manualCanvasImage: img }),
  setManualJsData: (js) => set({ manualJsData: js }),

  // AI Generated
  setFurnitureData: (data) => set({ furnitureData: data, editedData: JSON.parse(JSON.stringify(data)) }),
  setReferenceImage: (img) => set({ referenceImage: img }),
  setCanvasImage: (img) => set({ canvasImage: img }),
  setFichaLayout: (layout) => set({ fichaLayout: layout }),

  // Editable fields
  updateField: (path, value) =>
    set((state) => {
      if (!state.editedData) return {};
      const updated = setPathValue(state.editedData, path, value) as unknown as FurnitureData;
      return { editedData: updated };
    }),

  // Extras
  addExtra: (extra) =>
    set((state) => ({ extras: [...state.extras, extra] })),
  removeExtra: (id) =>
    set((state) => ({ extras: state.extras.filter((e) => e.id !== id) })),
  updateExtra: (id, updates) =>
    set((state) => ({
      extras: state.extras.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),

  // Generation status
  setGeneratingStep: (step) => set({ generatingStep: step }),
  setError: (error) => set({ error }),

  // Reset
  reset: () => set({ ...initialState, userDimensions: { ...defaultDimensions } }),
}));
