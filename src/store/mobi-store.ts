import { create } from "zustand";

/**
 * A single detected text region on the image.
 * Positions and sizes are stored as percentages (0-100) of the image dimensions
 * so they remain correct at any display scale.
 */
export interface TextRegion {
  id: string;
  x: number;       // percentage from left
  y: number;       // percentage from top
  w: number;       // percentage width
  h: number;       // percentage height
  text: string;    // detected text content (default value)
  fontSize: number; // approximate pixel size relative to original image width
  color: string;   // detected text color (#hex)
  bold: boolean;   // whether the text appears bold
  editable: boolean;
}

export interface DetectionResult {
  regions: TextRegion[];
  imageWidth: number;   // original image width in px
  imageHeight: number;  // original image height in px
  bgColor: string;      // detected background color for covering original text
}

export type AppPhase = "input" | "generating" | "editing" | "export";

interface MobiStore {
  // Phase
  phase: AppPhase;
  setPhase: (phase: AppPhase) => void;

  // Uploaded image
  uploadedImage: string | null;
  uploadedImageName: string | null;
  uploadedImageWidth: number;
  uploadedImageHeight: number;
  setUploadedImage: (data: string, name: string, width: number, height: number) => void;

  // Detection result
  detectionResult: DetectionResult | null;
  setDetectionResult: (result: DetectionResult) => void;

  // Edited regions (starts as copy of detectionResult.regions)
  editedRegions: TextRegion[];
  setEditedRegions: (regions: TextRegion[]) => void;
  updateRegion: (id: string, updates: Partial<TextRegion>) => void;

  // Active field for highlighting
  activeFieldId: string | null;
  setActiveFieldId: (id: string | null) => void;

  // UI state
  scale: number;
  setScale: (scale: number) => void;
  generatingStep: string | null;
  error: string | null;
  setGeneratingStep: (step: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  phase: "input" as AppPhase,
  uploadedImage: null as string | null,
  uploadedImageName: null as string | null,
  uploadedImageWidth: 0,
  uploadedImageHeight: 0,
  detectionResult: null as DetectionResult | null,
  editedRegions: [] as TextRegion[],
  activeFieldId: null as string | null,
  scale: 100,
  generatingStep: null as string | null,
  error: null as string | null,
};

export const useMobiStore = create<MobiStore>((set) => ({
  ...initialState,
  setPhase: (phase) => set({ phase }),

  setUploadedImage: (data, name, width, height) =>
    set({ uploadedImage: data, uploadedImageName: name, uploadedImageWidth: width, uploadedImageHeight: height }),

  setDetectionResult: (result) =>
    set({
      detectionResult: result,
      editedRegions: result.regions.map((r) => ({ ...r })),
    }),

  setEditedRegions: (regions) => set({ editedRegions: regions }),

  updateRegion: (id, updates) =>
    set((state) => ({
      editedRegions: state.editedRegions.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  setActiveFieldId: (id) => set({ activeFieldId: id }),
  setScale: (scale) => set({ scale }),
  setGeneratingStep: (step) => set({ generatingStep: step }),
  setError: (error) => set({ error }),
  reset: () => set({ ...initialState }),
}));
