"use client";

import { useCallback, useState } from "react";
import { useMobiStore, type GridField, type ExtraElement } from "@/store/mobi-store";

interface FichaCanvasProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  activeFieldId: string | null;
  onFieldClick: (id: string | null) => void;
}

/**
 * Maps a grid field ID to the corresponding value in editedData.
 */
function getFieldValue(
  fieldId: string,
  editedData: Record<string, unknown>
): string {
  // Special top-level fields
  if (fieldId === "brand") return String(editedData.brand ?? "");
  if (fieldId === "sheetTitle") return "FICHA TÉCNICA";
  if (fieldId === "productType") return String(editedData.productType ?? "");

  // Data fields (f-XXX pattern)
  const key = fieldId.replace("f-", "");
  switch (key) {
    case "style":
      return String(editedData.style ?? "");
    case "material":
      return String(
        (editedData.material as Record<string, unknown>)?.main ?? ""
      );
    case "finish":
      return String(editedData.finish ?? "");
    case "feature":
      return String(editedData.feature ?? "");
    case "width":
      return String(
        (editedData.dimensions as Record<string, unknown>)?.width ?? ""
      );
    case "height":
      return String(
        (editedData.dimensions as Record<string, unknown>)?.height ?? ""
      );
    case "depth":
      return String(
        (editedData.dimensions as Record<string, unknown>)?.depth ?? ""
      );
    case "seatHeight":
      return String(
        (editedData.dimensions as Record<string, unknown>)?.seatHeight ?? ""
      );
    case "weight":
      return String(editedData.weight ?? "");
    default:
      return "";
  }
}

/**
 * Updates a value in the store based on field ID.
 */
function setFieldValue(
  fieldId: string,
  value: string,
  updateField: (path: string, value: unknown) => void
) {
  const key = fieldId.replace("f-", "");
  switch (key) {
    case "productType":
      updateField("productType", value);
      break;
    case "style":
      updateField("style", value);
      break;
    case "material":
      updateField("material.main", value);
      break;
    case "finish":
      updateField("finish", value);
      break;
    case "feature":
      updateField("feature", value);
      break;
    case "width":
      updateField("dimensions.width", Number(value) || 0);
      break;
    case "height":
      updateField("dimensions.height", Number(value) || 0);
      break;
    case "depth":
      updateField("dimensions.depth", Number(value) || 0);
      break;
    case "seatHeight":
      updateField("dimensions.seatHeight", Number(value) || 0);
      break;
    case "weight":
      updateField("weight", Number(value) || 0);
      break;
  }
}

function fontSizeToPx(size: "small" | "medium" | "large"): number {
  switch (size) {
    case "small":
      return 10;
    case "medium":
      return 14;
    case "large":
      return 20;
  }
}

