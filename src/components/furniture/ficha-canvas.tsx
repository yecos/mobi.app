"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useMobiStore, type TextRegion } from "@/store/mobi-store";

interface FichaCanvasProps {
  inlineEditing?: boolean;
  showDebug?: boolean;
}

/**
 * Renders the uploaded image with overlaid input fields at the exact
 * positions where text was detected by OCR.
 *
 * APPROACH: We measure the actual rendered size of the <img> element
 * and convert OCR percentage coordinates to pixel values. This is
 * bulletproof because we use the real displayed dimensions, not CSS
 * percentage calculations which can be affected by transforms, padding,
 * borders, etc.
 */
export default function FichaCanvas({ inlineEditing = true, showDebug = false }: FichaCanvasProps) {
  const uploadedImage = useMobiStore((s) => s.uploadedImage);
  const detectionResult = useMobiStore((s) => s.detectionResult);
  const editedRegions = useMobiStore((s) => s.editedRegions);
  const updateRegion = useMobiStore((s) => s.updateRegion);
  const activeFieldId = useMobiStore((s) => s.activeFieldId);
  const setActiveFieldId = useMobiStore((s) => s.setActiveFieldId);

  const imgRef = useRef<HTMLImageElement>(null);
  const [imgDisplay, setImgDisplay] = useState({ width: 0, height: 0 });

  // Measure the actual rendered image size
  const measureImg = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.clientWidth;
    const h = img.clientHeight;
    if (w > 0 && h > 0 && (w !== imgDisplay.width || h !== imgDisplay.height)) {
      setImgDisplay({ width: w, height: h });
    }
  }, [imgDisplay.width, imgDisplay.height]);

  // Also measure when image finishes loading (handles race condition
  // where the effect runs before the <img> has decoded its src)
  const handleImgLoad = useCallback(() => {
    measureImg();
  }, [measureImg]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    measureImg();
    const observer = new ResizeObserver(measureImg);
    observer.observe(img);
    return () => observer.disconnect();
  }, [measureImg, uploadedImage]);

  if (!uploadedImage || !detectionResult || editedRegions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No hay datos del lienzo
      </div>
    );
  }

  const { imageWidth, imageHeight } = detectionResult;
  const { width: dispW, height: dispH } = imgDisplay;
  const scaleFactor = dispW > 0 ? dispW / imageWidth : 1;

  return (
    <div style={{ position: "relative", width: "100%", lineHeight: "0" }}>
      {/* The image determines the container size naturally */}
      <img
        ref={imgRef}
        src={uploadedImage}
        alt="Ficha técnica"
        draggable={false}
        onLoad={handleImgLoad}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
        }}
      />

      {/* Overlay layer - positioned on top of the image using pixel values */}
      {dispW > 0 && editedRegions.map((region) => {
        // Convert OCR percentages to pixel coordinates on the displayed image
        const left = (region.x / 100) * dispW;
        const top = (region.y / 100) * dispH;
        const width = (region.w / 100) * dispW;
        const height = (region.h / 100) * dispH;
        const fontSize = region.fontSize * scaleFactor;

        if (width < 3 || height < 3) return null;

        const isActive = activeFieldId === region.id;

        return (
          <div
            key={region.id}
            style={{
              position: "absolute",
              left: left + "px",
              top: top + "px",
              width: width + "px",
              height: height + "px",
              backgroundColor: "#FFFFFF",
              overflow: "hidden",
              zIndex: isActive ? 10 : 5,
              cursor: "text",
              outline: isActive ? "2px solid #3b82f6" : undefined,
            }}
            onClick={(e) => { e.stopPropagation(); setActiveFieldId(region.id); }}
          >
            {(isActive || inlineEditing) ? (
              <input
                type="text"
                value={region.text}
                onChange={(e) => updateRegion(region.id, { text: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "100%",
                  height: "100%",
                  fontSize: fontSize + "px",
                  lineHeight: "1",
                  fontWeight: region.bold ? "bold" : "normal",
                  color: region.color,
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                  padding: "0",
                  margin: "0",
                  display: "block",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  // Force top-alignment: shrink-wrap the text line to its
                  // own height instead of letting the input center it.
                  // Most browsers honor this for single-line inputs.
                  verticalAlign: "top",
                  boxSizing: "border-box",
                }}
                autoFocus={isActive}
              />
            ) : (
              <div
                style={{
                  fontSize: fontSize + "px",
                  lineHeight: "1",
                  fontWeight: region.bold ? "bold" : "normal",
                  color: region.color,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {region.text}
              </div>
            )}

            {/* Debug: show red border + coordinates */}
            {showDebug && (
              <div style={{
                position: "absolute",
                inset: 0,
                border: "2px solid red",
                pointerEvents: "none",
                zIndex: 100,
              }}>
                <span style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  fontSize: "8px",
                  color: "red",
                  background: "rgba(255,255,255,0.9)",
                  padding: "0 2px",
                  lineHeight: "1.2",
                }}>
                  {region.text.slice(0, 15)} | x:{region.x.toFixed(1)} y:{region.y.toFixed(1)} w:{region.w.toFixed(1)} h:{region.h.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Debug: test box at known position to verify percentage mapping */}
      {showDebug && dispW > 0 && (
        <div style={{
          position: "absolute",
          left: "10%",
          top: "10%",
          width: "10%",
          height: "10%",
          border: "3px solid lime",
          zIndex: 200,
          pointerEvents: "none",
        }}>
          <span style={{ fontSize: "10px", color: "lime", background: "black", padding: "1px" }}>
            TEST 10%,10% 10x10%
          </span>
        </div>
      )}
    </div>
  );
}
