/**
 * Client-side OCR using Tesseract.js + Canvas API for color detection.
 * Runs entirely in the browser — no server needed, no timeouts.
 *
 * Uses createWorker explicitly for better Next.js compatibility.
 */

import { createWorker, Worker } from "tesseract.js";

export interface TextRegion {
  id: string;
  x: number;       // percentage from left (0-100)
  y: number;       // percentage from top (0-100)
  w: number;       // percentage width
  h: number;       // percentage height
  text: string;
  fontSize: number; // pixel size in original image
  color: string;
  bold: boolean;
  editable: boolean;
}

export interface DetectionResult {
  regions: TextRegion[];
  imageWidth: number;
  imageHeight: number;
  bgColor: string;
}

/**
 * Detect text color in a bounding box region using canvas.
 * Samples dark pixels (likely text) and returns their average color.
 */
function detectTextColor(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  pw: number,
  ph: number,
  imgW: number,
  imgH: number
): string {
  const left = Math.max(0, Math.min(imgW - 1, Math.round(px)));
  const top = Math.max(0, Math.min(imgH - 1, Math.round(py)));
  const width = Math.max(1, Math.min(imgW - left, Math.round(pw)));
  const height = Math.max(1, Math.min(imgH - top, Math.round(ph)));

  let rSum = 0, gSum = 0, bSum = 0, count = 0;

  try {
    const pixels = ctx.getImageData(left, top, width, height).data;
    for (let p = 0; p < pixels.length; p += 4) {
      const r = pixels[p];
      const g = pixels[p + 1];
      const b = pixels[p + 2];
      const brightness = r * 0.299 + g * 0.587 + b * 0.114;
      if (brightness < 160) {
        rSum += r;
        gSum += g;
        bSum += b;
        count++;
      }
    }
  } catch {
    return "#1a1a1a";
  }

  if (count > 0) {
    const r = Math.round(rSum / count);
    const g = Math.round(gSum / count);
    const b = Math.round(bSum / count);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
  return "#1a1a1a";
}

/**
 * Detect background color by sampling the top-left corner.
 */
function detectBgColor(ctx: CanvasRenderingContext2D, imgW: number, imgH: number): string {
  const sampleSize = Math.min(50, imgW, imgH);
  let rSum = 0, gSum = 0, bSum = 0, count = 0;

  try {
    const pixels = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
    for (let p = 0; p < pixels.length; p += 4) {
      rSum += pixels[p];
      gSum += pixels[p + 1];
      bSum += pixels[p + 2];
      count++;
    }
  } catch {
    return "#E5E5E5";
  }

  if (count > 0) {
    const r = Math.round(rSum / count);
    const g = Math.round(gSum / count);
    const b = Math.round(bSum / count);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }
  return "#E5E5E5";
}

// Singleton worker — reuse across calls
let _worker: Worker | null = null;

async function getWorker(onProgress?: (percent: number) => void): Promise<Worker> {
  if (_worker) return _worker;

  console.log("[OCR] Creating Tesseract worker...");
  const worker = await createWorker("spa+eng", 1, {
    logger: (info) => {
      console.log("[OCR]", info.status, Math.round((info.progress || 0) * 100) + "%");
      if (info.status === "recognizing text" && info.progress) {
        onProgress?.(Math.round(info.progress * 100));
      }
    },
  });
  console.log("[OCR] Worker created successfully");
  _worker = worker;
  return worker;
}

/**
 * Run OCR on the client using Tesseract.js Web Worker.
 * Returns precise bounding boxes in pixels + colors detected via canvas.
 */
export async function detectText(
  imageDataUrl: string,
  onProgress?: (percent: number) => void
): Promise<DetectionResult> {
  console.log("[OCR] Starting text detection...");

  // 1. Load image into canvas
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const imgEl = new Image();
    imgEl.onload = () => resolve(imgEl);
    imgEl.onerror = () => reject(new Error("Error cargando la imagen"));
    imgEl.src = imageDataUrl;
  });

  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  console.log("[OCR] Image loaded:", imgW, "x", imgH);

  // 2. Create canvas for color detection
  const canvas = document.createElement("canvas");
  canvas.width = imgW;
  canvas.height = imgH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("No se pudo crear el canvas");
  }
  ctx.drawImage(img, 0, 0);

  // 3. Detect background color
  const bgColor = detectBgColor(ctx, imgW, imgH);
  console.log("[OCR] Background color:", bgColor);

  // 4. Run Tesseract OCR with explicit worker
  onProgress?.(5); // Starting
  const worker = await getWorker(onProgress);
  onProgress?.(10); // Worker ready

  console.log("[OCR] Running recognition...");
  const { data } = await worker.recognize(imageDataUrl);
  console.log("[OCR] Recognition complete. Confidence:", data.confidence);

  // 5. Extract lines from OCR result
  // Tesseract.js data.lines might not be in TypeScript types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ocrAny = data as any;
  const ocrLines: Array<{
    text: string;
    bbox: { x0: number; y0: number; x1: number; y1: number };
    confidence: number;
  }> = ocrAny.lines || [];

  console.log("[OCR] Found", ocrLines.length, "lines");

  // Debug: if no lines, check words as fallback
  if (ocrLines.length === 0) {
    const ocrWords: Array<{
      text: string;
      bbox: { x0: number; y0: number; x1: number; y1: number };
    }> = ocrAny.words || [];
    console.log("[OCR] No lines found. Words count:", ocrWords.length);

    if (ocrWords.length === 0) {
      // Last resort: check if there's any text at all
      const fullText = (data.text || "").trim();
      console.log("[OCR] Full text detected:", fullText.slice(0, 200));
      if (!fullText) {
        throw new Error(
          "No se detectó texto en la imagen. Intenta con una imagen con texto más claro y grande."
        );
      }
    }

    // Group words into lines by y-coordinate proximity
    if (ocrWords.length > 0) {
      return groupWordsIntoRegions(ocrWords, ctx, imgW, imgH, bgColor, onProgress);
    }
  }

  // 6. Convert OCR lines → TextRegion
  const regions: TextRegion[] = [];

  for (let i = 0; i < ocrLines.length; i++) {
    const line = ocrLines[i];
    const text = (line.text || "").trim();
    if (!text) continue;

    const bbox = line.bbox;
    const lineH = bbox.y1 - bbox.y0;
    const lineW = bbox.x1 - bbox.x0;

    // Skip very tiny detections (noise)
    if (lineH < 5 || lineW < 5) continue;

    // Skip very low confidence (likely noise)
    if (line.confidence < 20) continue;

    const region: TextRegion = {
      id: `text-${regions.length + 1}`,
      x: parseFloat(((bbox.x0 / imgW) * 100).toFixed(2)),
      y: parseFloat(((bbox.y0 / imgH) * 100).toFixed(2)),
      w: parseFloat(((lineW / imgW) * 100).toFixed(2)),
      h: parseFloat(((lineH / imgH) * 100).toFixed(2)),
      text,
      fontSize: Math.round(lineH * 0.82),
      color: "#1a1a1a",
      bold: false,
      editable: true,
    };

    // Bold heuristic
    const charCount = text.replace(/\s/g, "").length;
    if (charCount > 0) {
      const avgCharWidth = lineW / text.length;
      const expectedCharWidth = region.fontSize * 0.55;
      if (avgCharWidth > expectedCharWidth * 1.2) {
        region.bold = true;
      }
    }

    // Detect text color via canvas
    region.color = detectTextColor(ctx, bbox.x0, bbox.y0, lineW, lineH, imgW, imgH);

    regions.push(region);
  }

  onProgress?.(100);
  console.log("[OCR] Final regions:", regions.length);

  return { regions, imageWidth: imgW, imageHeight: imgH, bgColor };
}

