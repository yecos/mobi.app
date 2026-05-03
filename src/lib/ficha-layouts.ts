// Field labels for the editing panel in Spanish
// The old layout system (FichaLayout) has been replaced by grid-based AI position detection.

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
