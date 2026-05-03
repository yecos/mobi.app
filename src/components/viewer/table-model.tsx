"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TableModelProps {
  color: string;
}

export default function TableModel({ color }: TableModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  const topMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.5,
    metalness: 0.05,
  });

  const legMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).multiplyScalar(0.9),
    roughness: 0.4,
    metalness: 0.05,
  });

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.6) * 0.015;
    }
  });

  return (
    <group ref={groupRef} scale={0.65}>
      {/* Table top */}
      <mesh position={[0, 0.73, 0]} castShadow material={topMaterial}>
        <boxGeometry args={[1.6, 0.04, 0.8]} />
      </mesh>

      {/* Legs - tapered with rotation */}
      {/* Front left */}
      <mesh
        position={[-0.7, 0.36, 0.32]}
        castShadow
        material={legMaterial}
      >
        <boxGeometry args={[0.06, 0.72, 0.06]} />
      </mesh>
      {/* Front right */}
      <mesh
        position={[0.7, 0.36, 0.32]}
        castShadow
        material={legMaterial}
      >
        <boxGeometry args={[0.06, 0.72, 0.06]} />
      </mesh>
      {/* Back left */}
      <mesh
        position={[-0.7, 0.36, -0.32]}
        castShadow
        material={legMaterial}
      >
        <boxGeometry args={[0.06, 0.72, 0.06]} />
      </mesh>
      {/* Back right */}
      <mesh
        position={[0.7, 0.36, -0.32]}
        castShadow
        material={legMaterial}
      >
        <boxGeometry args={[0.06, 0.72, 0.06]} />
      </mesh>

      {/* Apron - front */}
      <mesh position={[0, 0.64, 0.32]} castShadow material={legMaterial}>
        <boxGeometry args={[1.34, 0.08, 0.03]} />
      </mesh>
      {/* Apron - back */}
      <mesh position={[0, 0.64, -0.32]} castShadow material={legMaterial}>
        <boxGeometry args={[1.34, 0.08, 0.03]} />
      </mesh>
      {/* Apron - left */}
      <mesh
        position={[-0.68, 0.64, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
        material={legMaterial}
      >
        <boxGeometry args={[0.58, 0.08, 0.03]} />
      </mesh>
      {/* Apron - right */}
      <mesh
        position={[0.68, 0.64, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
        material={legMaterial}
      >
        <boxGeometry args={[0.58, 0.08, 0.03]} />
      </mesh>
    </group>
  );
}
