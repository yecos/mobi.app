"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, FileArchive, FileBox, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMobiStore } from "@/store/mobi-store";
import { toast } from "sonner";

const ACCEPTED_EXTENSIONS = [".skp", ".glb", ".gltf"];

export default function UploadZone() {
  const { fileUrl, fileName, fileType, setFile, clearFile } = useMobiStore();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (
    name: string
  ): "skp" | "glb" | "gltf" | null => {
    const ext = name.toLowerCase().split(".").pop();
    if (ext === "skp") return "skp";
    if (ext === "glb") return "glb";
    if (ext === "gltf") return "gltf";
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const type = getFileType(file.name);
      if (!type) {
        toast.error("Formato no soportado", {
          description: "Solo se aceptan archivos .skp, .glb, .gltf",
        });
        return;
      }

      const url = URL.createObjectURL(file);
      setFile(url, file.name, type);

      if (type === "skp") {
        toast.warning("Archivo SketchUp detectado", {
          description:
            "Los archivos .skp no se pueden visualizar directamente en el navegador. Exporta tu modelo como GLB desde SketchUp para verlo en 3D.",
          duration: 8000,
        });
      } else {
        toast.success("Modelo cargado", {
          description: `${file.name} se ha cargado correctamente.`,
        });
      }
    },
    [setFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (fileUrl) {
    return (
      <Card className="p-3 border-border/40 bg-card/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {fileType === "skp" ? (
              <FileArchive className="w-4 h-4 text-orange-500" />
            ) : (
              <FileBox className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {fileType?.toUpperCase()}
              </Badge>
              {fileType === "skp" && (
                <span className="text-[10px] text-orange-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Sin vista previa
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-destructive"
            onClick={() => {
              clearFile();
              toast.info("Modelo eliminado");
            }}
          >
            Eliminar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`relative border-dashed border-2 transition-all duration-200 cursor-pointer ${
        isDragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border/40 bg-card/30 hover:border-border hover:bg-card/50"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="p-4 flex flex-col items-center gap-2 text-center">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isDragging ? "bg-primary/15" : "bg-muted/50"
          }`}
        >
          <Upload
            className={`w-5 h-5 transition-colors ${
              isDragging ? "text-primary" : "text-muted-foreground"
            }`}
          />
        </div>
        <div>
          <p className="text-sm font-medium">
            {isDragging ? "Soltar archivo aquí" : "Subir modelo 3D"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Arrastra o haz clic • .GLB, .GLTF, .SKP
          </p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="hidden"
        onChange={handleInputChange}
      />
    </Card>
  );
}
