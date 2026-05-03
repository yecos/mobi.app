export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  designer: string;
  year: number;
  dimensions: {
    width: number;
    depth: number;
    height: number;
    seatHeight?: number;
  };
  weight: number;
  materials: string[];
  finishes: FurnitureFinish[];
  features: string[];
  modelType: "chair" | "table" | "sofa" | "shelf" | "lamp" | "bed";
  images: string[];
  inStock: boolean;
  leadTime: string;
}

export interface FurnitureFinish {
  id: string;
  name: string;
  color: string;
  hex: string;
}

export const categories = [
  "Todos",
  "Sillas",
  "Mesas",
  "Sofás",
  "Estantes",
  "Lámparas",
  "Camas",
] as const;

export const finishes: FurnitureFinish[] = [
  { id: "natural-oak", name: "Roble Natural", color: "Roble Natural", hex: "#C4A882" },
  { id: "walnut", name: "Nogal", color: "Nogal", hex: "#5C4033" },
  { id: "white-oak", name: "Roble Blanco", color: "Roble Blanco", hex: "#E8DCC8" },
  { id: "ebony", name: "Ébano", color: "Ébano", hex: "#2C2C2C" },
  { id: "ash", name: "Fresno", color: "Fresno", hex: "#B8A590" },
  { id: "maple", name: "Arce", color: "Arce", hex: "#D4B896" },
  { id: "matte-black", name: "Negro Mate", color: "Negro Mate", hex: "#1A1A1A" },
  { id: "brass", name: "Latón", color: "Latón", hex: "#B5A642" },
];

