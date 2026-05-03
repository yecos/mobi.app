/**
 * Client-side OCR using Tesseract.js + Canvas API for color detection.
 * Runs entirely in the browser — no server needed, no timeouts.
 */

import Tesseract from "tesseract.js";

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
 * Detect background color by sampling corners of the image.
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

/**
 * Run OCR on the client using Tesseract.js Web Worker.
 * Returns precise bounding boxes in pixels + colors detected via canvas.
 */
export async function detectText(
  imageDataUrl: string,
  onProgress?: (percent: number) => void
): Promise<DetectionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;

      // Create canvas for color detection
      const canvas = document.createElement("canvas");
      canvas.width = imgW;
      canvas.height = imgH;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("No se pudo crear el canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0);

      // Detect background color
      const bgColor = detectBgColor(ctx, imgW, imgH);

      // Run Tesseract OCR
      try {
        const result = await Tesseract.recognize(imageDataUrl, "spa+eng", {
          logger: (info) => {
            if (info.status === "recognizing text" && info.progress) {
              onProgress?.(Math.round(info.progress * 100));
            }
          },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ocrData = result.data as any;
        const ocrLines: Array<{
          text: string;
          bbox: { x0: number; y0: number; x1: number; y1: number };
        }> = ocrData.lines || [];

        if (ocrLines.length === 0) {
          reject(new Error("No se detectó texto en la imagen. Intenta con una imagen más clara."));
          return;
        }

        const regions: TextRegion[] = [];

        for (let i = 0; i < ocrLines.length; i++) {
          const line = ocrLines[i];
          const text = (line.text || "").trim();
          if (!text) continue;

          const bbox = line.bbox;
          const lineH = bbox.y1 - bbox.y0;
          const lineW = bbox.x1 - bbox.x0;

          if (lineH < 5 || lineW < 5) continue;

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

        resolve({ regions, imageWidth: imgW, imageHeight: imgH, bgColor });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error("Error cargando la imagen"));
    img.src = imageDataUrl;
  });
}
