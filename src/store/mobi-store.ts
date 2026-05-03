import { create } from "zustand";

export interface Measurement {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  distance: number; // in cm
  label: string;
}

export interface FurnitureSpecs {
  name?: string;
  dimensions?: {
    width: number;
    depth: number;
    height: number;
  };
  materials?: string[];
  weight?: number;
  finishes?: { name: string; hex: string }[];
  [key: string]: unknown;
}

interface MobiStore {
  // File upload
  fileUrl: string | null;
  fileName: string | null;
  fileType: "skp" | "glb" | "gltf" | null;
  setFile: (url: string, name: string, type: "skp" | "glb" | "gltf") => void;
  clearFile: () => void;

  // Measurement system
  measurements: Measurement[];
  isMeasuring: boolean;
  firstPoint: [number, number, number] | null;
  setMeasuring: (measuring: boolean) => void;
  setFirstPoint: (point: [number, number, number] | null) => void;
  addMeasurement: (measurement: Measurement) => void;
  removeMeasurement: (id: string) => void;
  clearMeasurements: () => void;

  // JS Spec editor
  specCode: string;
  parsedSpecs: FurnitureSpecs | null;
  specsError: string | null;
  setSpecCode: (code: string) => void;
  setParsedSpecs: (specs: FurnitureSpecs | null) => void;
  setSpecsError: (error: string | null) => void;
}

export const useMobiStore = create<MobiStore>((set) => ({
  // File upload
  fileUrl: null,
  fileName: null,
  fileType: null,
  setFile: (url, name, type) =>
    set({ fileUrl: url, fileName: name, fileType: type }),
  clearFile: () =>
    set({ fileUrl: null, fileName: null, fileType: null }),

  // Measurement system
  measurements: [],
  isMeasuring: false,
  firstPoint: null,
  setMeasuring: (measuring) => set({ isMeasuring: measuring }),
  setFirstPoint: (point) => set({ firstPoint: point }),
  addMeasurement: (measurement) =>
    set((state) => ({ measurements: [...state.measurements, measurement] })),
  removeMeasurement: (id) =>
    set((state) => ({
      measurements: state.measurements.filter((m) => m.id !== id),
    })),
  clearMeasurements: () =>
    set({ measurements: [], firstPoint: null, isMeasuring: false }),

  // JS Spec editor
  specCode: `{
  name: "Mesa Noguchi",
  dimensions: { width: 130, depth: 90, height: 40 },
  materials: ["Nogal", "Cristal templado"],
  weight: 18.5,
  finishes: [
    { name: "Nogal", hex: "#5C4033" },
    { name: "Roble", hex: "#C4A882" }
  ]
}`,
  parsedSpecs: null,
  specsError: null,
  setSpecCode: (code) => set({ specCode: code }),
  setParsedSpecs: (specs) => set({ parsedSpecs: specs }),
  setSpecsError: (error) => set({ specsError: error }),
}));
