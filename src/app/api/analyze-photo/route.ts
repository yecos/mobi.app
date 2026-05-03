import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, dimensions, brand } = body;

    const openai = getOpenAI();

    // Use GPT-5.4-mini vision to analyze the furniture image
    const analysis = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      messages: [
        {
          role: "system",
          content: `You are a furniture analysis expert. Analyze the uploaded furniture image and identify product type, style, main material, finish, distinctive features, and estimate weight. Return ONLY valid JSON.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: image, detail: "high" },
            },
            {
              type: "text",
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
      max_completion_tokens: 2000,
    });

    // Parse the response
    const content = analysis.choices[0]?.message?.content || "";
    // Try to extract JSON from the response
    let data;
    try {
      // Try direct parse first
      data = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find JSON object in the text
        const objMatch = content.match(/\{[\s\S]*\}/);
        if (objMatch) {
          data = JSON.parse(objMatch[0]);
        } else {
          throw new Error("Could not parse AI response as JSON");
        }
      }
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error("Error analyzing photo:", error);
    const message = error instanceof Error ? error.message : "Error analyzing photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
