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

  const { imageWidth, imageHeight, bgColor } = detectionResult;
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
          bgColor={bgColor || "#E5E5E5"}
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
  bgColor,
  isActive,
  inlineEditing,
  onUpdate,
  onActivate,
}: {
  region: TextRegion;
  scaleFactor: number;
  bgColor: string;
  isActive: boolean;
  inlineEditing: boolean;
  onUpdate: (updates: Partial<TextRegion>) => void;
  onActivate: () => void;
}) {
  const displayFontSize = Math.round(region.fontSize * scaleFactor);

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${region.x}%`,
    top: `${region.y}%`,
    width: `${region.w}%`,
    height: `${region.h}%`,
    fontSize: `${displayFontSize}px`,
    fontWeight: region.bold ? "bold" : "normal",
    color: region.color,
    lineHeight: "1.1",
  };

  if (isActive || inlineEditing) {
    return (
      <div
        style={style}
        className={`
          flex items-center cursor-text transition-all rounded-sm overflow-hidden
          ${isActive ? "ring-2 ring-blue-500/80 z-10" : "hover:ring-1 hover:ring-blue-400/40 z-[5]"}
        `}
        onClick={(e) => { e.stopPropagation(); onActivate(); }}
      >
        <div className="absolute inset-0 rounded-sm" style={{ backgroundColor: bgColor }} />
        <input
          type="text"
          value={region.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full h-full bg-transparent outline-none border-none p-0 m-0"
          style={{
            fontSize: "inherit",
            fontWeight: "inherit",
            color: "inherit",
            lineHeight: "inherit",
            paddingLeft: "2px",
          }}
          autoFocus={isActive}
        />
      </div>
    );
  }

  return (
    <div
      style={style}
      className="flex items-center cursor-pointer transition-all hover:ring-1 hover:ring-blue-400/40 rounded-sm"
      onClick={(e) => { e.stopPropagation(); onActivate(); }}
    >
      <div className="absolute inset-0 rounded-sm opacity-90" style={{ backgroundColor: bgColor }} />
      <span className="relative truncate px-[2px]" style={{ fontSize: "inherit", fontWeight: "inherit", color: "inherit", lineHeight: "inherit" }}>
        {region.text}
      </span>
    </div>
  );
}
