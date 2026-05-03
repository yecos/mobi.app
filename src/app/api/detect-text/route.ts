import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import Tesseract from "tesseract.js";

interface TextRegionRaw {
  id: string;
  x: number;       // percentage from left
  y: number;       // percentage from top
  w: number;       // percentage width
  h: number;       // percentage height
  text: string;
  fontSize: number; // pixel size in original image
  color: string;
  bold: boolean;
  editable: boolean;
}

/**
 * Detect the dominant text color in a bounding box region.
 * Samples dark pixels (likely text) and returns their average color.
 */
async function detectTextColor(
  imageBuffer: Buffer,
  px: number,
  py: number,
  pw: number,
  ph: number,
  imgW: number,
  imgH: number
): Promise<string> {
  try {
    const left = Math.max(0, Math.min(imgW - 1, Math.round(px)));
    const top = Math.max(0, Math.min(imgH - 1, Math.round(py)));
    const width = Math.max(1, Math.min(imgW - left, Math.round(pw)));
    const height = Math.max(1, Math.min(imgH - top, Math.round(ph)));

    const { data: pixels, info } = await sharp(imageBuffer)
      .extract({ left, top, width, height })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = info.channels;
    let rSum = 0,
      gSum = 0,
      bSum = 0,
      count = 0;

    for (let p = 0; p < pixels.length; p += channels) {
      const r = pixels[p];
      const g = pixels[p + 1];
      const b = pixels[p + 2];
      // Perceived luminance
      const brightness = r * 0.299 + g * 0.587 + b * 0.114;
      // Darker than mid-gray = likely text
      if (brightness < 160) {
        rSum += r;
        gSum += g;
        bSum += b;
        count++;
      }
    }

    if (count > 0) {
      const r = Math.round(rSum / count);
      const g = Math.round(gSum / count);
      const b = Math.round(bSum / count);
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    }

    return "#1a1a1a";
  } catch {
    return "#1a1a1a";
  }
}

/**
 * Detect background color at a specific point (just above the text line).
 */
async function detectBgColor(
  imageBuffer: Buffer,
  imgW: number,
  imgH: number
): Promise<string> {
  try {
    // Sample the top-left corner area to determine background
    const size = Math.min(50, imgW, imgH);
    const { data: pixels, info } = await sharp(imageBuffer)
      .extract({ left: 0, top: 0, width: size, height: size })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = info.channels;
    let rSum = 0,
      gSum = 0,
      bSum = 0,
      count = 0;

    for (let p = 0; p < pixels.length; p += channels) {
      rSum += pixels[p];
      gSum += pixels[p + 1];
      bSum += pixels[p + 2];
      count++;
    }

    if (count > 0) {
      const r = Math.round(rSum / count);
      const g = Math.round(gSum / count);
      const b = Math.round(bSum / count);
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    }
    return "#E5E5E5";
  } catch {
    return "#E5E5E5";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, imageWidth, imageHeight } = body as {
      image: string;
      imageWidth: number;
      imageHeight: number;
    };

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Get actual image dimensions from Sharp
    const metadata = await sharp(imageBuffer).metadata();
    const imgW = metadata.width || imageWidth || 1024;
    const imgH = metadata.height || imageHeight || 1536;

    console.log("[detect-text] Image dimensions:", imgW, "x", imgH);

    // ─── PRIMARY: Tesseract.js OCR (precise bounding boxes) ───
    console.log("[detect-text] Starting Tesseract OCR...");
    const startTime = Date.now();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ocrData = (await Tesseract.recognize(imageBuffer, "spa+eng")).data as any;
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const ocrLines: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }> =
      ocrData.lines || [];
    console.log("[detect-text] Tesseract completed in", elapsed, "s — found", ocrLines.length, "lines");

    if (ocrLines.length === 0) {
      throw new Error("No se detectó texto en la imagen. Intenta con una imagen más clara.");
    }

    // Convert Tesseract lines → TextRegion with pixel-precise positions
    const regions: TextRegionRaw[] = [];

    for (let i = 0; i < ocrLines.length; i++) {
      const line = ocrLines[i];
      const text = (line.text || "").trim();

      if (!text || text.length === 0) continue;

      const bbox = line.bbox; // { x0, y0, x1, y1 } in pixels
      const lineH = bbox.y1 - bbox.y0;
      const lineW = bbox.x1 - bbox.x0;

      // Skip very tiny detections (noise)
      if (lineH < 5 || lineW < 5) continue;

      const region: TextRegionRaw = {
        id: `text-${regions.length + 1}`,
        x: parseFloat(((bbox.x0 / imgW) * 100).toFixed(2)),
        y: parseFloat(((bbox.y0 / imgH) * 100).toFixed(2)),
        w: parseFloat(((lineW / imgW) * 100).toFixed(2)),
        h: parseFloat(((lineH / imgH) * 100).toFixed(2)),
        text,
        fontSize: Math.round(lineH * 0.82), // approximate font size from bbox height
        color: "#1a1a1a",
        bold: false,
        editable: true,
      };

      // Bold heuristic: compare actual char width vs expected for normal weight
      const charCount = text.replace(/\s/g, "").length;
      if (charCount > 0) {
        const avgCharWidthPx = lineW / text.length; // include spaces for avg
        const expectedCharWidth = region.fontSize * 0.55;
        if (avgCharWidthPx > expectedCharWidth * 1.2) {
          region.bold = true;
        }
      }

      regions.push(region);
    }

    // Detect text colors using Sharp (batched to avoid overload)
    console.log("[detect-text] Detecting colors for", regions.length, "regions...");
    for (let i = 0; i < regions.length; i += 8) {
      const batch = regions.slice(i, i + 8);
      await Promise.all(
        batch.map(async (region) => {
          const px = (region.x / 100) * imgW;
          const py = (region.y / 100) * imgH;
          const pw = (region.w / 100) * imgW;
          const ph = (region.h / 100) * imgH;
          region.color = await detectTextColor(imageBuffer, px, py, pw, ph, imgW, imgH);
        })
      );
    }

    // Detect background color for export use
    const bgColor = await detectBgColor(imageBuffer, imgW, imgH);

    console.log("[detect-text] Successfully processed", regions.length, "text regions with precise positions");

    return NextResponse.json({
      result: {
        regions,
        imageWidth: imgW,
        imageHeight: imgH,
        bgColor,
      },
    });
  } catch (error: unknown) {
    console.error("[detect-text] ERROR:", error);
    const message = error instanceof Error ? error.message : "Error detecting text";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
