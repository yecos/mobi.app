import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const furniture = await db.furniture.findUnique({
      where: { id },
      include: {
        category: true,
        variants: { orderBy: { name: "asc" } },
        images: { orderBy: { sortOrder: "asc" } },
        tags: { orderBy: { name: "asc" } },
      },
    });

    if (!furniture) {
      return NextResponse.json(
        { error: "Mueble no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(furniture);
  } catch (error) {
    console.error("Error fetching furniture detail:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
