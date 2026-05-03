import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { furnitureData } = body;

    const openai = getOpenAI();

    const d = furnitureData;
    const seatLine = d.dimensions.seatHeight ? `\n- Seat height: ${d.dimensions.seatHeight} cm` : "";
    const seatDimLine = d.dimensions.seatHeight ? `\n- Seat height dimension line (vertical, with arrows) labeled ${d.dimensions.seatHeight}cm` : "";

    const prompt = `Generate a professional furniture technical sheet (ficha técnica) for a ${d.productType}.

**ESPAÑOL (Sistema Métrico)**
- Tipo de producto: ${d.productType}, Estilo: ${d.style}, Material principal: ${d.material.main}, Acabado/color: ${d.finish}, Característica distintiva: ${d.feature}
- Cuatro vistas fotorealistas: frontal, lateral, superior y perspectiva ¾, sobre fondo gris perla
- Líneas de cota en centímetros para altura (${d.dimensions.height}cm), ancho (${d.dimensions.width}cm), profundidad (${d.dimensions.depth}cm)${d.dimensions.seatHeight ? ` y altura del asiento (${d.dimensions.seatHeight}cm)` : ""}
- Anotaciones sobre material, uniones, textura y detalles funcionales:
  ① ${d.annotations[0] || "Material detail"}
  ② ${d.annotations[1] || "Construction detail"}
  ③ ${d.annotations[2] || "Functional detail"}
- Sección de especificaciones: Material ${d.material.main}, Acabado ${d.finish}, Característica ${d.feature}, Ancho ${d.dimensions.width}cm, Alto ${d.dimensions.height}cm, Profundidad ${d.dimensions.depth}cm, Peso ${d.weight}kg
- Iconos de diseño: textura, estructura, función
- Franja de paleta de color: ${d.colorPalette.primaryName} (${d.colorPalette.primary}), ${d.colorPalette.secondaryName} (${d.colorPalette.secondary}), Gris Perla (#E5E5E5), Gris Oscuro (#4A4A4A)
- Encabezado: logotipo "${d.brand}" arriba a la izquierda, "FICHA TÉCNICA" arriba a la derecha
- Nombre del producto: "${d.productName}" debajo del encabezado

**LAYOUT:**
- Portrait orientation, pearl gray background (#E5E5E5)
- Professional architectural/technical aesthetic
- Clean, balanced composition with generous spacing
- High resolution, photorealistic quality for the furniture views
- Professional typography with clear hierarchy
- Dimension lines with arrows and measurement labels
- All text must be clearly readable and well-positioned

**QUALITY:**
- High resolution, photorealistic quality
- Architectural precision
- Balanced lighting
- Professional typography
- Clean, technical aesthetic`;

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
    });

    const imageData = response.data?.[0];
    if (!imageData) {
      throw new Error("No image generated");
    }

    const base64 = (imageData as Record<string, unknown>).b64_json || (imageData as Record<string, unknown>).base64;
    if (!base64) {
      throw new Error("No image data returned from API");
    }

    return NextResponse.json({
      image: `data:image/png;base64,${base64}`,
    });
  } catch (error: unknown) {
    console.error("Error generating sheet:", error);
    const message = error instanceof Error ? error.message : "Error generating sheet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
