import type { FichaLayout } from "@/store/mobi-store";

// Common layout dimensions
const W = 1200;
const H = 1600;

function createBaseLayout(): FichaLayout {
  return {
    width: W,
    height: H,
    brand: { id: "brand", x: 50, y: 45, w: 400, h: 45, fontSize: 30, fontWeight: "bold", align: "left", type: "text", editable: true },
    sheetTitle: { id: "sheetTitle", x: 750, y: 45, w: 400, h: 45, fontSize: 24, fontWeight: "600", align: "right", type: "text", editable: true },
    productName: { id: "productName", x: 50, y: 100, w: 600, h: 35, fontSize: 22, fontWeight: "600", align: "left", type: "text", editable: true },
    views: [
      { id: "front", x: 30, y: 160, w: 270, h: 280 },
      { id: "side", x: 315, y: 160, w: 270, h: 280 },
      { id: "top", x: 600, y: 160, w: 270, h: 280 },
      { id: "perspective", x: 885, y: 160, w: 270, h: 280 },
    ],
    dimensions: [
      { id: "dim-w", x1: 30, y1: 465, x2: 300, y2: 465, valueX: 140, valueY: 490, arrowDir: "h" },
      { id: "dim-h", x1: 305, y1: 160, x2: 305, y2: 440, valueX: 315, valueY: 310, arrowDir: "v" },
      { id: "dim-d", x1: 600, y1: 465, x2: 870, y2: 465, valueX: 715, valueY: 490, arrowDir: "h" },
    ],
    fields: [
      // Left column - Material info
      { id: "f-productType", x: 50, y: 540, w: 250, h: 28, fontSize: 14, align: "left", type: "text", editable: true },
      { id: "l-productType", x: 50, y: 520, w: 250, h: 20, fontSize: 11, align: "left", type: "label", editable: false },
      { id: "f-style", x: 50, y: 590, w: 250, h: 28, fontSize: 14, align: "left", type: "text", editable: true },
      { id: "l-style", x: 50, y: 570, w: 250, h: 20, fontSize: 11, align: "left", type: "label", editable: false },
      { id: "f-material", x: 50, y: 640, w: 350, h: 28, fontSize: 14, align: "left", type: "text", editable: true },
      { id: "l-material", x: 50, y: 620, w: 350, h: 20, fontSize: 11, align: "left", type: "label", editable: false },
      { id: "f-finish", x: 50, y: 690, w: 350, h: 28, fontSize: 14, align: "left", type: "text", editable: true },
      { id: "l-finish", x: 50, y: 670, w: 350, h: 20, fontSize: 11, align: "left", type: "label", editable: false },
      { id: "f-feature", x: 50, y: 740, w: 500, h: 28, fontSize: 14, align: "left", type: "text", editable: true },
      { id: "l-feature", x: 50, y: 720, w: 500, h: 20, fontSize: 11, align: "left", type: "label", editable: false },
      // Right column - Dimensions
      { id: "f-width", x: 700, y: 540, w: 180, h: 28, fontSize: 14, align: "left", type: "number", unit: "cm", editable: true },
      { id: "l-width", x: 700, y: 520, w: 180, h: 20, fontSize: 11, align: "left", type: "label", editable: false },
      { id: "f-height", x: 700, y: 590, w: 180, h: 28, fontSize: 14, align: "left", type: "number", unit: "cm", editable: true },
      { id: "l-height", x: 700, y: 570, w: 180, h: 20, fontSize: 11, align: "left", type: "label", editable: false },
      { id: "f-depth", x: 700, y: 640, w: 180, h: 28, fontSize: 14, align: "left", type: "number", unit: "cm", editable: true },
      { id: "l-depth", x: 700, y: 620, w: 180, h: 20, fontSize: 11, align: "left", type: "label", editable: false },
      { id: "f-weight", x: 700, y: 690, w: 180, h: 28, fontSize: 14, align: "left", type: "number", unit: "kg", editable: true },
      { id: "l-weight", x: 700, y: 670, w: 180, h: 20, fontSize: 11, align: "left", type: "label", editable: false },
    ],
    annotations: [
      { id: "ann-1", x: 50, y: 810, w: 600, h: 24, fontSize: 13, align: "left", type: "text", editable: true },
      { id: "ann-2", x: 50, y: 840, w: 600, h: 24, fontSize: 13, align: "left", type: "text", editable: true },
      { id: "ann-3", x: 50, y: 870, w: 600, h: 24, fontSize: 13, align: "left", type: "text", editable: true },
    ],
    palette: [
      { id: "pal-1", x: 50, y: 940, w: 100, h: 35, labelX: 50, labelY: 982 },
      { id: "pal-2", x: 170, y: 940, w: 100, h: 35, labelX: 170, labelY: 982 },
      { id: "pal-3", x: 290, y: 940, w: 100, h: 35, labelX: 290, labelY: 982 },
      { id: "pal-4", x: 410, y: 940, w: 100, h: 35, labelX: 410, labelY: 982 },
    ],
  };
}

