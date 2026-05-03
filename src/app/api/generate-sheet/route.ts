import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { furnitureData, type } = body; // type: "complete" or "clean"

    const openai = getOpenAI();

    // Build the prompt based on type
    let prompt: string;

    if (type === "complete") {
      // PROMPT 2: Ficha COMPLETA con texto
      const d = furnitureData;
      const seatLine = d.dimensions.seatHeight ? `\n- Seat height: ${d.dimensions.seatHeight} cm` : "";
      const seatDimLine = d.dimensions.seatHeight ? `\n- Seat height dimension line (vertical, with arrows) labeled ${d.dimensions.seatHeight}cm` : "";

      prompt = `Generate a realistic technical product sheet for a ${d.productType} in ${d.style} style made of ${d.material.main} with ${d.finish} finish.

The furniture dimensions are:
- Width: ${d.dimensions.width} cm
- Height: ${d.dimensions.height} cm
- Depth: ${d.dimensions.depth} cm${seatLine}

Include ALL of the following elements:

LAYOUT:
- Canvas size: 1200 x 1600 pixels, portrait orientation
- Pearl gray background (#E5E5E5)
- ${d.brand} logo header at the top left
- "FICHA TÉCNICA" title at the top right

FOUR VIEWS — arranged in a single row:
- Front view (leftmost)
- Side view
- Top view
- Elevated ¾ perspective (rightmost)
- Rendered photorealistically on pearl gray background
- Each view clearly framed with thin border lines

DIMENSION LINES (in centimeters):
- Height dimension line (vertical, with arrows) labeled ${d.dimensions.height}cm
- Width dimension line (horizontal, with arrows) labeled ${d.dimensions.width}cm
- Depth dimension line (horizontal, with arrows) labeled ${d.dimensions.depth}cm${seatDimLine}

ANNOTATIONS:
- Numbered pointers pointing to material, joinery, texture, and functional highlights:
  ① ${d.annotations[0] || "Material detail"}
  ② ${d.annotations[1] || "Construction detail"}
  ③ ${d.annotations[2] || "Functional detail"}

SPECIFICATION SECTIONS:
- Material: ${d.material.main}
- Finish: ${d.finish}
- Feature: ${d.feature}
- Width: ${d.dimensions.width} cm
- Height: ${d.dimensions.height} cm
- Depth: ${d.dimensions.depth} cm
- Weight: ${d.weight} kg

DESIGN HIGHLIGHTS with icons:
- Texture icon + ${d.material.main} texture
- Structure icon + construction detail
- Function icon + ${d.feature}

COLOR PALETTE STRIP at the bottom:
- ${d.colorPalette.primaryName} (${d.colorPalette.primary})
- ${d.colorPalette.secondaryName} (${d.colorPalette.secondary})
- Pearl Gray (#E5E5E5)
- Dark Gray (#4A4A4A)

QUALITY:
- High resolution, photorealistic quality
- Architectural precision
- Balanced lighting
- Professional typography
- Clean, technical aesthetic`;
    } else {
      // PROMPT 3: Ficha SIN TEXTO
      prompt = `Generate EXACTLY the same technical product sheet design you just created, but with ALL text, numbers, labels, and annotations REMOVED.

KEEP:
- The exact same layout and composition
- The exact same four view frames (front, side, top, ¾ perspective)
- The same furniture images in each view frame
- The same dimension line structures (lines and arrows only, NO numbers)
- The same specification section layout areas (empty rectangles/shapes)
- The same annotation pointer lines (without any text)
- The same color palette strip rectangles (colored, without text)
- The same header area shape (empty)
- The same decorative elements, borders, and frames
- The same overall design aesthetic and color scheme

REMOVE:
- ALL text (brand name, title, labels, values, section names)
- ALL numbers (dimensions, weight, measurements)
- ALL annotation text content
- ALL icon symbols
- ALL color palette names and hex codes

Leave clean empty spaces where text was.
The dimension lines should show the arrows and lines but NO measurement numbers.

The result should be a clean visual template — the structural design without any textual content.

Same 1200 x 1600 pixels, pearl gray background (#E5E5E5).`;
    }

    // Generate image with OpenAI Image model (gpt-image-1)
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536", // portrait, closest to 1200x1600
      quality: "high",
      response_format: "b64_json",
    });

    const imageData = response.data?.[0]?.b64_json;
    if (!imageData) {
      throw new Error("No image generated");
    }

    return NextResponse.json({
      image: `data:image/png;base64,${imageData}`,
    });
  } catch (error: unknown) {
    console.error("Error generating sheet:", error);
    const message = error instanceof Error ? error.message : "Error generating sheet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
