"use client";

import { useEffect, useRef, useState } from "react";
import { useMobiStore, type TextRegion } from "@/store/mobi-store";

interface FichaCanvasProps {
  inlineEditing?: boolean;
}

/**
 * Renders the uploaded image with overlaid input fields at the exact
 * positions where text was detected. Font sizes are computed by scaling
 * the original pixel fontSize using a ResizeObserver, ensuring the
 * input text matches the original text size at any zoom level.
 *
 * Inputs have white background + black text so they clearly cover
 * the original text and are easy to read/edit.
 */
export default function FichaCanvas({ inlineEditing = true }: FichaCanvasProps) {
  const uploadedImage = useMobiStore((s) => s.uploadedImage);
  const detectionResult = useMobiStore((s) => s.detectionResult);
  const editedRegions = useMobiStore((s) => s.editedRegions);
  const updateRegion = useMobiStore((s) => s.updateRegion);
  const activeFieldId = useMobiStore((s) => s.activeFieldId);
  const setActiveFieldId = useMobiStore((s) => s.setActiveFieldId);
  const scale = useMobiStore((s) => s.scale);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!uploadedImage || !detectionResult || editedRegions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No hay datos del lienzo
      </div>
    );
  }

  const { imageWidth, imageHeight } = detectionResult;
  const scaleFactor = containerWidth > 0 ? containerWidth / imageWidth : 1;

  return (
    <div
      ref={containerRef}
      className="ficha-canvas-container relative w-full overflow-hidden bg-muted/20 rounded-lg select-none"
      style={{
        transform: `scale(${scale / 100})`,
        transformOrigin: "top center",
      }}
      onClick={() => setActiveFieldId(null)}
    >
      <img
        src={uploadedImage}
        alt="Ficha técnica"
        className="w-full h-auto block"
        draggable={false}
      />
      {editedRegions.map((region) => (
        <TextRegionInput
          key={region.id}
          region={region}
          scaleFactor={scaleFactor}
          isActive={activeFieldId === region.id}
          inlineEditing={inlineEditing}
          onUpdate={(updates) => updateRegion(region.id, updates)}
          onActivate={() => setActiveFieldId(region.id)}
        />
      ))}
    </div>
  );
}

function TextRegionInput({
  region,
  scaleFactor,
  isActive,
  inlineEditing,
  onUpdate,
  onActivate,
}: {
  region: TextRegion;
  scaleFactor: number;
  isActive: boolean;
  inlineEditing: boolean;
  onUpdate: (updates: Partial<TextRegion>) => void;
  onActivate: () => void;
}) {
  // Scale fontSize to match the displayed image size
  const displayFontSize = Math.round(region.fontSize * scaleFactor);

  // Position and size match the OCR bounding box exactly (percentages of image)
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${region.x}%`,
    top: `${region.y}%`,
    width: `${region.w}%`,
    height: `${region.h}%`,
    fontSize: `${displayFontSize}px`,
    fontWeight: region.bold ? "bold" : "normal",
    color: "#000000",
    lineHeight: "1",
    backgroundColor: "#FFFFFF",
  };

  if (isActive || inlineEditing) {
    return (
      <div
        style={style}
        className={`
          flex items-center cursor-text transition-all overflow-hidden
          ${isActive ? "ring-2 ring-blue-500/80 z-10" : "hover:ring-1 hover:ring-blue-400/40 z-[5]"}
        `}
        onClick={(e) => { e.stopPropagation(); onActivate(); }}
      >
        <input
          type="text"
          value={region.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="w-full h-full outline-none border-none p-0 m-0"
          style={{
            fontSize: "inherit",
            fontWeight: "inherit",
            color: "inherit",
            lineHeight: "inherit",
            backgroundColor: "inherit",
            paddingLeft: "1px",
            paddingRight: "1px",
          }}
          autoFocus={isActive}
        />
      </div>
    );
  }

  return (
    <div
      style={style}
      className="flex items-center cursor-pointer transition-all hover:ring-1 hover:ring-blue-400/40"
      onClick={(e) => { e.stopPropagation(); onActivate(); }}
    >
      <span className="truncate px-[1px]" style={{ fontSize: "inherit", fontWeight: "inherit", color: "inherit", lineHeight: "inherit" }}>
        {region.text}
      </span>
    </div>
  );
}
