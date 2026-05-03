"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ShelfModelProps {
  color: string;
}

export default function ShelfModel({ color }: ShelfModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  const woodMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.55,
    metalness: 0.05,
  });

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).multiplyScalar(0.9),
    roughness: 0.45,
    metalness: 0.05,
  });

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.4) * 0.01;
    }
  });

  const shelfCount = 5;
  const shelfHeight = 0.2;
  const shelfSpacing = 0.32;
  const startY = 0.15;

  return (
    <group ref={groupRef} scale={0.7}>
      {/* Side panels */}
      <mesh position={[-0.4, 0.72, 0]} castShadow material={frameMaterial}>
        <boxGeometry args={[0.03, 1.5, 0.28]} />
      </mesh>
      <mesh position={[0.4, 0.72, 0]} castShadow material={frameMaterial}>
        <boxGeometry args={[0.03, 1.5, 0.28]} />
      </mesh>

      {/* Back panel */}
      <mesh
        position={[0, 0.72, -0.125]}
        castShadow
        material={frameMaterial}
      >
        <boxGeometry args={[0.77, 1.5, 0.01]} />
      </mesh>

      {/* Shelves */}
      {Array.from({ length: shelfCount }).map((_, i) => (
        <mesh
          key={i}
          position={[0, startY + i * shelfSpacing, 0]}
          castShadow
          material={woodMaterial}
        >
          <boxGeometry args={[0.77, 0.02, 0.28]} />
        </mesh>
      ))}

      {/* Top cap */}
      <mesh
        position={[0, startY + (shelfCount - 1) * shelfSpacing + 0.02, 0]}
        castShadow
        material={woodMaterial}
      >
        <boxGeometry args={[0.8, 0.025, 0.3]} />
      </mesh>

      {/* Some decorative items on shelves */}
      {/* Books on shelf 2 */}
      <mesh
        position={[-0.15, startY + 1 * shelfSpacing + 0.08, 0]}
        material={
          new THREE.MeshStandardMaterial({ color: "#8B6F5E", roughness: 0.7 })
        }
      >
        <boxGeometry args={[0.12, 0.12, 0.08]} />
      </mesh>
      <mesh
        position={[0.0, startY + 1 * shelfSpacing + 0.06, 0]}
        material={
          new THREE.MeshStandardMaterial({ color: "#6B7F6E", roughness: 0.7 })
        }
      >
        <boxGeometry args={[0.08, 0.1, 0.06]} />
      </mesh>

      {/* Vase on shelf 3 */}
      <mesh
        position={[0.2, startY + 2 * shelfSpacing + 0.08, 0.02]}
        material={
          new THREE.MeshStandardMaterial({ color: "#C9B99A", roughness: 0.3 })
        }
      >
        <cylinderGeometry args={[0.03, 0.04, 0.14, 16]} />
      </mesh>

      {/* Small box on shelf 4 */}
      <mesh
        position={[-0.2, startY + 3 * shelfSpacing + 0.05, 0]}
        material={
          new THREE.MeshStandardMaterial({ color: "#A0887B", roughness: 0.6 })
        }
      >
        <boxGeometry args={[0.1, 0.08, 0.1]} />
      </mesh>
    </group>
  );
}
