"use client";

import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  Environment,
  Center,
} from "@react-three/drei";
import ChairModel from "./chair-model";
import TableModel from "./table-model";
import SofaModel from "./sofa-model";
import ShelfModel from "./shelf-model";
import type { Category } from "@/types/furniture";

interface FurnitureViewerProps {
  categorySlug: string;
  category: Category;
  color: string;
  autoRotate?: boolean;
}

function FurnitureModel({
  categorySlug,
  color,
}: {
  categorySlug: string;
  color: string;
}) {
  switch (categorySlug) {
    case "sillas":
      return <ChairModel color={color} />;
    case "mesas":
      return <TableModel color={color} />;
    case "sofas":
      return <SofaModel color={color} />;
    case "estantes":
      return <ShelfModel color={color} />;
    default:
      return <ChairModel color={color} />;
  }
}

export default function FurnitureViewer({
  categorySlug,
  color,
  autoRotate = true,
}: FurnitureViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[400px] bg-background/50 rounded-lg overflow-hidden">
      <Canvas
        ref={canvasRef}
        shadows
        camera={{ position: [3, 2.5, 3], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["transparent"]} />
        <fog attach="fog" args={["#0a0a0a", 8, 25]} />

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <spotLight
          position={[-3, 5, -2]}
          intensity={0.6}
          angle={0.4}
          penumbra={0.8}
        />
        <pointLight position={[0, 3, -3]} intensity={0.3} />

        {/* Model */}
        <Center>
          <FurnitureModel categorySlug={categorySlug} color={color} />
        </Center>

        {/* Ground shadows */}
        <ContactShadows
          position={[0, -0.01, 0]}
          opacity={0.4}
          scale={10}
          blur={2.5}
          far={4}
        />

        {/* Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={2}
          maxDistance={8}
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
        />

        {/* Environment */}
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
