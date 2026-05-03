import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, dimensions, brand } = body;

    const openai = getOpenAI();

    const analysis = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a furniture analysis expert. Analyze the uploaded furniture image and identify product type, style, main material, finish, distinctive features, and estimate weight. Return ONLY valid JSON.`,
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
              text: `Analyze this furniture image. The real dimensions provided by the user are: Width: ${dimensions.width}cm, Height: ${dimensions.height}cm, Depth: ${dimensions.depth}cm${dimensions.seatHeight ? `, Seat height: ${dimensions.seatHeight}cm` : ""}. Brand: ${brand}.

Return ONLY a valid JSON object with this exact structure:
{
  "productType": "detected type (chair, table, sofa, etc.)",
  "style": "detected style",
  "material": {
    "main": "main material",
    "details": ["detail1", "detail2"]
  },
  "finish": "finish description",
  "feature": "most distinctive feature",
  "dimensions": {
    "height": ${dimensions.height},
    "width": ${dimensions.width},
    "depth": ${dimensions.depth},
    "seatHeight": ${dimensions.seatHeight || null}
  },
  "weight": estimated_weight_in_kg,
  "annotations": [
    "annotation about material/joinery",
    "annotation about texture/finish",
    "annotation about functional detail"
  ],
  "colorPalette": {
    "primary": "#hex of main material color",
    "primaryName": "color name",
    "secondary": "#hex of secondary color",
    "secondaryName": "color name",
    "pearlGray": "#E5E5E5",
    "darkGray": "#4A4A4A"
  },
  "brand": "${brand}",
  "productName": "suggested product name",
  "renderViews": ["front", "side", "top", "perspective"]
}

Use the user-provided dimensions exactly. Estimate weight based on material and size. Extract colors from the image.`,
            },
          ],
        },
      ],
      max_completion_tokens: 2048,
    });

    const content = analysis.choices[0]?.message?.content || "";
    console.log("[analyze-photo] VLM response length:", content.length);
    console.log("[analyze-photo] Finish reason:", analysis.choices[0]?.finish_reason);

    let data;
    try {
      data = JSON.parse(content);
    } catch {
      // Try markdown code block
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try {
          data = JSON.parse(codeBlockMatch[1].trim().replace(/,\s*([}\]])/g, "$1"));
        } catch {}
      }
      if (!data) {
        // Extract JSON object with balanced braces
        const firstBrace = content.indexOf("{");
        if (firstBrace !== -1) {
          let depth = 0;
          let lastValidEnd = -1;
          for (let i = firstBrace; i < content.length; i++) {
            if (content[i] === "{") depth++;
            else if (content[i] === "}") {
              depth--;
              if (depth === 0) { lastValidEnd = i + 1; break; }
            }
          }
          if (lastValidEnd > firstBrace) {
            const extracted = content.slice(firstBrace, lastValidEnd).replace(/,\s*([}\]])/g, "$1");
            try { data = JSON.parse(extracted); } catch {}
          }
        }
      }
      if (!data) {
        console.error("[analyze-photo] Failed to parse. Raw (first 500):", content.slice(0, 500));
        throw new Error("Could not parse AI response as JSON");
      }
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error("Error analyzing photo:", error);
    const message = error instanceof Error ? error.message : "Error analyzing photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
