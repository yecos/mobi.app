import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

interface TextRegionRaw {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
  editable: boolean;
}

interface DetectResult {
  regions: TextRegionRaw[];
}

/**
 * Ultra-robust JSON parser that handles all VLM output formats.
 */
function robustJSONParse(raw: string): unknown {
  const cleaned = raw.trim();

  // 1. Direct parse
  try { return JSON.parse(cleaned); } catch {}

  // 2. Markdown code block
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    const blockContent = codeBlockMatch[1].trim().replace(/,\s*([}\]])/g, "$1");
    try { return JSON.parse(blockContent); } catch {}
  }

  // 3. Balanced braces extraction
  const firstBrace = cleaned.indexOf("{");
  if (firstBrace !== -1) {
    let depth = 0;
    let lastValidEnd = -1;
    for (let i = firstBrace; i < cleaned.length; i++) {
      if (cleaned[i] === "{") depth++;
      else if (cleaned[i] === "}") {
        depth--;
        if (depth === 0) { lastValidEnd = i + 1; break; }
      }
    }
    if (lastValidEnd > firstBrace) {
      const extracted = cleaned.slice(firstBrace, lastValidEnd).replace(/,\s*([}\]])/g, "$1");
      try { return JSON.parse(extracted); } catch {}
    }

    // 4. Truncated JSON — try to fix
    if (lastValidEnd === -1) {
      const partial = cleaned.slice(firstBrace).replace(/,\s*([}\]])/g, "$1");
      let fixed = partial.trimEnd().replace(/,\s*"[^"]*"?\s*$/, "").replace(/,\s*$/, "");
      const openBraces = (fixed.match(/{/g) || []).length;
      const closeBraces = (fixed.match(/}/g) || []).length;
      const openBrackets = (fixed.match(/\[/g) || []).length;
      const closeBrackets = (fixed.match(/]/g) || []).length;
      for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += "]";
      for (let i = 0; i < openBraces - closeBraces; i++) fixed += "}";
      try { return JSON.parse(fixed); } catch {}
    }
  }

  throw new Error(`Could not parse JSON. Raw response (first 800 chars): ${cleaned.slice(0, 800)}`);
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

    const openai = getOpenAI();

    const prompt = `You are a text detection AI. Analyze this image and find ALL text elements.

The image is ${imageWidth}px wide and ${imageHeight}px tall.

For EACH text element you find, report:
- id: unique identifier (e.g. "text-1", "text-2", etc.)
- x: horizontal position as PERCENTAGE from left edge (0-100)
- y: vertical position as PERCENTAGE from top edge (0-100)
- w: width as PERCENTAGE of total image width
- h: height as PERCENTAGE of total image height
- text: the exact text content you see
- fontSize: approximate font size in pixels (relative to ${imageWidth}px image width)
- color: text color as hex code (e.g. "#1a1a1a")
- bold: true if text appears bold, false otherwise
- editable: true for ALL fields (user can edit everything)

IMPORTANT RULES:
1. Detect EVERY piece of visible text — headers, labels, values, numbers, annotations, brand names, measurements, everything
2. Be as PRECISE as possible with positioning — x,y should point to the top-left corner of the text bounding box
3. w,h should tightly wrap the text — not too large, not too small
4. fontSize should match the visual size of the text in the original image
5. Group text that belongs together (e.g. "FICHA TÉCNICA" is ONE region, not separate words)
6. For labels and their values that are close together, keep them as SEPARATE regions (e.g. "Material:" label is one region, "Roble" value is another)
7. Order regions from top to bottom, left to right

Return ONLY a valid JSON object with this exact structure:
{
  "regions": [
    {"id": "text-1", "x": 5.0, "y": 2.5, "w": 20.0, "h": 4.0, "text": "BRAND NAME", "fontSize": 28, "color": "#1a1a1a", "bold": true, "editable": true},
    {"id": "text-2", "x": 75.0, "y": 2.5, "w": 22.0, "h": 4.0, "text": "FICHA TECNICA", "fontSize": 24, "color": "#4A4A4A", "bold": true, "editable": true}
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a precise text detection AI. You analyze images and return exact positions of all text elements as JSON. You ALWAYS return valid JSON. Never include markdown formatting or explanations.",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url" as const,
              image_url: { url: image },
            },
            {
              type: "text" as const,
              text: prompt,
            },
          ],
        },
      ],
      max_completion_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "";
    console.log("[detect-text] VLM response length:", content.length);
    console.log("[detect-text] VLM first 300 chars:", content.slice(0, 300));
    console.log("[detect-text] Finish reason:", completion.choices[0]?.finish_reason);

    // Parse with robust parser (response_format: json_object should give valid JSON,
    // but we keep the fallback for safety)
    let parsed: DetectResult;
    try {
      parsed = JSON.parse(content) as DetectResult;
    } catch {
      parsed = robustJSONParse(content) as DetectResult;
    }

    if (!parsed.regions || !Array.isArray(parsed.regions)) {
      throw new Error(
        `Parsed JSON has no regions array. Got keys: ${Object.keys(parsed).join(", ")}. Raw (first 500): ${content.slice(0, 500)}`
      );
    }

    // Validate and clean regions (parsed from JSON, so types are loose)
    const rawRegions = (parsed.regions as unknown) as Record<string, unknown>[];
    const regions: TextRegionRaw[] = rawRegions
      .filter((r) => r.id && typeof r.x === "number" && typeof r.y === "number")
      .map((r, index) => ({
        id: (r.id as string) || `text-${index + 1}`,
        x: Math.max(0, Math.min(100, (r.x as number) || 0)),
        y: Math.max(0, Math.min(100, (r.y as number) || 0)),
        w: Math.max(1, (r.w as number) || 5),
        h: Math.max(1, (r.h as number) || 2),
        text: String(r.text || ""),
        fontSize: Math.max(8, (r.fontSize as number) || 14),
        color: String(r.color || "#1a1a1a"),
        bold: Boolean(r.bold),
        editable: true,
      }));

    console.log("[detect-text] Successfully detected", regions.length, "text regions");

    return NextResponse.json({
      result: {
        regions,
        imageWidth,
        imageHeight,
      },
    });
  } catch (error: unknown) {
    console.error("[detect-text] ERROR:", error);
    const message = error instanceof Error ? error.message : "Error detecting text";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
