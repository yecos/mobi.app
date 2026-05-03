import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import sharp from "sharp";

const GRID_COLS = 16;
const GRID_ROWS = 24;
const COL_LABELS = "ABCDEFGHIJKLMNOP";

interface DetectedField {
  id: string;
  cells: string;
  text: string;
  fontSize: number;
  type: "text" | "number" | "label" | "color";
  editable: boolean;
}

interface DetectPositionsResult {
  sheetBgColor: string;
  fields: DetectedField[];
  imageWidth: number;
  imageHeight: number;
}

async function overlayGrid(imageBase64: string): Promise<string> {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");

  const metadata = await sharp(imageBuffer).metadata();
  const imgW = metadata.width || 1024;
  const imgH = metadata.height || 1536;

  const cellW = imgW / GRID_COLS;
  const cellH = imgH / GRID_ROWS;

  const svgParts: string[] = [];
  svgParts.push(`<svg width="${imgW}" height="${imgH}" xmlns="http://www.w3.org/2000/svg">`);

  svgParts.push(`<style>
    .cell-label { font-family: monospace; font-size: ${Math.max(9, Math.floor(cellW / 5))}px; fill: rgba(255,0,0,0.85); }
    .col-header { font-family: monospace; font-size: ${Math.max(10, Math.floor(cellW / 4))}px; fill: rgba(0,0,255,0.9); font-weight: bold; }
  </style>`);

  for (let c = 0; c <= GRID_COLS; c++) {
    const x = c * cellW;
    const opacity = c === 0 || c === GRID_COLS ? 0.7 : 0.3;
    svgParts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${imgH}" stroke="rgba(255,0,0,${opacity})" stroke-width="1"/>`);
  }
  for (let r = 0; r <= GRID_ROWS; r++) {
    const y = r * cellH;
    const opacity = r === 0 || r === GRID_ROWS ? 0.7 : 0.3;
    svgParts.push(`<line x1="0" y1="${y}" x2="${imgW}" y2="${y}" stroke="rgba(255,0,0,${opacity})" stroke-width="1"/>`);
  }

  for (let c = 0; c < GRID_COLS; c++) {
    const x = c * cellW + cellW / 2;
    svgParts.push(`<text x="${x}" y="${cellH * 0.5}" text-anchor="middle" class="col-header">${COL_LABELS[c]}</text>`);
  }

  for (let r = 1; r < GRID_ROWS; r++) {
    const y = (r + 0.5) * cellH;
    svgParts.push(`<text x="${cellW * 0.5}" y="${y + 4}" text-anchor="middle" class="cell-label">${r + 1}</text>`);
  }

  for (let c = 1; c < GRID_COLS; c += 2) {
    for (let r = 1; r < GRID_ROWS; r += 2) {
      const x = c * cellW + cellW / 2;
      const y = (r + 0.5) * cellH + 4;
      const label = `${COL_LABELS[c]}${r + 1}`;
      svgParts.push(`<text x="${x}" y="${y}" text-anchor="middle" class="cell-label">${label}</text>`);
    }
  }

  svgParts.push("</svg>");
  const svgBuffer = Buffer.from(svgParts.join(""));

  const resultBuffer = await sharp(imageBuffer)
    .composite([{ input: svgBuffer, gravity: "northwest" }])
    .png()
    .toBuffer();

  return `data:image/png;base64,${resultBuffer.toString("base64")}`;
}

/**
 * Ultra-robust JSON parser that handles all VLM output formats.
 * - Direct JSON
 * - Markdown code blocks (```json ... ``` or ``` ... ```)
 * - JSON with trailing commas
 * - Partial/truncated JSON (attempts to fix)
 * - JSON embedded in text
 */