/**
 * Fallback: group individual OCR words into lines by y-coordinate proximity,
 * then convert to TextRegion with colors.
 */
function groupWordsIntoRegions(
  words: Array<{
    text: string;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>,
  ctx: CanvasRenderingContext2D,
  imgW: number,
  imgH: number,
  bgColor: string,
  onProgress?: (percent: number) => void
): DetectionResult {
  console.log("[OCR] Grouping", words.length, "words into lines...");

  // Group words by y-coordinate (within 50% of average line height)
  const groups: Array<Array<{
    text: string;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>> = [];

  const sorted = [...words].sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);

  for (const word of sorted) {
    const wordH = word.bbox.y1 - word.bbox.y0;
    if (wordH < 5) continue;

    const wordMidY = (word.bbox.y0 + word.bbox.y1) / 2;

    // Find a group this word belongs to
    let found = false;
    for (const group of groups) {
      const groupMidY = (group[0].bbox.y0 + group[0].bbox.y1) / 2;
      const avgH = group.reduce((s, w) => s + (w.bbox.y1 - w.bbox.y0), 0) / group.length;
      if (Math.abs(wordMidY - groupMidY) < avgH * 0.7) {
        group.push(word);
        found = true;
        break;
      }
    }

    if (!found) {
      groups.push([word]);
    }
  }

  // Convert groups → TextRegion
  const regions: TextRegion[] = [];

  for (const group of groups) {
    const text = group.map((w) => w.text).join(" ").trim();
    if (!text) continue;

    const x0 = Math.min(...group.map((w) => w.bbox.x0));
    const y0 = Math.min(...group.map((w) => w.bbox.y0));
    const x1 = Math.max(...group.map((w) => w.bbox.x1));
    const y1 = Math.max(...group.map((w) => w.bbox.y1));

    const lineW = x1 - x0;
    const lineH = y1 - y0;

    if (lineH < 5 || lineW < 5) continue;

    const region: TextRegion = {
      id: `text-${regions.length + 1}`,
      x: parseFloat(((x0 / imgW) * 100).toFixed(2)),
      y: parseFloat(((y0 / imgH) * 100).toFixed(2)),
      w: parseFloat(((lineW / imgW) * 100).toFixed(2)),
      h: parseFloat(((lineH / imgH) * 100).toFixed(2)),
      text,
      fontSize: Math.round(lineH * 0.82),
      color: detectTextColor(ctx, x0, y0, lineW, lineH, imgW, imgH),
      bold: false,
      editable: true,
    };

    // Bold heuristic
    const charCount = text.replace(/\s/g, "").length;
    if (charCount > 0) {
      const avgCharWidth = lineW / text.length;
      const expectedCharWidth = region.fontSize * 0.55;
      if (avgCharWidth > expectedCharWidth * 1.2) {
        region.bold = true;
      }
    }

    regions.push(region);
  }

  onProgress?.(100);
  console.log("[OCR] Grouped into", regions.length, "regions");

  return { regions, imageWidth: imgW, imageHeight: imgH, bgColor };
}
