"use client";

import { useCallback, useState } from "react";
import { useMobiStore, type LayoutField, type ExtraElement } from "@/store/mobi-store";
import { getFieldLabels } from "@/lib/ficha-layouts";

interface FichaCanvasProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  activeFieldId: string | null;
  onFieldClick: (id: string | null) => void;
}

/**
 * Maps a layout field ID to the corresponding value in editedData.
 */
function getFieldValue(
  fieldId: string,
  editedData: Record<string, unknown>
): string {
  const labels = getFieldLabels();
  // Special top-level fields
  if (fieldId === "brand") return String(editedData.brand ?? "");
  if (fieldId === "sheetTitle") return "FICHA TÉCNICA";
  if (fieldId === "productName") return String(editedData.productName ?? "");

  // Data fields (f-XXX pattern)
  const key = fieldId.replace("f-", "");
  switch (key) {
    case "productType":
      return String(editedData.productType ?? "");
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
 * Gets the label text for a label field (l-XXX pattern).
 */
function getLabelValue(fieldId: string): string {
  const labels = getFieldLabels();
  const key = fieldId.replace("l-", "");
  return labels[`f-${key}`] ?? key;
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

export default function FichaCanvas({
  scale,
  activeFieldId,
  onFieldClick,
}: FichaCanvasProps) {
  const canvasImage = useMobiStore((s) => s.canvasImage);
  const fichaLayout = useMobiStore((s) => s.fichaLayout);
  const editedData = useMobiStore((s) => s.editedData);
  const extras = useMobiStore((s) => s.extras);
  const updateField = useMobiStore((s) => s.updateField);
  const updateExtra = useMobiStore((s) => s.updateExtra);

  const [draggingExtra, setDraggingExtra] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const LAYOUT_W = fichaLayout?.width ?? 1200;
  const LAYOUT_H = fichaLayout?.height ?? 1600;

  const getFieldStyle = useCallback(
    (field: LayoutField) => {
      const leftPct = (field.x / LAYOUT_W) * 100;
      const topPct = (field.y / LAYOUT_H) * 100;
      const widthPct = (field.w / LAYOUT_W) * 100;
      const heightPct = (field.h / LAYOUT_H) * 100;
      const fontSizePct = (field.fontSize / LAYOUT_W) * 100;

      return {
        position: "absolute" as const,
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: `${widthPct}%`,
        height: `${heightPct}%`,
        fontSize: `${fontSizePct * (1 / (scale / 100))}vw`,
      };
    },
    [LAYOUT_W, LAYOUT_H, scale]
  );

  const handleExtraMouseDown = useCallback(
    (e: React.MouseEvent, extraId: string) => {
      e.stopPropagation();
      const extra = extras.find((ex) => ex.id === extraId);
      if (!extra) return;
      const rect = (e.currentTarget as HTMLElement)
        .closest(".ficha-canvas-container")
        ?.getBoundingClientRect();
      if (!rect) return;

      const relX = ((e.clientX - rect.left) / rect.width) * LAYOUT_W;
      const relY = ((e.clientY - rect.top) / rect.height) * LAYOUT_H;

      setDraggingExtra(extraId);
      setDragOffset({ x: relX - extra.x, y: relY - extra.y });
      onFieldClick(null);
    },
    [extras, LAYOUT_W, LAYOUT_H, onFieldClick]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingExtra) return;
      const rect = (e.currentTarget as HTMLElement)
        .closest(".ficha-canvas-container")
        ?.getBoundingClientRect();
      if (!rect) return;

      const relX = ((e.clientX - rect.left) / rect.width) * LAYOUT_W;
      const relY = ((e.clientY - rect.top) / rect.height) * LAYOUT_H;

      updateExtra(draggingExtra, {
        x: Math.max(0, Math.min(LAYOUT_W, relX - dragOffset.x)),
        y: Math.max(0, Math.min(LAYOUT_H, relY - dragOffset.y)),
      });
    },
    [draggingExtra, dragOffset, LAYOUT_W, LAYOUT_H, updateExtra]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingExtra(null);
  }, []);

  if (!canvasImage || !fichaLayout) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No hay datos del lienzo
      </div>
    );
  }

  // Collect all editable fields
  const allFields: LayoutField[] = [
    fichaLayout.brand,
    fichaLayout.sheetTitle,
    fichaLayout.productName,
    ...fichaLayout.fields,
    ...fichaLayout.annotations,
  ];

  return (
    <div
      className="ficha-canvas-container relative w-full overflow-hidden bg-muted/20 rounded-lg"
      style={{ cursor: draggingExtra ? "grabbing" : "default" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => onFieldClick(null)}
    >
      <img
        src={canvasImage}
        alt="Lienzo de ficha técnica"
        className="w-full h-auto select-none"
        draggable={false}
      />

      {/* Overlay fields */}
      {allFields.map((field) => {
        if (field.type === "label") {
          return (
            <div
              key={field.id}
              style={getFieldStyle(field)}
              className="pointer-events-none text-muted-foreground/70 select-none"
            >
              {getLabelValue(field.id)}
            </div>
          );
        }

        const isActive = activeFieldId === field.id;
        const value = editedData
          ? getFieldValue(field.id, editedData as unknown as Record<string, unknown>)
          : "";

        return (
          <div
            key={field.id}
            style={getFieldStyle(field)}
            className={`
              flex items-center cursor-pointer transition-all
              ${
                isActive
                  ? "bg-primary/20 ring-1 ring-primary/50 rounded-sm z-10"
                  : "bg-transparent hover:bg-primary/10 rounded-sm"
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
                className="w-full h-full bg-transparent text-foreground outline-none text-inherit px-0.5"
                autoFocus
              />
            ) : (
              <span className="px-0.5 truncate w-full">
                {value}
                {field.unit ? ` ${field.unit}` : ""}
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
            left: `${(extra.x / LAYOUT_W) * 100}%`,
            top: `${(extra.y / LAYOUT_H) * 100}%`,
            width: `${(extra.w / LAYOUT_W) * 100}%`,
            height: `${(extra.h / LAYOUT_H) * 100}%`,
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
            <div
              className="w-full h-full flex items-center justify-center text-foreground/80 text-xs"
              style={{ fontSize: extra.fontSize ? `${extra.fontSize / LAYOUT_W * 100}vw` : undefined }}
            >
              {extra.data}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/60 text-xs">
              {extra.type === "stamp" ? "🔒" : "📦"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