function robustJSONParse(raw: string): unknown {
  const cleaned = raw.trim();

  // 1. Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch {}

  // 2. Try extracting from markdown code block
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    const blockContent = codeBlockMatch[1].trim();
    // Remove trailing commas
    const noTrailing = blockContent.replace(/,\s*([}\]])/g, "$1");
    try {
      return JSON.parse(noTrailing);
    } catch {}
  }

  // 3. Extract JSON object with balanced braces
  const firstBrace = cleaned.indexOf("{");
  if (firstBrace !== -1) {
    let depth = 0;
    let lastValidEnd = -1;
    for (let i = firstBrace; i < cleaned.length; i++) {
      if (cleaned[i] === "{") depth++;
      else if (cleaned[i] === "}") {
        depth--;
        if (depth === 0) {
          lastValidEnd = i + 1;
          break;
        }
      }
    }

    if (lastValidEnd > firstBrace) {
      const extracted = cleaned.slice(firstBrace, lastValidEnd);
      // Remove trailing commas
      const noTrailing = extracted.replace(/,\s*([}\]])/g, "$1");
      try {
        return JSON.parse(noTrailing);
      } catch {}
    }

    // 4. If truncated (no closing brace found), try to fix
    if (lastValidEnd === -1) {
      const partial = cleaned.slice(firstBrace);
      // Remove trailing commas
      const noTrailing = partial.replace(/,\s*([}\]])/g, "$1");
      // Try to close the JSON by adding missing braces/brackets
      let fixed = noTrailing.trimEnd();
      // Remove any trailing incomplete entries (partial key-value or array item)
      fixed = fixed.replace(/,\s*"[^"]*"?\s*$/, "");
      fixed = fixed.replace(/,\s*$/, "");
      // Count open brackets
      const openBraces = (fixed.match(/{/g) || []).length;
      const closeBraces = (fixed.match(/}/g) || []).length;
      const openBrackets = (fixed.match(/\[/g) || []).length;
      const closeBrackets = (fixed.match(/]/g) || []).length;
      // Close missing brackets first, then braces
      for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += "]";
      for (let i = 0; i < openBraces - closeBraces; i++) fixed += "}";
      try {
        return JSON.parse(fixed);
      } catch {}
    }
  }

  throw new Error(
    `Could not parse JSON. Raw response (first 800 chars): ${cleaned.slice(0, 800)}`
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, furnitureData } = body as {
      image: string;
      furnitureData: Record<string, unknown>;
    };

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const griddedImage = await overlayGrid(image);

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");
    const metadata = await sharp(imageBuffer).metadata();
    const imgW = metadata.width || 1024;
    const imgH = metadata.height || 1536;

    const openai = getOpenAI();

    // Simplified prompt — shorter to avoid truncation
    const prompt = `Analyze this furniture technical sheet (ficha técnica) with a 16×24 grid overlay (columns A-P, rows 1-24).

Find every text element and report its grid cell position.

Return ONLY valid JSON (no markdown, no explanation):
{
  "sheetBgColor": "#hex of background",
  "fields": [
    {"id": "brand", "cells": "A1:C1", "text": "visible text", "fontSize": 3, "type": "text", "editable": true},
    {"id": "sheetTitle", "cells": "N1:P1", "text": "...", "fontSize": 2, "type": "text", "editable": true},
    {"id": "productName", "cells": "A2:F2", "text": "...", "fontSize": 2, "type": "text", "editable": true},
    {"id": "f-productType", "cells": "...", "text": "...", "fontSize": 1, "type": "text", "editable": true},
    {"id": "l-productType", "cells": "...", "text": "...", "fontSize": 1, "type": "label", "editable": false},
    {"id": "f-style", "cells": "...", "text": "...", "fontSize": 1, "type": "text", "editable": true},
    {"id": "f-material", "cells": "...", "text": "...", "fontSize": 1, "type": "text", "editable": true},
    {"id": "f-finish", "cells": "...", "text": "...", "fontSize": 1, "type": "text", "editable": true},
    {"id": "f-feature", "cells": "...", "text": "...", "fontSize": 1, "type": "text", "editable": true},
    {"id": "f-width", "cells": "...", "text": "...", "fontSize": 1, "type": "number", "editable": true},
    {"id": "f-height", "cells": "...", "text": "...", "fontSize": 1, "type": "number", "editable": true},
    {"id": "f-depth", "cells": "...", "text": "...", "fontSize": 1, "type": "number", "editable": true},
    {"id": "f-weight", "cells": "...", "text": "...", "fontSize": 1, "type": "number", "editable": true},
    {"id": "ann-1", "cells": "...", "text": "...", "fontSize": 1, "type": "text", "editable": true},
    {"id": "ann-2", "cells": "...", "text": "...", "fontSize": 1, "type": "text", "editable": true},
    {"id": "ann-3", "cells": "...", "text": "...", "fontSize": 1, "type": "text", "editable": true}
  ]
}

Rules:
- fontSize: 1=small, 2=medium, 3=large
- type: "text" for values, "number" for dimensions/weight, "label" for field labels, "color" for palette
- editable: true for values, false for labels
- cells: grid range like "A1:C1" or single "B3"
- id pattern: brand, sheetTitle, productName, f-XXX (values), l-XXX (labels), ann-N (annotations), pal-N (palette)
- Include ALL visible text on the sheet
- Find as many fields as possible but quality over quantity`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: "You are a layout detection AI. You analyze images with grid overlays and return field positions as JSON. You ALWAYS return valid JSON, never markdown.",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url" as const,
              image_url: { url: griddedImage },
            },
            {
              type: "text" as const,
              text: prompt,
            },
          ],
        },
      ],
      max_completion_tokens: 4096,
    });

    const content = completion.choices[0]?.message?.content || "";
    console.log("[detect-positions] VLM response length:", content.length);
    console.log("[detect-positions] VLM first 300 chars:", content.slice(0, 300));
    console.log("[detect-positions] VLM last 200 chars:", content.slice(-200));
    console.log("[detect-positions] Finish reason:", completion.choices[0]?.finish_reason);

    // Parse with ultra-robust parser
    const parsed = robustJSONParse(content) as DetectPositionsResult;

    if (!parsed.fields || !Array.isArray(parsed.fields)) {
      throw new Error(
        `Parsed JSON has no fields array. Got keys: ${Object.keys(parsed).join(", ")}. Raw (first 500): ${content.slice(0, 500)}`
      );
    }

    const cellW = imgW / GRID_COLS;
    const cellH = imgH / GRID_ROWS;

    const enhancedFields = (parsed.fields || []).map((field: DetectedField) => {
      const pixels = cellsToPixels(field.cells, cellW, cellH);
      return {
        ...field,
        x: pixels.x,
        y: pixels.y,
        w: pixels.w,
        h: pixels.h,
      };
    });

    console.log("[detect-positions] Successfully detected", enhancedFields.length, "fields");

    return NextResponse.json({
      result: {
        sheetBgColor: parsed.sheetBgColor || "#E5E5E5",
        fields: enhancedFields,
        imageWidth: imgW,
        imageHeight: imgH,
      },
    });
  } catch (error: unknown) {
    console.error("[detect-positions] ERROR:", error);
    const message = error instanceof Error ? error.message : "Error detecting positions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function cellsToPixels(
  cellRange: string,
  cellW: number,
  cellH: number
): { x: number; y: number; w: number; h: number } {
  const parts = cellRange.split(":");
  const startCell = parts[0].trim();
  const endCell = parts.length > 1 ? parts[1].trim() : startCell;

  const start = parseCell(startCell);
  const end = parseCell(endCell);

  const x = start.col * cellW;
  const y = (start.row - 1) * cellH;
  const w = (end.col - start.col + 1) * cellW;
  const h = (end.row - start.row + 1) * cellH;

  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

function parseCell(cell: string): { col: number; row: number } {
  const match = cell.match(/^([A-P])(\d+)$/i);
  if (!match) {
    return { col: 0, row: 1 };
  }
  const col = match[1].toUpperCase().charCodeAt(0) - 65;
  const row = parseInt(match[2], 10);
  return { col, row };
}
