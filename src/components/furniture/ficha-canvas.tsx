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
 * the original text bounding box. Font size is calculated to fill the
 * bounding box height (lineHeight: 1), so the text visually matches
 * the original text size.
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
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerWidth(width);
      setContainerHeight(height);
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

  return (
    <div
      ref={containerRef}
      className="ficha-canvas-container relative w-full overflow-visible bg-muted/20 rounded-lg select-none"
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
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
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
  containerWidth,
  containerHeight,
  imageWidth,
  imageHeight,
  isActive,
  inlineEditing,
  onUpdate,
  onActivate,
}: {
  region: TextRegion;
  containerWidth: number;
  containerHeight: number;
  imageWidth: number;
  imageHeight: number;
  isActive: boolean;
  inlineEditing: boolean;
  onUpdate: (updates: Partial<TextRegion>) => void;
  onActivate: () => void;
}) {
  // Calculate the scale factor from original image to displayed size
  const scaleFactorX = containerWidth > 0 ? containerWidth / imageWidth : 1;
  const scaleFactorY = containerHeight > 0 ? containerHeight / imageHeight : 1;

  // Convert OCR percentage coordinates to display pixels
  const displayX = (region.x / 100) * containerWidth;
  const displayY = (region.y / 100) * containerHeight;
  const displayW = (region.w / 100) * containerWidth;
  const displayH = (region.h / 100) * containerHeight;

  // Font size: use the bounding box height directly.
  // With lineHeight: 1, the text fills the full box height,
  // matching the original text size in the image.
  const displayFontSize = displayH;

  // Container div: positioned exactly at the OCR bounding box
  const boxStyle: React.CSSProperties = {
    position: "absolute",
    left: `${displayX}px`,
    top: `${displayY}px`,
    width: `${displayW}px`,
    height: `${displayH}px`,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    cursor: "text",
    boxSizing: "border-box",
  };

  // Text style shared between input and display
  const textStyle: React.CSSProperties = {
    fontSize: `${displayFontSize}px`,
    lineHeight: "1",
    fontWeight: region.bold ? "bold" : "normal",
    color: "#000000",
    fontFamily: "Arial, Helvetica, sans-serif",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    padding: "0",
    margin: "0",
    border: "none",
    outline: "none",
    boxSizing: "border-box",
  };

  if (isActive || inlineEditing) {
    return (
      <div
        style={{
          ...boxStyle,
          zIndex: isActive ? 10 : 5,
          outline: isActive ? "2px solid rgba(59,130,246,0.8)" : "none",
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
            display: "block",
            // Remove default input styling that causes offset
            WebkitAppearance: "none" as React.CSSProperties["WebkitAppearance"],
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
      className="hover:outline hover:outline-1 hover:outline-blue-400/40"
      onClick={(e) => { e.stopPropagation(); onActivate(); }}
    >
      <div style={textStyle}>
        {region.text}
      </div>
    </div>
  );
}
