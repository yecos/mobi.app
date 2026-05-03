"use client";

import { useEffect, useRef, useState } from "react";
import { useMobiStore, type TextRegion } from "@/store/mobi-store";

interface FichaCanvasProps {
  inlineEditing?: boolean;
  showDebug?: boolean;
}

/**
 * Renders the uploaded image with overlaid input fields at the exact
 * positions where text was detected by OCR.
 *
 * APPROACH: The container uses CSS `aspect-ratio` matching the image
 * dimensions, so percentage-based `top`/`left`/`width`/`height` on
 * absolute-positioned children map directly to the correct pixel
 * positions on the displayed image.
 */
export default function FichaCanvas({ inlineEditing = true, showDebug = false }: FichaCanvasProps) {
  const uploadedImage = useMobiStore((s) => s.uploadedImage);
  const detectionResult = useMobiStore((s) => s.detectionResult);
  const editedRegions = useMobiStore((s) => s.editedRegions);
  const updateRegion = useMobiStore((s) => s.updateRegion);
  const activeFieldId = useMobiStore((s) => s.activeFieldId);
  const setActiveFieldId = useMobiStore((s) => s.setActiveFieldId);
  const scale = useMobiStore((s) => s.scale);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [displayWidth, setDisplayWidth] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setDisplayWidth(entries[0].contentRect.width);
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
  const aspectRatio = imageWidth / imageHeight;
  const scaleFactor = displayWidth > 0 ? displayWidth / imageWidth : 1;

  return (
    <div
      ref={wrapperRef}
      style={{
        transform: `scale(${scale / 100})`,
        transformOrigin: "top center",
      }}
    >
      {/* This is the key container: position relative + aspect-ratio from the image */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: `${imageWidth} / ${imageHeight}`,
          overflow: "hidden",
          borderRadius: "8px",
          backgroundColor: "#f5f5f5",
          userSelect: "none",
        }}
        onClick={() => setActiveFieldId(null)}
      >
        {/* Image fills the container exactly */}
        <img
          src={uploadedImage}
          alt="Ficha técnica"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
            pointerEvents: "none",
          }}
          draggable={false}
        />

        {/* Text region overlays */}
        {editedRegions.map((region) => (
          <TextRegionInput
            key={region.id}
            region={region}
            scaleFactor={scaleFactor}
            isActive={activeFieldId === region.id}
            inlineEditing={inlineEditing}
            showDebug={showDebug}
            onUpdate={(updates) => updateRegion(region.id, updates)}
            onActivate={() => setActiveFieldId(region.id)}
          />
        ))}

        {/* Debug: show OCR coordinates */}
        {showDebug && editedRegions.map((region, i) => (
          <div
            key={`debug-${region.id}`}
            style={{
              position: "absolute",
              left: `${region.x}%`,
              top: `${region.y}%`,
              width: `${region.w}%`,
              height: `${region.h}%`,
              border: "2px solid red",
              backgroundColor: "rgba(255,0,0,0.1)",
              pointerEvents: "none",
              zIndex: 100,
            }}
          >
            <span style={{ fontSize: "9px", color: "red", background: "white", padding: "1px" }}>
              {i}: {region.x.toFixed(1)},{region.y.toFixed(1)} {region.w.toFixed(1)}x{region.h.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TextRegionInput({
  region,
  scaleFactor,
  isActive,
  inlineEditing,
  showDebug,
  onUpdate,
  onActivate,
}: {
  region: TextRegion;
  scaleFactor: number;
  isActive: boolean;
  inlineEditing: boolean;
  showDebug: boolean;
  onUpdate: (updates: Partial<TextRegion>) => void;
  onActivate: () => void;
}) {
  // Font size scaled to displayed image size
  const displayFontSize = region.fontSize * scaleFactor;

  // IMPORTANT: All positioning via inline styles with percentage values.
  // These percentages are relative to the container which has aspect-ratio
  // matching the original image, so they map exactly to pixel positions.
  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    left: `${region.x}%`,
    top: `${region.y}%`,
    width: `${region.w}%`,
    height: `${region.h}%`,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    boxSizing: "border-box",
    zIndex: isActive ? 10 : 5,
    cursor: "text",
  };

  // Shared text style
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
          ...wrapperStyle,
          outline: isActive ? "2px solid #3b82f6" : undefined,
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
            appearance: "none" as unknown as undefined,
          }}
          autoFocus={isActive}
        />
        {showDebug && (
          <div style={{ position: "absolute", bottom: 0, right: 0, fontSize: "7px", background: "yellow", padding: "1px", color: "black" }}>
            {region.fontSize}px
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={wrapperStyle}
      onClick={(e) => { e.stopPropagation(); onActivate(); }}
    >
      <div style={textStyle}>
        {region.text}
      </div>
    </div>
  );
}
