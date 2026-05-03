export interface FurnitureVariant {
  id: string;
  furnitureId: string;
  name: string;
  colorHex: string;
  materialSwatch: string | null;
  modelPath: string | null;
  priceOffset: number;
  inStock: boolean;
}

export interface FurnitureImage {
  id: string;
  furnitureId: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

export interface FurnitureTag {
  id: string;
  furnitureId: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  icon: string | null;
}

export interface Furniture {
  id: string;
  slug: string;
  name: string;
  description: string;
  designer: string | null;
  categoryId: string;
  category: Category;
  basePrice: number;
  salePrice: number | null;
  widthCm: number;
  depthCm: number;
  heightCm: number;
  seatHeightCm: number | null;
  weightKg: number;
  primaryMaterial: string;
  modelPath: string;
  thumbnailPath: string;
  isNew: boolean;
  isFeatured: boolean;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
  variants: FurnitureVariant[];
  images: FurnitureImage[];
  tags: FurnitureTag[];
}

export interface FurnitureListResponse {
  items: Furniture[];
  total: number;
  page: number;
  pageSize: number;
}

export type SortOption =
  | "name-asc"
  | "price-asc"
  | "price-desc"
  | "newest";

export interface FilterState {
  categoryId: string | null;
  tags: string[];
  priceMin: number | null;
  priceMax: number | null;
  material: string | null;
  search: string;
  sort: SortOption;
}
