import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding database...");

  // Clean up existing data
  await db.furnitureTag.deleteMany();
  await db.furnitureImage.deleteMany();
  await db.furnitureVariant.deleteMany();
  await db.furniture.deleteMany();
  await db.category.deleteMany();

  // Create categories
  const sillas = await db.category.create({
    data: { name: "Sillas", slug: "sillas", icon: "Armchair" },
  });
  const mesas = await db.category.create({
    data: { name: "Mesas", slug: "mesas", icon: "Table" },
  });
  const sofas = await db.category.create({
    data: { name: "Sofás", slug: "sofas", icon: "Sofa" },
  });
  const estantes = await db.category.create({
    data: { name: "Estantes", slug: "estantes", icon: "BookOpen" },
  });

  // Helper to create furniture with variants and tags
  const createFurniture = async (
    data: {
      slug: string;
      name: string;
      description: string;
      designer?: string;
      categoryId: string;
      basePrice: number;
      salePrice?: number;
      widthCm: number;
      depthCm: number;
      heightCm: number;
      seatHeightCm?: number;
      weightKg: number;
      primaryMaterial: string;
      modelPath: string;
      thumbnailPath: string;
      isNew?: boolean;
      isFeatured?: boolean;
      variants: { name: string; colorHex: string; priceOffset?: number }[];
      tags: string[];
      images: { url: string; alt: string; sortOrder: number }[];
    }
  ) => {
    const furniture = await db.furniture.create({
      data: {
        slug: data.slug,
        name: data.name,
        description: data.description,
        designer: data.designer,
        categoryId: data.categoryId,
        basePrice: data.basePrice,
        salePrice: data.salePrice ?? null,
        widthCm: data.widthCm,
        depthCm: data.depthCm,
        heightCm: data.heightCm,
        seatHeightCm: data.seatHeightCm ?? null,
        weightKg: data.weightKg,
        primaryMaterial: data.primaryMaterial,
        modelPath: data.modelPath,
        thumbnailPath: data.thumbnailPath,
        isNew: data.isNew ?? false,
        isFeatured: data.isFeatured ?? false,
        variants: {
          create: data.variants,
        },
        tags: {
          create: data.tags.map((name) => ({ name })),
        },
        images: {
          create: data.images,
        },
      },
    });
    return furniture;
  };

  // 1. Silla Nara
  await createFurniture({
    slug: "silla-nara",
    name: "Silla Nara",
    description:
      "La Silla Nara combina la calidez del roble natural con líneas minimalistas escandinavas. Su asiento moldeado ergonómicamente y su respaldo curvo ofrecen un confort excepcional para largas cenas. Fabricada artesanalmente con madera de roble macizo y acabado natural que resalta la veta.",
    designer: "Studio Nørd",
    categoryId: sillas.id,
    basePrice: 349,
    widthCm: 48,
    depthCm: 52,
    heightCm: 82,
    seatHeightCm: 46,
    weightKg: 5.2,
    primaryMaterial: "Roble macizo",
    modelPath: "/models/chair.glb",
    thumbnailPath: "/images/silla-nara-thumb.jpg",
    isNew: true,
    isFeatured: true,
    variants: [
      { name: "Roble Natural", colorHex: "#C4A882" },
      { name: "Nogal Oscuro", colorHex: "#5C3D2E", priceOffset: 30 },
      { name: "Negro Mate", colorHex: "#2A2A2A", priceOffset: 20 },
    ],
    tags: ["Escandinavo", "Moderno", "Roble", "Comedor"],
    images: [
      { url: "/images/silla-nara-1.jpg", alt: "Silla Nara vista frontal", sortOrder: 0 },
      { url: "/images/silla-nara-2.jpg", alt: "Silla Nara vista lateral", sortOrder: 1 },
      { url: "/images/silla-nara-3.jpg", alt: "Silla Nara detalle asiento", sortOrder: 2 },
    ],
  });

  // 2. Mesa Kyoto
  await createFurniture({
    slug: "mesa-kyoto",
    name: "Mesa Kyoto",
    description:
      "La Mesa Kyoto es una pieza central inspirada en la estética japonesa. Su superficie de roble con vetas pronunciadas descansa sobre patas cónicas que evocan la arquitectura tradicional. Perfecta para comedores de 6 a 8 personas, combina elegancia y funcionalidad.",
    designer: "Tadao Studio",
    categoryId: mesas.id,
    basePrice: 1290,
    salePrice: 1099,
    widthCm: 180,
    depthCm: 90,
    heightCm: 75,
    weightKg: 32,
    primaryMaterial: "Roble macizo",
    modelPath: "/models/table.glb",
    thumbnailPath: "/images/mesa-kyoto-thumb.jpg",
    isFeatured: true,
    variants: [
      { name: "Roble Natural", colorHex: "#C4A882" },
      { name: "Nogal", colorHex: "#5C3D2E", priceOffset: 150 },
    ],
    tags: ["Japonés", "Moderno", "Roble", "Comedor", "Mid-Century"],
    images: [
      { url: "/images/mesa-kyoto-1.jpg", alt: "Mesa Kyoto vista superior", sortOrder: 0 },
      { url: "/images/mesa-kyoto-2.jpg", alt: "Mesa Kyoto vista lateral", sortOrder: 1 },
    ],
  });

  // 3. Sillón Fjord
  await createFurniture({
    slug: "sillon-fjord",
    name: "Sillón Fjord",
    description:
      "El Sillón Fjord envuelve con su diseño orgánico y reposabrazos curvos. Tapizado en tela premium con estructura de haya, su cojín de alta densidad proporciona un confort envolvente. Inspirado en los fiordos noruegos, donde la naturaleza se encuentra con el diseño.",
    designer: "Nørdvik Design",
    categoryId: sillas.id,
    basePrice: 890,
    widthCm: 72,
    depthCm: 78,
    heightCm: 85,
    seatHeightCm: 42,
    weightKg: 14,
    primaryMaterial: "Haya y tela",
    modelPath: "/models/chair.glb",
    thumbnailPath: "/images/sillon-fjord-thumb.jpg",
    isNew: true,
    variants: [
      { name: "Gris Oveja", colorHex: "#B8AD9E" },
      { name: "Verde Bosque", colorHex: "#4A5D3A" },
      { name: "Terracota", colorHex: "#B85C3A", priceOffset: 40 },
    ],
    tags: ["Escandinavo", "Moderno", "Lounge", "Tapizado"],
    images: [
      { url: "/images/sillon-fjord-1.jpg", alt: "Sillón Fjord vista frontal", sortOrder: 0 },
      { url: "/images/sillon-fjord-2.jpg", alt: "Sillón Fjord detalle", sortOrder: 1 },
    ],
  });

  // 4. Sofá Bergen
  await createFurniture({
    slug: "sofa-bergen",
    name: "Sofá Bergen",
    description:
      "El Sofá Bergen redefine el confort con sus proporciones generosas y su diseño limpio. Tres plazas de puro relax con cojines reversibles y patas de roble visible. Su tapizado en lino belga es tan elegante como duradero, perfecto para el salón moderno.",
    designer: "Studio Nørd",
    categoryId: sofas.id,
    basePrice: 2190,
    widthCm: 220,
    depthCm: 90,
    heightCm: 80,
    seatHeightCm: 44,
    weightKg: 58,
    primaryMaterial: "Lino belga y roble",
    modelPath: "/models/sofa.glb",
    thumbnailPath: "/images/sofa-bergen-thumb.jpg",
    isFeatured: true,
    variants: [
      { name: "Lino Natural", colorHex: "#D4C9B8" },
      { name: "Gris Piedra", colorHex: "#7A7A72" },
      { name: "Azul Copenhague", colorHex: "#4A5B6E", priceOffset: 120 },
    ],
    tags: ["Escandinavo", "Moderno", "Lino", "Salón"],
    images: [
      { url: "/images/sofa-bergen-1.jpg", alt: "Sofá Bergen vista frontal", sortOrder: 0 },
      { url: "/images/sofa-bergen-2.jpg", alt: "Sofá Bergen detalle cojín", sortOrder: 1 },
      { url: "/images/sofa-bergen-3.jpg", alt: "Sofá Bergen en salón", sortOrder: 2 },
    ],
  });

  // 5. Estantería Lund
  await createFurniture({
    slug: "estanteria-lund",
    name: "Estantería Lund",
    description:
      "La Estantería Lund es un sistema modular de líneas puras fabricado en roble macizo. Sus cinco baldas ofrecen amplio espacio de almacenamiento y exposición. El diseño de estructura abierta aporta ligereza visual, ideal para dividir espacios o decorar cualquier pared.",
    designer: "Malmö Collective",
    categoryId: estantes.id,
    basePrice: 680,
    widthCm: 80,
    depthCm: 30,
    heightCm: 180,
    weightKg: 22,
    primaryMaterial: "Roble macizo",
    modelPath: "/models/shelf.glb",
    thumbnailPath: "/images/estanteria-lund-thumb.jpg",
    variants: [
      { name: "Roble Natural", colorHex: "#C4A882" },
      { name: "Blanco Mate", colorHex: "#E8E4DE" },
      { name: "Nogal", colorHex: "#5C3D2E", priceOffset: 60 },
    ],
    tags: ["Escandinavo", "Moderno", "Roble", "Almacenaje"],
    images: [
      { url: "/images/estanteria-lund-1.jpg", alt: "Estantería Lund frontal", sortOrder: 0 },
      { url: "/images/estanteria-lund-2.jpg", alt: "Estantería Lund detalle", sortOrder: 1 },
    ],
  });

  // 6. Silla Mika
  await createFurniture({
    slug: "silla-mika",
    name: "Silla Mika",
    description:
      "La Silla Mika es una silla auxiliar versátil con asiento de madera moldeada y estructura de acero pintado. Su diseño ligero la hace perfecta como silla de escritorio o complemento en cualquier estancia. Disponible en una paleta de colores contemporáneos.",
    categoryId: sillas.id,
    basePrice: 279,
    widthCm: 44,
    depthCm: 48,
    heightCm: 78,
    seatHeightCm: 45,
    weightKg: 3.8,
    primaryMaterial: "Acero y madera moldeada",
    modelPath: "/models/chair.glb",
    thumbnailPath: "/images/silla-mika-thumb.jpg",
    isNew: true,
    variants: [
      { name: "Blanco", colorHex: "#F0EDE8" },
      { name: "Negro", colorHex: "#1A1A1A", priceOffset: -20 },
      { name: "Verde Salvia", colorHex: "#7A8B6F" },
    ],
    tags: ["Moderno", "Minimalista", "Acero", "Auxiliar"],
    images: [
      { url: "/images/silla-mika-1.jpg", alt: "Silla Mika frontal", sortOrder: 0 },
      { url: "/images/silla-mika-2.jpg", alt: "Silla Mika lateral", sortOrder: 1 },
    ],
  });

  // 7. Mesa Oaxaca
  await createFurniture({
    slug: "mesa-oaxaca",
    name: "Mesa Oaxaca",
    description:
      "La Mesa Oaxaca rinde homenaje a la artesanía mexicana con su diseño de mesa baja de centro. Fabricada en madera de encino con acabado ahumado, sus patas torneadas evocan la tradición artesanal. Un punto de conversación en cualquier salón.",
    designer: "Taller Sur",
    categoryId: mesas.id,
    basePrice: 590,
    widthCm: 120,
    depthCm: 60,
    heightCm: 40,
    weightKg: 18,
    primaryMaterial: "Encino ahumado",
    modelPath: "/models/table.glb",
    thumbnailPath: "/images/mesa-oaxaca-thumb.jpg",
    variants: [
      { name: "Ahumado", colorHex: "#6B5344" },
      { name: "Natural", colorHex: "#C4A882", priceOffset: -30 },
    ],
    tags: ["Mid-Century", "Artesanal", "Encino", "Salón"],
    images: [
      { url: "/images/mesa-oaxaca-1.jpg", alt: "Mesa Oaxaca vista superior", sortOrder: 0 },
      { url: "/images/mesa-oaxaca-2.jpg", alt: "Mesa Oaxaca detalle patas", sortOrder: 1 },
    ],
  });

  // 8. Aparador Voss
  await createFurniture({
    slug: "aparador-voss",
    name: "Aparador Voss",
    description:
      "El Aparador Voss combina almacenamiento generoso con estética nórdica depurada. Dos puertas con tiradores integrados y tres cajones ofrecen organización completa. Su estructura de nogal con vetas marcadas es una declaración de buen gusto.",
    designer: "Nørdvik Design",
    categoryId: mesas.id,
    basePrice: 1450,
    salePrice: 1299,
    widthCm: 160,
    depthCm: 45,
    heightCm: 72,
    weightKg: 38,
    primaryMaterial: "Nogal macizo",
    modelPath: "/models/shelf.glb",
    thumbnailPath: "/images/aparador-voss-thumb.jpg",
    isFeatured: true,
    variants: [
      { name: "Nogal Natural", colorHex: "#5C3D2E" },
      { name: "Roble Claro", colorHex: "#C4A882", priceOffset: -100 },
    ],
    tags: ["Escandinavo", "Nogal", "Almacenaje", "Comedor", "Mid-Century"],
    images: [
      { url: "/images/aparador-voss-1.jpg", alt: "Aparador Voss frontal", sortOrder: 0 },
      { url: "/images/aparador-voss-2.jpg", alt: "Aparador Voss detalle tirador", sortOrder: 1 },
    ],
  });

  console.log("✅ Seeding completed!");
  console.log(`  Categories: 4`);
  console.log(`  Furniture pieces: 8`);
  console.log(`  Variants: ~20`);
  console.log(`  Tags: ~30`);

  await db.$disconnect();
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
