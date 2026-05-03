import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") ?? "";
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const tagsParam = searchParams.get("tags") ?? "";
    const priceMin = searchParams.get("priceMin");
    const priceMax = searchParams.get("priceMax");
    const material = searchParams.get("material") ?? undefined;
    const sort = searchParams.get("sort") ?? "newest";
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);

    const where: Record<string, unknown> = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { designer: { contains: search } },
        { primaryMaterial: { contains: search } },
      ];
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Price range
    if (priceMin || priceMax) {
      const priceFilter: Record<string, number> = {};
      if (priceMin) priceFilter.gte = parseFloat(priceMin);
      if (priceMax) priceFilter.lte = parseFloat(priceMax);
      where.basePrice = priceFilter;
    }

    // Material filter
    if (material) {
      where.primaryMaterial = { contains: material };
    }

    // Tags filter
    if (tagsParam) {
      const tagNames = tagsParam.split(",").filter(Boolean);
      if (tagNames.length > 0) {
        where.tags = {
          some: {
            name: { in: tagNames },
          },
        };
      }
    }

    // Sort
    type OrderBy = Record<string, string>;
    let orderBy: OrderBy = { createdAt: "desc" };
    switch (sort) {
      case "name-asc":
        orderBy = { name: "asc" };
        break;
      case "price-asc":
        orderBy = { basePrice: "asc" };
        break;
      case "price-desc":
        orderBy = { basePrice: "desc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      db.furniture.findMany({
        where,
        include: {
          category: true,
          variants: true,
          images: { orderBy: { sortOrder: "asc" } },
          tags: true,
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      db.furniture.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching furniture:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
