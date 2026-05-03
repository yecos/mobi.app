"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ChairModelProps {
  color: string;
}

export default function ChairModel({ color }: ChairModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.6,
    metalness: 0.05,
  });

  const legMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).multiplyScalar(0.85),
    roughness: 0.5,
    metalness: 0.05,
  });

  // Subtle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={0.8}>
      {/* Seat */}
      <mesh position={[0, 0.45, 0]} castShadow material={woodMaterial}>
        <boxGeometry args={[0.48, 0.04, 0.46]} />
      </mesh>

      {/* Backrest */}
      <mesh
        position={[0, 0.78, -0.2]}
        rotation={[0.12, 0, 0]}
        castShadow
        material={woodMaterial}
      >
        <boxGeometry args={[0.46, 0.55, 0.03]} />
      </mesh>

      {/* Front legs */}
      <mesh position={[0.2, 0.22, 0.18]} castShadow material={legMaterial}>
        <boxGeometry args={[0.035, 0.44, 0.035]} />
      </mesh>
      <mesh position={[-0.2, 0.22, 0.18]} castShadow material={legMaterial}>
        <boxGeometry args={[0.035, 0.44, 0.035]} />
      </mesh>

      {/* Back legs */}
      <mesh position={[0.2, 0.22, -0.18]} castShadow material={legMaterial}>
        <boxGeometry args={[0.035, 0.44, 0.035]} />
      </mesh>
      <mesh position={[-0.2, 0.22, -0.18]} castShadow material={legMaterial}>
        <boxGeometry args={[0.035, 0.44, 0.035]} />
      </mesh>

      {/* Cross bar - front */}
      <mesh position={[0, 0.12, 0.18]} castShadow material={legMaterial}>
        <boxGeometry args={[0.38, 0.025, 0.025]} />
      </mesh>

      {/* Cross bar - back */}
      <mesh position={[0, 0.12, -0.18]} castShadow material={legMaterial}>
        <boxGeometry args={[0.38, 0.025, 0.025]} />
      </mesh>

      {/* Cross bar - sides */}
      <mesh
        position={[0.2, 0.12, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
        material={legMaterial}
      >
        <boxGeometry args={[0.34, 0.025, 0.025]} />
      </mesh>
      <mesh
        position={[-0.2, 0.12, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
        material={legMaterial}
      >
        <boxGeometry args={[0.34, 0.025, 0.025]} />
      </mesh>
    </group>
  );
}
