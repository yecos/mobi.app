import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import sharp from "sharp";

const GRID_COLS = 16; // A-P
const GRID_ROWS = 24; // 1-24

/**
 * Overlays a grid on the image using sharp + SVG.
 * Returns base64 of the gridded image.
 */
async function overlayGrid(imageBase64: string): Promise<string> {
  // Extract base64 data (remove data:image/...;base64, prefix)
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");

  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1024;
  const height = metadata.height || 1536;

  const cellW = width / GRID_COLS;
  const cellH = height / GRID_ROWS;

  // Build SVG grid overlay
  let svgLines = "";
  let svgTexts = "";

  // Vertical lines + column labels
  for (let col = 0; col <= GRID_COLS; col++) {
    const x = col * cellW;
    svgLines += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="rgba(0,100,255,0.5)" stroke-width="1.5"/>`;
    if (col < GRID_COLS) {
      const letter = String.fromCharCode(65 + col); // A-P
      svgTexts += `<text x="${x + cellW / 2}" y="${cellH * 0.5}" font-size="14" fill="rgba(0,100,255,0.9)" text-anchor="middle" dominant-baseline="central" font-weight="bold" font-family="monospace">${letter}</text>`;
    }
  }

  // Horizontal lines + row labels
  for (let row = 0; row <= GRID_ROWS; row++) {
    const y = row * cellH;
    svgLines += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(0,100,255,0.5)" stroke-width="1.5"/>`;
    if (row < GRID_ROWS) {
      svgTexts += `<text x="${cellW * 0.5}" y="${y + cellH / 2}" font-size="11" fill="rgba(0,100,255,0.9)" text-anchor="middle" dominant-baseline="central" font-weight="bold" font-family="monospace">${row + 1}</text>`;
    }
  }

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${svgLines}
    ${svgTexts}
  </svg>`;

  const svgBuffer = Buffer.from(svg);

  const result = await sharp(imageBuffer)
    .composite([{ input: svgBuffer, blend: "over" }])
    .png()
    .toBuffer();

  return `data:image/png;base64,${result.toString("base64")}`;
}

/**
 * Parses a grid cell reference like "A1" or "C3:E5" into percentage-based coordinates.
 */
function parseCells(
  cells: string,
  imgW: number = 1024,
  imgH: number = 1536
): { x: number; y: number; w: number; h: number } {
  const parts = cells.split(":");
  const start = parts[0].trim();
  const end = (parts[1] || start).trim();

  const parseCell = (ref: string) => {
    const match = ref.match(/^([A-P])(\d+)$/i);
    if (!match) return { col: 0, row: 0 };
    const col = match[1].toUpperCase().charCodeAt(0) - 65; // A=0, B=1, ...
    const row = parseInt(match[2], 10) - 1; // 1=0, 2=1, ...
    return { col, row };
  };

  const s = parseCell(start);
  const e = parseCell(end);

  const cellW = imgW / GRID_COLS;
  const cellH = imgH / GRID_ROWS;

  const x = s.col * cellW;
  const y = s.row * cellH;
  const w = (e.col - s.col + 1) * cellW;
  const h = (e.row - s.row + 1) * cellH;

  return { x, y, w, h };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body; // base64 image (ficha with text)

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Step 1: Overlay grid on the image
    const griddedImage = await overlayGrid(image);

    // Step 2: Send to VLM for position detection
    const openai = getOpenAI();

    const detection = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a precise document layout analyzer. You analyze images with a grid overlay and identify the exact cell positions of text elements. The grid has ${GRID_COLS} columns (A-${String.fromCharCode(64 + GRID_COLS)}) and ${GRID_ROWS} rows (1-${GRID_ROWS}). Return ONLY valid JSON.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: griddedImage, detail: "high" },
            },
            {
              type: "text",
              text: `This is a furniture technical sheet (ficha técnica) with a grid overlay of ${GRID_COLS} columns (A-${String.fromCharCode(64 + GRID_COLS)}) × ${GRID_ROWS} rows (1-${GRID_ROWS}).

Identify EVERY text element on the sheet and report its position using grid cell references.

For each element provide:
- id: field identifier from the list below
- cells: grid range like "A1:B1" (single cell) or "C3:D5" (multi-cell range)
- text: the exact text content you see
- fontSize: "small" (≤10px), "medium" (11-16px), or "large" (>16px)
- bold: true or false

Required field IDs to find:
- brand (company/brand name, e.g. "VIVA MOBILI")
- sheetTitle (title like "FICHA TÉCNICA")
- productType (furniture type, e.g. "Silla", "Mesa")
- style (design style)
- f-material (main material)
- f-finish (finish/surface description)
- f-feature (distinctive feature)
- f-width (width value, may include "cm" or unit)
- f-height (height value)
- f-depth (depth value)
- f-seatHeight (seat height if present, else omit)
- f-weight (weight value, may include "kg")
- ann-1, ann-2, ann-3, ann-4... (numbered annotation texts)
- palette-primary (primary color name or hex)
- palette-secondary (secondary color name or hex)

Also report:
- sheetBgColor: the dominant background color of the sheet in hex (e.g. "#E5E5E5")
- imgWidth: the image width in pixels
- imgHeight: the image height in pixels

Return ONLY a valid JSON object:
{
  "sheetBgColor": "#E5E5E5",
  "imgWidth": 1024,
  "imgHeight": 1536,
  "fields": [
    { "id": "brand", "cells": "A1:C1", "text": "VIVA MOBILI", "fontSize": "large", "bold": true },
    { "id": "f-width", "cells": "D6:E6", "text": "58 cm", "fontSize": "medium", "bold": false },
    ...
  ]
}

Be thorough — find ALL text elements. Each field ID should appear exactly once.`,
            },
          ],
        },
      ],
      max_completion_tokens: 3000,
    });

    const content = detection.choices[0]?.message?.content || "";

    // Parse response
    let data;
    try {
      data = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // Remove trailing commas
        const cleaned = jsonMatch[0].replace(/,\s*([}\]])/g, "$1");
        data = JSON.parse(cleaned);
      } else {
        throw new Error("Could not parse position detection response");
      }
    }

    // Convert grid cells to pixel/percentage coordinates
    const imgW = data.imgWidth || 1024;
    const imgH = data.imgHeight || 1536;

    const fieldsWithCoords = (data.fields || []).map(
      (field: {
        id: string;
        cells: string;
        text: string;
        fontSize: string;
        bold: boolean;
      }) => {
        const coords = parseCells(field.cells, imgW, imgH);
        return {
          id: field.id,
          label: field.text,
          cells: field.cells,
          // Percentage-based positioning (responsive)
          xPct: (coords.x / imgW) * 100,
          yPct: (coords.y / imgH) * 100,
          wPct: (coords.w / imgW) * 100,
          hPct: (coords.h / imgH) * 100,
          // Pixel-based (for export canvas)
          x: coords.x,
          y: coords.y,
          w: coords.w,
          h: coords.h,
          fontSize: field.fontSize,
          bold: field.bold,
          type:
            field.id.startsWith("f-width") ||
            field.id.startsWith("f-height") ||
            field.id.startsWith("f-depth") ||
            field.id.startsWith("f-seatHeight") ||
            field.id.startsWith("f-weight")
              ? ("number" as const)
              : ("text" as const),
        };
      }
    );

    return NextResponse.json({
      sheetBgColor: data.sheetBgColor || "#E5E5E5",
      imgWidth: imgW,
      imgHeight: imgH,
      fields: fieldsWithCoords,
    });
  } catch (error: unknown) {
    console.error("Error detecting positions:", error);
    const message =
      error instanceof Error ? error.message : "Error detecting positions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
