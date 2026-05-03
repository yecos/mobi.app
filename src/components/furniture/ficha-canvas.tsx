"use client";

import { useEffect, useRef, useState } from "react";
import { useMobiStore, type TextRegion } from "@/store/mobi-store";

interface FichaCanvasProps {
  inlineEditing?: boolean;
}

/**
 * Renders the uploaded image with overlaid input fields at the exact
 * positions where text was detected by OCR.
 *
 * Positioning: Uses CSS percentages (left/top/width/height) relative to
 * the container. Since the image fills the container width and maintains
 * its aspect ratio, the percentage coordinates from OCR map exactly to
 * the correct positions on the displayed image.
 *
 * Font size: Calculated from the container width and the image's natural
 * aspect ratio, then scaled from the original image coordinates.
 * lineHeight: 1 ensures text fills the bounding box height.
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
  // Scale factor from original image to displayed size
  const scaleFactor = containerWidth > 0 ? containerWidth / imageWidth : 1;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-muted/20 rounded-lg select-none"
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
  // Font size scaled to displayed image size.
  // With lineHeight: 1, the text visually fills the bounding box height.
  const displayFontSize = region.fontSize * scaleFactor;

  // Use percentage positioning — this maps directly to the image coordinates
  // because the image fills the container width with h-auto (aspect ratio preserved)
  const boxStyle: React.CSSProperties = {
    position: "absolute",
    left: `${region.x}%`,
    top: `${region.y}%`,
    width: `${region.w}%`,
    height: `${region.h}%`,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    boxSizing: "border-box",
  };

  // Text styling: black text, lineHeight 1 fills the box height
  const textStyle: React.CSSProperties = {
    fontSize: `${displayFontSize}px`,
    lineHeight: "1",
    fontWeight: region.bold ? "bold" : "normal",
    color: "#000000",
    fontFamily: "Arial, Helvetica, sans-serif",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  if (isActive || inlineEditing) {
    return (
      <div
        style={{
          ...boxStyle,
          zIndex: isActive ? 10 : 5,
          outline: isActive ? "2px solid rgba(59,130,246,0.8)" : undefined,
        }}
        onClick={(e) => { e.stopPropagation(); onActivate(); }}
      >
        <input
          type="text"
          value={region.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          style={{
            ...textStyle,
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            padding: "0",
            margin: "0",
            display: "block",
            boxSizing: "border-box",
            WebkitAppearance: "none",
            appearance: "none",
          }}
          autoFocus={isActive}
        />
      </div>
    );
  }

  return (
    <div
      style={boxStyle}
      className="cursor-pointer hover:outline hover:outline-1 hover:outline-blue-400/40"
      onClick={(e) => { e.stopPropagation(); onActivate(); }}
    >
      <div style={textStyle}>
        {region.text}
      </div>
    </div>
  );
}
