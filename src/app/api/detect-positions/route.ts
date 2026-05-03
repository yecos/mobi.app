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

    const prompt = `You are a precise layout detector. This image has a 16-column × 24-row grid overlaid on a furniture technical sheet (ficha técnica).

GRID SYSTEM:
- Columns: A through P (16 columns)
- Rows: 1 through 24 (24 rows)
- Each cell is identified like "B3", "H12", etc.
- A range of cells is written like "B2:D2" (spanning columns B-D on row 2)

YOUR TASK:
1. Identify the background color of the sheet (the main fill color behind all content)
2. Find EVERY piece of text, number, or label on the sheet
3. For each one, report which grid cell(s) it occupies

The furniture data that was used to generate this sheet:
${JSON.stringify(furnitureData, null, 2)}

Return ONLY a valid JSON object with this exact structure:
{
  "sheetBgColor": "#hex",
  "fields": [
    {
      "id": "brand",
      "cells": "A1:C1",
      "text": "VIVA MOBILI",
      "fontSize": 3,
      "type": "text",
      "editable": true
    },
    {
      "id": "sheetTitle",
      "cells": "N1:P1",
      "text": "FICHA TÉCNICA",
      "fontSize": 2,
      "type": "text",
      "editable": true
    },
    {
      "id": "productName",
      "cells": "A2:F2",
      "text": "Product name here",
      "fontSize": 2,
      "type": "text",
      "editable": true
    },
    {
      "id": "f-productType",
      "cells": "A8:C8",
      "text": "Chair",
      "fontSize": 1,
      "type": "text",
      "editable": true
    },
    {
      "id": "l-productType",
      "cells": "A7:C7",
      "text": "TIPO / TYPE",
      "fontSize": 1,
      "type": "label",
      "editable": false
    },
    {
      "id": "f-style",
      "cells": "A10:C10",
      "text": "Scandinavian",
      "fontSize": 1,
      "type": "text",
      "editable": true
    },
    {
      "id": "l-style",
      "cells": "A9:C9",
      "text": "ESTILO / STYLE",
      "fontSize": 1,
      "type": "label",
      "editable": false
    },
    {
      "id": "f-material",
      "cells": "A12:D12",
      "text": "Oak wood",
      "fontSize": 1,
      "type": "text",
      "editable": true
    },
    {
      "id": "l-material",
      "cells": "A11:D11",
      "text": "MATERIAL",
      "fontSize": 1,
      "type": "label",
      "editable": false
    },
    {
      "id": "f-finish",
      "cells": "A14:D14",
      "text": "Natural lacquer",
      "fontSize": 1,
      "type": "text",
      "editable": true
    },
    {
      "id": "l-finish",
      "cells": "A13:D13",
      "text": "ACABADO / FINISH",
      "fontSize": 1,
      "type": "label",
      "editable": false
    },
    {
      "id": "f-feature",
      "cells": "A16:E16",
      "text": "Ergonomic design",
      "fontSize": 1,
      "type": "text",
      "editable": true
    },
    {
      "id": "l-feature",
      "cells": "A15:E15",
      "text": "CARACTERÍSTICA",
      "fontSize": 1,
      "type": "label",
      "editable": false
    },
    {
      "id": "f-width",
      "cells": "K8:M8",
      "text": "130",
      "fontSize": 1,
      "type": "number",
      "editable": true
    },
    {
      "id": "l-width",
      "cells": "K7:M7",
      "text": "ANCHO / WIDTH",
      "fontSize": 1,
      "type": "label",
      "editable": false
    },
    {
      "id": "f-height",
      "cells": "K10:M10",
      "text": "75",
      "fontSize": 1,
      "type": "number",
      "editable": true
    },
    {
      "id": "l-height",
      "cells": "K9:M9",
      "text": "ALTO / HEIGHT",
      "fontSize": 1,
      "type": "label",
      "editable": false
    },
    {
      "id": "f-depth",
      "cells": "K12:M12",
      "text": "55",
      "fontSize": 1,
      "type": "number",
      "editable": true
    },
    {
      "id": "l-depth",
      "cells": "K11:M11",
      "text": "PROF. / DEPTH",
      "fontSize": 1,
      "type": "label",
      "editable": false
    },
    {
      "id": "f-seatHeight",
      "cells": "K14:M14",
      "text": "45",
      "fontSize": 1,
      "type": "number",
      "editable": true
    },
    {
      "id": "l-seatHeight",
      "cells": "K13:M13",
      "text": "ALT. ASIENTO",
      "fontSize": 1,
      "type": "label",
      "editable": false
    },
    {
      "id": "f-weight",
      "cells": "K16:M16",
      "text": "8",
      "fontSize": 1,
      "type": "number",
      "editable": true
    },
    {
      "id": "l-weight",
      "cells": "K15:M15",
      "text": "PESO / WEIGHT",
      "fontSize": 1,
      "type": "label",
      "editable": false
    },
    {
      "id": "ann-1",
      "cells": "A20:H20",
      "text": "Solid oak joinery",
      "fontSize": 1,
      "type": "text",
      "editable": true
    },
    {
      "id": "ann-2",
      "cells": "A21:H21",
      "text": "Natural grain texture",
      "fontSize": 1,
      "type": "text",
      "editable": true
    },
    {
      "id": "ann-3",
      "cells": "A22:H22",
      "text": "Stackable design",
      "fontSize": 1,
      "type": "text",
      "editable": true
    },
    {
      "id": "pal-1",
      "cells": "A24:B24",
      "text": "#8B6914",
      "fontSize": 1,
      "type": "color",
      "editable": true
    },
    {
      "id": "pal-2",
      "cells": "C24:D24",
      "text": "#D4C5A9",
      "fontSize": 1,
      "type": "color",
      "editable": true
    }
  ]
}

CRITICAL RULES:
- fontSize: 1 = small (specs/labels), 2 = medium (section headers), 3 = large (main title/brand)
- Include ALL visible text, numbers, and labels
- Use the cell range to show the FULL span of each text element
- For the "text" field, write exactly what you see in the image
- The "id" must follow the pattern shown above (brand, sheetTitle, productName, f-XXX for values, l-XXX for labels, ann-N for annotations, pal-N for palette colors)
- "editable" is true for values and brand/title/name, false for labels
- sheetBgColor must be the hex color of the main background behind the content
- Be thorough — every single piece of text on the sheet must have an entry
- Return ONLY the JSON, no markdown, no explanation`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: "You are a precise layout detection AI. You analyze images with grid overlays and return exact cell positions for every text element. You always return valid JSON.",
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

    let result: DetectPositionsResult;
    try {
      result = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1].trim());
      } else {
        const objMatch = content.match(/\{[\s\S]*\}/);
        if (objMatch) {
          result = JSON.parse(objMatch[0]);
        } else {
          throw new Error("Could not parse position detection response as JSON");
        }
      }
    }

    const cellW = imgW / GRID_COLS;
    const cellH = imgH / GRID_ROWS;

    const enhancedFields = (result.fields || []).map((field: DetectedField) => {
      const pixels = cellsToPixels(field.cells, cellW, cellH);
      return {
        ...field,
        x: pixels.x,
        y: pixels.y,
        w: pixels.w,
        h: pixels.h,
      };
    });

    return NextResponse.json({
      result: {
        sheetBgColor: result.sheetBgColor || "#E5E5E5",
        fields: enhancedFields,
        imageWidth: imgW,
        imageHeight: imgH,
      },
    });
  } catch (error: unknown) {
    console.error("Error detecting positions:", error);
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
