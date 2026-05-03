/**
 * Client-side OCR using Tesseract.js + Canvas API for color detection.
 * Runs entirely in the browser — no server needed, no timeouts.
 *
 * Uses TSV output from Tesseract for reliable bounding boxes.
 * Tesseract.js v5 sometimes returns empty lines/words arrays,
 * but TSV output always contains structured data with positions.
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
 * Parse Tesseract TSV output into structured word data.
 * TSV format: level  page_num  block_num  par_num  line_num  word_num  left  top  width  height  conf  text
 */
interface TSVWord {
  level: number;
  left: number;
  top: number;
  width: number;
  height: number;
  conf: number;
  text: string;
  lineNum: number;
}

function parseTSV(tsv: string): TSVWord[] {
  const lines = tsv.trim().split("\n");
  if (lines.length < 2) return [];

  const words: TSVWord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    if (cols.length < 12) continue;

    const level = parseInt(cols[0], 10);
    const lineNum = parseInt(cols[4], 10);
    const wordNum = parseInt(cols[5], 10);
    const left = parseInt(cols[6], 10);
    const top = parseInt(cols[7], 10);
    const width = parseInt(cols[8], 10);
    const height = parseInt(cols[9], 10);
    const conf = parseFloat(cols[10]);
    const text = cols[11] || "";

    // Level 5 = word level
    if (level === 5 && wordNum > 0 && text.trim()) {
      words.push({ level, left, top, width, height, conf, text: text.trim(), lineNum });
    }
  }

  return words;
}

/**
 * Detect text color in a bounding box region using canvas.
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

// Singleton worker
let _worker: Worker | null = null;

async function getWorker(onProgress?: (percent: number) => void): Promise<Worker> {
  if (_worker) return _worker;

  console.log("[OCR] Creating Tesseract worker...");
  const worker = await createWorker("spa+eng", 1, {
    logger: (info) => {
      if (info.status === "recognizing text" && info.progress) {
        onProgress?.(Math.round(info.progress * 100));
      }
    },
  });
  console.log("[OCR] Worker created");
  _worker = worker;
  return worker;
}

/**
 * Run OCR on the client using Tesseract.js.
 * Uses TSV output for reliable bounding boxes (avoids v5 empty lines/words bug).
 */
export async function detectText(
  imageDataUrl: string,
  onProgress?: (percent: number) => void
): Promise<DetectionResult> {
  console.log("[OCR] Starting text detection...");

  // 1. Load image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const imgEl = new Image();
    imgEl.onload = () => resolve(imgEl);
    imgEl.onerror = () => reject(new Error("Error cargando la imagen"));
    imgEl.src = imageDataUrl;
  });

  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  console.log("[OCR] Image:", imgW, "x", imgH);

  // 2. Canvas for color detection
  const canvas = document.createElement("canvas");
  canvas.width = imgW;
  canvas.height = imgH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No se pudo crear el canvas");
  ctx.drawImage(img, 0, 0);

  // 3. Background color
  const bgColor = detectBgColor(ctx, imgW, imgH);

  // 4. Run OCR
  onProgress?.(5);
  const worker = await getWorker(onProgress);
  onProgress?.(10);

  const { data } = await worker.recognize(imageDataUrl);
  console.log("[OCR] Recognition done. Confidence:", data.confidence);
  console.log("[OCR] Text preview:", (data.text || "").slice(0, 150));

  // 5. Parse TSV for bounding boxes (this ALWAYS works, unlike data.lines/data.words)
  const tsvWords = parseTSV(data.tsv || "");
  console.log("[OCR] TSV words parsed:", tsvWords.length);

  if (tsvWords.length === 0) {
    // Last resort: split data.text by lines and create approximate regions
    console.log("[OCR] No TSV words. Falling back to text split...");
    return fallbackFromText(data.text || "", ctx, imgW, imgH, bgColor, onProgress);
  }

  // 6. Group words into lines by lineNum
  const lineGroups = new Map<number, TSVWord[]>();
  for (const w of tsvWords) {
    if (!lineGroups.has(w.lineNum)) {
      lineGroups.set(w.lineNum, []);
    }
    lineGroups.get(w.lineNum)!.push(w);
  }

  console.log("[OCR] Line groups:", lineGroups.size);

  // 7. Convert line groups → TextRegion
  const regions: TextRegion[] = [];

  // Sort lines by top position
  const sortedLines = [...lineGroups.entries()]
    .map(([num, words]) => ({ num, words }))
    .sort((a, b) => {
      const aTop = Math.min(...a.words.map((w) => w.top));
      const bTop = Math.min(...b.words.map((w) => w.top));
      return aTop - bTop;
    });

  for (const line of sortedLines) {
    // Sort words left-to-right within line
    const sortedWords = [...line.words].sort((a, b) => a.left - b.left);
    const text = sortedWords.map((w) => w.text).join(" ").trim();
    if (!text) continue;

    // Bounding box for the entire line
    const x0 = Math.min(...sortedWords.map((w) => w.left));
    const y0 = Math.min(...sortedWords.map((w) => w.top));
    const x1 = Math.max(...sortedWords.map((w) => w.left + w.width));
    const y1 = Math.max(...sortedWords.map((w) => w.top + w.height));

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
      fontSize: Math.round(lineH * 0.85),
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
  console.log("[OCR] Final regions:", regions.length);
  return { regions, imageWidth: imgW, imageHeight: imgH, bgColor };
}

/**
 * Fallback: when TSV parsing fails, split data.text by newlines
 * and create regions with estimated positions.
 */
function fallbackFromText(
  fullText: string,
  ctx: CanvasRenderingContext2D,
  imgW: number,
  imgH: number,
  bgColor: string,
  onProgress?: (percent: number) => void
): DetectionResult {
  const textLines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
  console.log("[OCR] Fallback: creating", textLines.length, "regions from text lines");

  const regions: TextRegion[] = [];
  const lineHeight = imgH / (textLines.length + 2);

  for (let i = 0; i < textLines.length; i++) {
    const text = textLines[i];
    if (!text) continue;

    const estimatedY = (i + 1) * lineHeight;
    const estimatedH = lineHeight * 0.7;
    // Estimate width based on text length (rough: ~55% of fontSize per char)
    const estimatedFontSize = Math.round(estimatedH * 0.82);
    const estimatedW = Math.min(imgW * 0.9, text.length * estimatedFontSize * 0.55);

    const region: TextRegion = {
      id: `text-${regions.length + 1}`,
      x: parseFloat(((imgW * 0.05) / imgW * 100).toFixed(2)),
      y: parseFloat(((estimatedY / imgH) * 100).toFixed(2)),
      w: parseFloat(((estimatedW / imgW) * 100).toFixed(2)),
      h: parseFloat(((estimatedH / imgH) * 100).toFixed(2)),
      text,
      fontSize: estimatedFontSize,
      color: detectTextColor(ctx, imgW * 0.05, estimatedY, estimatedW, estimatedH, imgW, imgH),
      bold: false,
      editable: true,
    };

    regions.push(region);
  }

  onProgress?.(100);
  return { regions, imageWidth: imgW, imageHeight: imgH, bgColor };
}
