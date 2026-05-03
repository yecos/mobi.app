import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { furnitureData } = body;

    const openai = getOpenAI();

    const d = furnitureData;
    const seatLine = d.dimensions.seatHeight
      ? `\n- Altura del asiento: ${d.dimensions.seatHeight} cm`
      : "";
    const seatCota = d.dimensions.seatHeight
      ? `\n- Línea de cota vertical para altura del asiento: ${d.dimensions.seatHeight} cm`
      : "";

    const prompt = `Genera una ficha técnica profesional para un ${d.productType} en estilo ${d.style}, fabricado en ${d.material.main} con acabado ${d.finish}.

ESPAÑOL (Sistema Métrico)

Incluye TODOS los siguientes elementos:

TIPO DE PRODUCTO: ${d.productType}
ESTILO: ${d.style}
MATERIAL PRINCIPAL: ${d.material.main}
ACABADO: ${d.finish}
CARACTERÍSTICA DISTINTIVA: ${d.feature}

DIMENSIONES EN CENTÍMETROS:
- Ancho: ${d.dimensions.width} cm
- Alto: ${d.dimensions.height} cm
- Profundidad: ${d.dimensions.depth} cm${seatLine}
- Peso estimado: ${d.weight} kg

CUATRO VISTAS FOTORREALISTAS: frontal, lateral, superior y perspectiva ¾, sobre fondo gris perla.
LÍNEAS DE COTA en centímetros:
- Línea de cota horizontal para ancho: ${d.dimensions.width} cm
- Línea de cota vertical para alto: ${d.dimensions.height} cm
- Línea de cota horizontal para profundidad: ${d.dimensions.depth} cm${seatCota}

ANOTACIONES NUMERADAS:
① ${d.annotations[0] || "Detalle del material"}
② ${d.annotations[1] || "Detalle de construcción"}
③ ${d.annotations[2] || "Detalle funcional"}
${d.annotations[3] ? `④ ${d.annotations[3]}` : ""}

SECCIÓN DE ESPECIFICACIONES:
- Material: ${d.material.main}
- Acabado: ${d.finish}
- Característica: ${d.feature}
- Ancho: ${d.dimensions.width} cm
- Alto: ${d.dimensions.height} cm
- Profundidad: ${d.dimensions.depth} cm
- Peso: ${d.weight} kg

ICONOS DE DISEÑO para textura, estructura y funcionalidad.
FRANJA DE PALETA DE COLOR: ${d.colorPalette.primaryName || "Principal"} (${d.colorPalette.primary}), ${d.colorPalette.secondaryName || "Secundario"} (${d.colorPalette.secondary}), Gris Perla (#E5E5E5), Gris Oscuro (#4A4A4A).
ENCABEZADO Y LOGOTIPO ${d.brand} para coherencia de marca.
Título: "FICHA TÉCNICA"

CALIDAD:
- Alta resolución, calidad fotorrealista
- Precisión arquitectónica
- Iluminación equilibrada
- Tipografía profesional
- Estética técnica limpia
- Fondo gris perla (#E5E5E5)
- Orientación vertical`;

    // Generate image with gpt-image-1
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
    });

    const imageData = response.data?.[0]?.b64_json;
    if (!imageData) {
      throw new Error("No image generated");
    }

    // gpt-image-1 returns base64 by default
    return NextResponse.json({
      image: `data:image/png;base64,${imageData}`,
    });
  } catch (error: unknown) {
    console.error("Error generating sheet:", error);
    const message =
      error instanceof Error ? error.message : "Error generating sheet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
