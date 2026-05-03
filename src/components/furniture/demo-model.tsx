"use client";

import { useRef } from "react";
import * as THREE from "three";

// A simple Noguchi-style table for demo mode
export default function DemoTableModel() {
  const groupRef = useRef<THREE.Group>(null);

  const woodColor = "#5C4033";
  const glassColor = "#b8c8d8";

  return (
    <group ref={groupRef}>
      {/* Table top - glass */}
      <mesh position={[0, 0.73, 0]} castShadow>
        <boxGeometry args={[1.3, 0.025, 0.9]} />
        <meshStandardMaterial
          color={glassColor}
          roughness={0.05}
          metalness={0.1}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Base piece 1 - vertical plate along Z */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.03, 0.7, 0.7]} />
        <meshStandardMaterial
          color={woodColor}
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>

      {/* Base piece 2 - vertical plate along X */}
      <mesh position={[0, 0.35, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[0.03, 0.7, 0.7]} />
        <meshStandardMaterial
          color={woodColor}
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>

      {/* Lock piece at intersection top */}
      <mesh position={[0, 0.68, 0]} castShadow>
        <boxGeometry args={[0.08, 0.04, 0.08]} />
        <meshStandardMaterial
          color={woodColor}
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>

      {/* Lock piece at intersection bottom */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <boxGeometry args={[0.06, 0.04, 0.06]} />
        <meshStandardMaterial
          color={woodColor}
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}
