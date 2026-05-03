import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, dimensions, brand } = body;

    const openai = getOpenAI();

    // Use gpt-5-mini vision to analyze the furniture image
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
              type: "image_url",
              image_url: { url: image, detail: "high" },
            },
            {
              type: "text",
              text: `Analiza la imagen del mueble y genera los datos para una ficha técnica profesional.

Las dimensiones reales proporcionadas por el usuario son:
- Ancho: ${dimensions.width} cm
- Alto: ${dimensions.height} cm
- Profundidad: ${dimensions.depth} cm
${dimensions.seatHeight ? `- Altura del asiento: ${dimensions.seatHeight} cm` : ""}
Marca: ${brand}

Devuelve SOLO un objeto JSON válido con esta estructura exacta (bilingüe, métrico e imperial):

{
  "productType": "<tipo de producto en español>",
  "style": "<estilo en español>",
  "material": {
    "main": "<material principal en español>",
    "details": ["<detalle 1>", "<detalle 2>"]
  },
  "finish": "<acabado en español>",
  "feature": "<característica distintiva en español>",
  "dimensions": {
    "height": ${dimensions.height},
    "width": ${dimensions.width},
    "depth": ${dimensions.depth},
    "seatHeight": ${dimensions.seatHeight || null}
  },
  "weight": <peso estimado en kg>,
  "annotations": [
    "<anotación sobre material/union en español>",
    "<anotación sobre textura/acabado en español>",
    "<anotación sobre detalle funcional en español>"
  ],
  "colorPalette": {
    "primary": "<hex del color principal del material>",
    "primaryName": "<nombre del color en español>",
    "secondary": "<hex del color secundario>",
    "secondaryName": "<nombre del color secundario en español>",
    "pearlGray": "#E5E5E5",
    "darkGray": "#4A4A4A"
  },
  "brand": "${brand}",
  "productName": "<nombre sugerido del producto en español>",
  "renderViews": ["frontal", "lateral", "superior", "perspectiva"]
}

Usa las dimensiones proporcionadas por el usuario exactamente. Estima el peso basándote en el material y tamaño. Extrae los colores de la imagen. Todo en español.`,
            },
          ],
        },
      ],
      max_completion_tokens: 2000,
    });

    // Parse the response
    const content = analysis.choices[0]?.message?.content || "";
    let data;
    try {
      data = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\\s*([\\s\\S]*?)```/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[1].trim());
      } else {
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
    const message =
      error instanceof Error ? error.message : "Error analyzing photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