// Layout for chairs — includes seat height
export function getChairLayout(): FichaLayout {
  const layout = createBaseLayout();
  // Add seat height dimension
  layout.dimensions.push({
    id: "dim-seat",
    x1: 885,
    y1: 160,
    x2: 885,
    y2: 440,
    valueX: 895,
    valueY: 380,
    arrowDir: "v",
  });
  // Add seat height field
  layout.fields.push(
    { id: "f-seatHeight", x: 700, y: 740, w: 180, h: 28, fontSize: 14, align: "left", type: "number", unit: "cm", editable: true },
    { id: "l-seatHeight", x: 700, y: 720, w: 180, h: 20, fontSize: 11, align: "left", type: "label", editable: false }
  );
  return layout;
}

// Layout for tables — wider proportions
export function getTableLayout(): FichaLayout {
  const layout = createBaseLayout();
  // Tables are wider, adjust views to be more horizontal
  layout.views = [
    { id: "front", x: 30, y: 160, w: 370, h: 250 },
    { id: "side", x: 415, y: 160, w: 270, h: 250 },
    { id: "top", x: 700, y: 160, w: 370, h: 250 },
    { id: "perspective", x: 30, y: 430, w: 370, h: 250 },
  ];
  return layout;
}

// Layout for sofas — wider, more horizontal
export function getSofaLayout(): FichaLayout {
  return getTableLayout(); // Similar proportions
}

// Layout for shelves — tall and narrow
export function getShelfLayout(): FichaLayout {
  const layout = createBaseLayout();
  layout.views = [
    { id: "front", x: 30, y: 160, w: 270, h: 350 },
    { id: "side", x: 315, y: 160, w: 150, h: 350 },
    { id: "top", x: 480, y: 160, w: 350, h: 200 },
    { id: "perspective", x: 845, y: 160, w: 320, h: 350 },
  ];
  return layout;
}

// Layout for lamps — compact
export function getLampLayout(): FichaLayout {
  const layout = createBaseLayout();
  layout.views = [
    { id: "front", x: 150, y: 160, w: 250, h: 300 },
    { id: "side", x: 425, y: 160, w: 250, h: 300 },
    { id: "top", x: 700, y: 160, w: 250, h: 250 },
    { id: "perspective", x: 150, y: 480, w: 350, h: 300 },
  ];
  return layout;
}

// Layout for beds — very wide and low
export function getBedLayout(): FichaLayout {
  const layout = createBaseLayout();
  layout.views = [
    { id: "front", x: 30, y: 160, w: 550, h: 200 },
    { id: "side", x: 600, y: 160, w: 250, h: 300 },
    { id: "top", x: 30, y: 380, w: 550, h: 350 },
    { id: "perspective", x: 600, y: 380, w: 550, h: 350 },
  ];
  return layout;
}

// Get layout by product type
export function getLayoutByType(productType: string): FichaLayout {
  const type = productType.toLowerCase();
  if (type.includes("silla") || type.includes("chair") || type.includes("stool")) return getChairLayout();
  if (type.includes("mesa") || type.includes("table")) return getTableLayout();
  if (type.includes("sofá") || type.includes("sofa") || type.includes("couch")) return getSofaLayout();
  if (type.includes("estante") || type.includes("shelf") || type.includes("shelving")) return getShelfLayout();
  if (type.includes("lámpara") || type.includes("lamp") || type.includes("light")) return getLampLayout();
  if (type.includes("cama") || type.includes("bed")) return getBedLayout();
  // Default
  return createBaseLayout();
}

// Get labels for fields in Spanish
export function getFieldLabels(): Record<string, string> {
  return {
    "f-productType": "Tipo",
    "f-style": "Estilo",
    "f-material": "Material",
    "f-finish": "Acabado",
    "f-feature": "Característica",
    "f-width": "Ancho",
    "f-height": "Alto",
    "f-depth": "Profundidad",
    "f-seatHeight": "Alt. Asiento",
    "f-weight": "Peso",
    brand: "Marca",
    sheetTitle: "Título",
    productName: "Nombre",
  };
}
