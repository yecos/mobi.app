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
 * Each input is a white box with black text, positioned exactly over
 * the original text bounding box. The font size is scaled from the
 * original image coordinates to the displayed size using a ResizeObserver.
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
  // Scale the OCR fontSize (in original image pixels) to the displayed size
  const displayFontSize = region.fontSize * scaleFactor;

  // The bounding box from OCR, positioned via percentages over the image
  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: `${region.x}%`,
    top: `${region.y}%`,
    width: `${region.w}%`,
    height: `${region.h}%`,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  };

  // The input style: fills the entire bounding box, black text on white bg
  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    fontSize: `${displayFontSize}px`,
    fontWeight: region.bold ? "bold" : "normal",
    color: "#000000",
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    padding: "0",
    margin: "0",
    lineHeight: "1.15",
    fontFamily: "sans-serif",
    // Vertically center the text within the bounding box
    display: "flex",
    alignItems: "center",
    paddingLeft: "1px",
  };

  if (isActive || inlineEditing) {
    return (
      <div
        style={containerStyle}
        className={isActive ? "ring-2 ring-blue-500/80 z-10" : "hover:ring-1 hover:ring-blue-400/40 z-[5]"}
        onClick={(e) => { e.stopPropagation(); onActivate(); }}
      >
        <input
          type="text"
          value={region.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          style={inputStyle}
          autoFocus={isActive}
        />
      </div>
    );
  }

  return (
    <div
      style={containerStyle}
      className="cursor-pointer hover:ring-1 hover:ring-blue-400/40"
      onClick={(e) => { e.stopPropagation(); onActivate(); }}
    >
      <span
        style={{
          ...inputStyle,
          display: "inline-block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          verticalAlign: "middle",
          lineHeight: `${displayFontSize * 1.15}px`,
          height: "100%",
          boxSizing: "border-box",
          paddingLeft: "1px",
        }}
      >
        {region.text}
      </span>
    </div>
  );
}
