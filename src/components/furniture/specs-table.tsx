"use client";

import { useDetailStore } from "@/store/detail-store";
import type { Furniture } from "@/types/furniture";

interface SpecsTableProps {
  furniture: Furniture;
}

export default function SpecsTable({ furniture }: SpecsTableProps) {
  const specs = [
    {
      label: "Dimensiones",
      value: `${furniture.widthCm} × ${furniture.depthCm} × ${furniture.heightCm} cm`,
    },
    ...(furniture.seatHeightCm
      ? [{ label: "Altura del asiento", value: `${furniture.seatHeightCm} cm` }]
      : []),
    { label: "Peso", value: `${furniture.weightKg} kg` },
    { label: "Material", value: furniture.primaryMaterial },
    ...(furniture.designer
      ? [{ label: "Diseñador", value: furniture.designer }]
      : []),
  ];

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Especificaciones
      </h4>
      <div className="rounded-md border border-border/40 overflow-hidden">
        {specs.map((spec, i) => (
          <div
            key={spec.label}
            className={`flex items-center justify-between px-3 py-2 text-xs ${
              i % 2 === 0 ? "bg-muted/20" : ""
            }`}
          >
            <span className="text-muted-foreground">{spec.label}</span>
            <span className="font-medium">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