export default function FichaCanvas({
  scale,
  activeFieldId,
  onFieldClick,
}: FichaCanvasProps) {
  const referenceImage = useMobiStore((s) => s.referenceImage);
  const gridFields = useMobiStore((s) => s.gridFields);
  const sheetBgColor = useMobiStore((s) => s.sheetBgColor);
  const editedData = useMobiStore((s) => s.editedData);
  const extras = useMobiStore((s) => s.extras);
  const updateField = useMobiStore((s) => s.updateField);
  const updateExtra = useMobiStore((s) => s.updateExtra);

  const [draggingExtra, setDraggingExtra] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  if (!referenceImage || gridFields.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No hay datos del lienzo
      </div>
    );
  }

  const handleExtraMouseDown = useCallback(
    (e: React.MouseEvent, extraId: string) => {
      e.stopPropagation();
      const extra = extras.find((ex) => ex.id === extraId);
      if (!extra) return;
      const rect = (e.currentTarget as HTMLElement)
        .closest(".ficha-canvas-container")
        ?.getBoundingClientRect();
      if (!rect) return;

      const relX = ((e.clientX - rect.left) / rect.width) * 100;
      const relY = ((e.clientY - rect.top) / rect.height) * 100;

      setDraggingExtra(extraId);
      setDragOffset({ x: relX - extra.x, y: relY - extra.y });
      onFieldClick(null);
    },
    [extras, onFieldClick]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingExtra) return;
      const rect = (e.currentTarget as HTMLElement)
        .closest(".ficha-canvas-container")
        ?.getBoundingClientRect();
      if (!rect) return;

      const relX = ((e.clientX - rect.left) / rect.width) * 100;
      const relY = ((e.clientY - rect.top) / rect.height) * 100;

      updateExtra(draggingExtra, {
        x: Math.max(0, Math.min(100, relX - dragOffset.x)),
        y: Math.max(0, Math.min(100, relY - dragOffset.y)),
      });
    },
    [draggingExtra, dragOffset, updateExtra]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingExtra(null);
  }, []);

  return (
    <div
      className="ficha-canvas-container relative w-full overflow-hidden bg-muted/20 rounded-lg"
      style={{ cursor: draggingExtra ? "grabbing" : "default" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => onFieldClick(null)}
    >
      {/* Image A as background */}
      <img
        src={referenceImage}
        alt="Ficha técnica"
        className="w-full h-auto select-none"
        draggable={false}
      />

      {/* Overlay editable fields — boxes with bg color that cover original text */}
      {gridFields.map((field: GridField) => {
        const isActive = activeFieldId === field.id;
        const value = editedData
          ? getFieldValue(field.id, editedData as unknown as Record<string, unknown>)
          : "";
        const pxFontSize = fontSizeToPx(field.fontSize);
        // Scale font relative to container width (container ~640px at 100%)
        const vwFont = `${pxFontSize / 6.4}vw`;

        return (
          <div
            key={field.id}
            style={{
              position: "absolute",
              left: `${field.xPct}%`,
              top: `${field.yPct}%`,
              width: `${field.wPct}%`,
              height: `${field.hPct}%`,
            }}
            className={`
              flex items-center cursor-pointer transition-all
              ${
                isActive
                  ? "ring-2 ring-primary/60 rounded-sm z-10"
                  : "hover:ring-1 hover:ring-primary/30 rounded-sm"
              }
            `}
            onClick={(e) => {
              e.stopPropagation();
              onFieldClick(field.id);
            }}
          >
            {isActive ? (
              <input
                type={field.type === "number" ? "number" : "text"}
                value={value}
                onChange={(e) =>
                  setFieldValue(field.id, e.target.value, updateField)
                }
                onClick={(e) => e.stopPropagation()}
                className="w-full h-full bg-transparent text-foreground outline-none px-0.5"
                style={{
                  backgroundColor: sheetBgColor,
                  fontSize: vwFont,
                  fontWeight: field.bold ? "bold" : "normal",
                }}
                autoFocus
              />
            ) : (
              <span
                className="px-0.5 truncate w-full"
                style={{
                  backgroundColor: sheetBgColor,
                  fontSize: vwFont,
                  fontWeight: field.bold ? "bold" : "normal",
                }}
              >
                {value}
              </span>
            )}
          </div>
        );
      })}

      {/* Extras */}
      {extras.map((extra: ExtraElement) => (
        <div
          key={extra.id}
          style={{
            position: "absolute",
            left: `${extra.x}%`,
            top: `${extra.y}%`,
            width: `${extra.w / 1024 * 100}%`,
            height: `${extra.h / 1536 * 100}%`,
          }}
          className={`border border-dashed border-primary/40 rounded cursor-grab active:cursor-grabbing ${draggingExtra === extra.id ? "ring-2 ring-primary/60" : ""}`}
          onMouseDown={(e) => handleExtraMouseDown(e, extra.id)}
        >
          {extra.type === "image" || extra.type === "logo" ? (
            <img
              src={extra.data}
              alt="extra"
              className="w-full h-full object-contain"
              draggable={false}
            />
          ) : extra.type === "text" ? (
            <div className="w-full h-full flex items-center justify-center text-foreground/80 text-xs">
              {extra.data}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/60 text-xs">
              ✓ APROBADO
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