export const furnitureItems: FurnitureItem[] = [
  {
    id: "wishbone-chair",
    name: "Silla Wishbone CH24",
    category: "Sillas",
    description:
      "La icónica silla Wishbone, diseñada por Hans Wegner en 1949, es una obra maestra de la artesanía danesa. Su respaldo en forma de Y proporciona un soporte ergonómico excepcional mientras permite una libertad de movimiento natural. Cada silla requiere más de 100 pasos de producción y está fabricada a mano con maderas seleccionadas de fuentes sostenibles. El asiento tejido en papel natural aporta calidez y textura, envejeciendo con gracia con el paso del tiempo.",
    price: 1290,
    designer: "Hans J. Wegner",
    year: 1949,
    dimensions: { width: 55, depth: 51, height: 75, seatHeight: 45 },
    weight: 4.8,
    materials: ["Roble", "Papel natural tejido"],
    finishes: [
      finishes[0], finishes[1], finishes[2], finishes[3], finishes[4],
    ],
    features: [
      "Respaldo ergonómico en forma de Y",
      "Asiento tejido a mano en papel natural",
      "Más de 100 pasos de producción artesanal",
      "Madera de fuentes sostenibles certificadas",
      "Garantía de 25 años",
    ],
    modelType: "chair",
    images: [],
    inStock: true,
    leadTime: "4-6 semanas",
  },
  {
    id: "noguchi-table",
    name: "Mesa Noguchi",
    category: "Mesas",
    description:
      "La Mesa Noguchi, diseñada por Isamu Noguchi en 1947, es una de las piezas de mobiliario más reconocibles del siglo XX. Su base escultórica de dos elementos interconectados sostiene una superficie de cristal orgánica que parece flotar en el espacio. La intersección de las piezas de madera crea una forma tridimensional que cambia según el ángulo de observación, haciendo de esta mesa tanto un mueble funcional como una obra de arte escultórica.",
    price: 2450,
    designer: "Isamu Noguchi",
    year: 1947,
    dimensions: { width: 130, depth: 90, height: 40 },
    weight: 18.5,
    materials: ["Nogal", "Cristal templado 12mm"],
    finishes: [finishes[1], finishes[0], finishes[3]],
    features: [
      "Base escultórica de dos piezas interconectadas",
      "Cristal templado de 12mm con bordes pulidos",
      "Diseño biomórfico icónico",
      "Pieza de museo permanente en el MoMA",
      "Ensamblaje sin herramientas",
    ],
    modelType: "table",
    images: [],
    inStock: true,
    leadTime: "6-8 semanas",
  },
  {
    id: "barcelona-sofa",
    name: "Sofá Barcelona",
    category: "Sofás",
    description:
      "El Sofá Barcelona, diseñado por Ludwig Mies van der Rohe para el Pabellón Alemán de la Exposición Internacional de Barcelona en 1929, representa la quintaesencia del diseño moderno. Su estructura de acero cromado en forma de X sostiene cojines cuadrados de cuero Premium que siguen una composición geométrica precisa. Cada cojín está relleno de espuma de alta densidad y plumas de ganso, proporcionando un confort excepcional sin comprometer la estética minimalista.",
    price: 5800,
    designer: "Ludwig Mies van der Rohe",
    year: 1929,
    dimensions: { width: 195, depth: 78, height: 72, seatHeight: 43 },
    weight: 45,
    materials: ["Acero cromado", "Cuero Premium", "Espuma HR", "Plumas de ganso"],
    finishes: [finishes[6], finishes[7]],
    features: [
      "Estructura de acero cromado tipo X",
      "Cojines de cuero Premium con relleno de plumas",
      "Composición geométrica precisa",
      "Pieza icónica del Movimiento Moderno",
      "Fabricación artesanal certificada",
    ],
    modelType: "sofa",
    images: [],
    inStock: false,
    leadTime: "8-12 semanas",
  },
  {
    id: "string-shelf",
    name: "Estante String",
    category: "Estantes",
    description:
      "El sistema de estanterías String, diseñado por Nisse Strinning en 1949, es un ejemplo perfecto del diseño escandinavo modular. Sus delgados paneles laterales de acero soportan estantes de madera que pueden configurarse de infinitas maneras. La belleza del sistema String reside en su simplicidad: piezas mínimas que se combinan para crear soluciones de almacenamiento tan simples o complejas como se desee, adaptándose a cualquier espacio y necesidad.",
    price: 890,
    designer: "Nisse Strinning",
    year: 1949,
    dimensions: { width: 78, depth: 20, height: 85 },
    weight: 8.2,
    materials: ["Acero lacado", "Madera de roble"],
    finishes: [finishes[6], finishes[0], finishes[2]],
    features: [
      "Sistema modular infinitamente configurable",
      "Paneles laterales de acero de 2mm",
      "Estantes de madera maciza de 20mm",
      "Fácil montaje sin herramientas especiales",
      "Ampliable en cualquier dirección",
    ],
    modelType: "shelf",
    images: [],
    inStock: true,
    leadTime: "3-4 semanas",
  },
  {
    id: "aj-lamp",
    name: "Lámpara AJ",
    category: "Lámparas",
    description:
      "La Lámpara AJ fue diseñada por Arne Jacobsen en 1957 para el Hotel SAS Royal en Copenhague. Su pantalla asimétrica inclinada dirige la luz hacia abajo de forma precisa, creando un haz de lectura ideal sin deslumbramiento. El diseño es una declaración de la filosofía funcionalista de Jacobsen: cada elemento tiene un propósito, cada línea está justificada. La base con orificio circular, originalmente pensada para un cenicero, es hoy un detalle decorativo distintivo.",
    price: 680,
    designer: "Arne Jacobsen",
    year: 1957,
    dimensions: { width: 17, depth: 40, height: 50 },
    weight: 2.1,
    materials: ["Acero lacado", "Aluminio"],
    finishes: [finishes[6], finishes[7], finishes[0]],
    features: [
      "Pantalla asimétrica para luz dirigida",
      "Base con orificio decorativo icónico",
      "Regulador de intensidad integrado",
      "Bombilla LED incluida",
      "Interruptor táctil en la base",
    ],
    modelType: "lamp",
    images: [],
    inStock: true,
    leadTime: "2-3 semanas",
  },
  {
    id: "platform-bed",
    name: "Cama Platform",
    category: "Camas",
    description:
      "La Cama Platform reinterpreta el diseño japonés tradicional con una sensibilidad escandinava contemporánea. Su estructura baja y horizontal crea una sensación de amplitud y serenidad en el dormitorio. El cabecero de listones de madera permite la circulación del aire y añade un ritmo visual sutil. Fabricada con madera maciza de roble con uniones de mortaja y espiga, esta cama es una inversión para toda la vida que mejora con el paso de los años.",
    price: 3200,
    designer: "Estudio Møbel",
    year: 2020,
    dimensions: { width: 165, depth: 210, height: 35, seatHeight: 30 },
    weight: 52,
    materials: ["Roble macizo", "Cierre magnético"],
    finishes: [finishes[0], finishes[1], finishes[2], finishes[4]],
    features: [
      "Estructura baja de inspiración japonesa",
      "Cabecero de listones de madera maciza",
      "Union de mortaja y espiga sin tornillos",
      "Base de láminas de madera incluida",
      "Altura desde el suelo optimizada",
    ],
    modelType: "bed",
    images: [],
    inStock: true,
    leadTime: "6-8 semanas",
  },
  {
    id: "ant-chair",
    name: "Silla Ant 3100",
    category: "Sillas",
    description:
      "La Silla Ant, diseñada por Arne Jacobsen en 1952 para la cafetería de la compañía farmacéutica Novo Nordisk, es un hito de la fabricación en madera contrachapada moldeada. Su respaldo estrecho y elegante recuerda la silueta de una hormiga, de ahí su nombre. Con solo tres patas, la silla Ant desafía las convenciones estructurales mientras demuestra que el diseño puede ser radicalmente minimal sin sacrificar la funcionalidad ni la resistencia.",
    price: 980,
    designer: "Arne Jacobsen",
    year: 1952,
    dimensions: { width: 48, depth: 52, height: 78, seatHeight: 46 },
    weight: 3.2,
    materials: ["Madera contrachapada moldeada", "Haya"],
    finishes: [finishes[0], finishes[1], finishes[5], finishes[6]],
    features: [
      "Madera contrachapada moldeada en una pieza",
      "Diseño de tres patas revolucionario",
      "Apilable hasta 6 unidades",
      "Peso ultraligero de 3.2kg",
      "Acabado lacado resistente al uso",
    ],
    modelType: "chair",
    images: [],
    inStock: true,
    leadTime: "3-5 semanas",
  },
  {
    id: "round-table",
    name: "Mesa Circular Saarinen",
    category: "Mesas",
    description:
      "La Mesa Circular de Eero Saarinen, diseñada en 1957, resuelve el problema de las patas convencionales con su base pedestal de una sola columna. La base de fundición de aluminio soporta una superficie circular de mármol o madera, creando una mesa comedor que permite una disposición de asientos sin obstáculos. El pedestal se estrecha elegantemente hacia la base, dando la impresión de que la mesa flota sobre el suelo.",
    price: 3750,
    designer: "Eero Saarinen",
    year: 1957,
    dimensions: { width: 120, depth: 120, height: 72 },
    weight: 38,
    materials: ["Aluminio fundido", "Mármol Carrara", "Madera de roble"],
    finishes: [finishes[7], finishes[0], finishes[1]],
    features: [
      "Base pedestal de una sola columna",
      "Superficie de mármol Carrara natural",
      "Diseño sin patas para máxima comodidad",
      "Pieza del Collection du Centre Pompidou",
      "Acabado en latón pulido o blanco mate",
    ],
    modelType: "table",
    images: [],
    inStock: false,
    leadTime: "10-14 semanas",
  },
];
