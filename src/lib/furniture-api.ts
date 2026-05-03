import type {
  Furniture,
  FurnitureListResponse,
  FilterState,
} from "@/types/furniture";

export async function fetchFurnitureList(
  filters: FilterState,
  page = 1,
  pageSize = 20
): Promise<FurnitureListResponse> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (filters.search) params.set("search", filters.search);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
  if (filters.priceMin != null) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax != null) params.set("priceMax", String(filters.priceMax));
  if (filters.material) params.set("material", filters.material);
  if (filters.sort) params.set("sort", filters.sort);

  const res = await fetch(`/api/furniture?${params.toString()}`);
  if (!res.ok) throw new Error("Error cargando muebles");
  return res.json();
}

export async function fetchFurnitureById(id: string): Promise<Furniture> {
  const res = await fetch(`/api/furniture/${id}`);
  if (!res.ok) throw new Error("Error cargando detalle del mueble");
  return res.json();
}
