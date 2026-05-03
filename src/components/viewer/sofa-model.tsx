"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SofaModelProps {
  color: string;
}

export default function SofaModel({ color }: SofaModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  const fabricMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.85,
    metalness: 0.0,
  });

  const legMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#C4A882"),
    roughness: 0.4,
    metalness: 0.05,
  });

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
    }
  });

  return (
    <group ref={groupRef} scale={0.55}>
      {/* Base frame */}
      <mesh position={[0, 0.2, 0]} castShadow material={fabricMaterial}>
        <boxGeometry args={[2.0, 0.18, 0.75]} />
      </mesh>

      {/* Seat cushion */}
      <mesh position={[0, 0.38, 0.02]} castShadow material={fabricMaterial}>
        <boxGeometry args={[1.88, 0.16, 0.68]} />
      </mesh>

      {/* Back cushion */}
      <mesh
        position={[0, 0.62, -0.3]}
        castShadow
        material={fabricMaterial}
      >
        <boxGeometry args={[1.88, 0.48, 0.14]} />
      </mesh>

      {/* Left armrest */}
      <mesh position={[-0.94, 0.42, -0.05]} castShadow material={fabricMaterial}>
        <boxGeometry args={[0.12, 0.38, 0.7]} />
      </mesh>

      {/* Right armrest */}
      <mesh position={[0.94, 0.42, -0.05]} castShadow material={fabricMaterial}>
        <boxGeometry args={[0.12, 0.38, 0.7]} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.85, 0.04, 0.28]} castShadow material={legMaterial}>
        <boxGeometry args={[0.04, 0.08, 0.04]} />
      </mesh>
      <mesh position={[0.85, 0.04, 0.28]} castShadow material={legMaterial}>
        <boxGeometry args={[0.04, 0.08, 0.04]} />
      </mesh>
      <mesh position={[-0.85, 0.04, -0.28]} castShadow material={legMaterial}>
        <boxGeometry args={[0.04, 0.08, 0.04]} />
      </mesh>
      <mesh position={[0.85, 0.04, -0.28]} castShadow material={legMaterial}>
        <boxGeometry args={[0.04, 0.08, 0.04]} />
      </mesh>

      {/* Cushion dividers (subtle lines) */}
      <mesh position={[-0.47, 0.465, 0.02]} material={fabricMaterial}>
        <boxGeometry args={[0.01, 0.04, 0.5]} />
      </mesh>
      <mesh position={[0.47, 0.465, 0.02]} material={fabricMaterial}>
        <boxGeometry args={[0.01, 0.04, 0.5]} />
      </mesh>
    </group>
  );
}
