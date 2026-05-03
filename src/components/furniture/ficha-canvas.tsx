"use client";

import { useMobiStore, type TextRegion } from "@/store/mobi-store";

interface FichaCanvasProps {
  /** If true, inputs are always shown as editable fields. If false, click to edit. */
  inlineEditing?: boolean;
}

/**
 * Renders the uploaded image with overlaid input fields at the exact
 * positions where text was detected. Each input matches the detected
 * text's size (width, height, font-size) so it looks like the original
 * text but is editable.
 */
export default function FichaCanvas({ inlineEditing = true }: FichaCanvasProps) {
  const uploadedImage = useMobiStore((s) => s.uploadedImage);
  const detectionResult = useMobiStore((s) => s.detectionResult);
  const editedRegions = useMobiStore((s) => s.editedRegions);
  const updateRegion = useMobiStore((s) => s.updateRegion);
  const activeFieldId = useMobiStore((s) => s.activeFieldId);
  const setActiveFieldId = useMobiStore((s) => s.setActiveFieldId);
  const scale = useMobiStore((s) => s.scale);

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
      className="ficha-canvas-container relative w-full overflow-hidden bg-muted/20 rounded-lg select-none"
      style={{
        transform: `scale(${scale / 100})`,
        transformOrigin: "top center",
      }}
      onClick={() => setActiveFieldId(null)}
    >
      {/* Original image as background */}
      <img
        src={uploadedImage}
        alt="Ficha técnica"
        className="w-full h-auto block"
        draggable={false}
      />

      {/* Overlaid text region inputs */}
      {editedRegions.map((region) => (
        <TextRegionInput
          key={region.id}
          region={region}
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

/**
 * A single text region rendered as an input field positioned
 * absolutely over the image at the exact detected location.
 */
function TextRegionInput({
  region,
  imageWidth,
  imageHeight,
  isActive,
  inlineEditing,
  onUpdate,
  onActivate,
}: {
  region: TextRegion;
  imageWidth: number;
  imageHeight: number;
  isActive: boolean;
  inlineEditing: boolean;
  onUpdate: (updates: Partial<TextRegion>) => void;
  onActivate: () => void;
}) {
  // All positions are percentages, so they scale perfectly
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${region.x}%`,
    top: `${region.y}%`,
    width: `${region.w}%`,
    height: `${region.h}%`,
    // Scale fontSize from original image pixels to container-relative
    // The container width in the DOM is typically ~640px at 100% scale
    // So fontSize in the image maps to (fontSize / imageWidth * 100)vw —
    // but we use a simpler approach: percentage of container
    fontSize: `${(region.fontSize / imageWidth) * 100}vw`,
    fontWeight: region.bold ? "bold" : "normal",
    color: region.color,
    lineHeight: "1.1",
    letterSpacing: "normal",
  };

  // When active (focused), show the input for editing
  if (isActive || inlineEditing) {
    return (
      <div
        style={style}
        className={`
          flex items-center cursor-text transition-all rounded-sm
          ${
            isActive
              ? "ring-2 ring-primary/70 z-10 bg-background/80 backdrop-blur-[1px]"
              : "hover:ring-1 hover:ring-primary/30 z-[5] bg-transparent hover:bg-background/40"
          }
        `}
        onClick={(e) => {
          e.stopPropagation();
          onActivate();
        }}
      >
        <input
          type="text"
          value={region.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="w-full h-full bg-transparent outline-none border-none p-0 m-0"
          style={{
            fontSize: "inherit",
            fontWeight: "inherit",
            color: "inherit",
            lineHeight: "inherit",
            letterSpacing: "inherit",
          }}
          autoFocus={isActive}
        />
      </div>
    );
  }

  // Inactive: show text with transparent overlay
  return (
    <div
      style={style}
      className="flex items-center cursor-pointer transition-all hover:ring-1 hover:ring-primary/30 rounded-sm"
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
    >
      <span className="truncate opacity-70 hover:opacity-100 transition-opacity">
        {region.text}
      </span>
    </div>
  );
}
