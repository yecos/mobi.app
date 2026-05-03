"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Float,
  MeshDistortMaterial,
  RoundedBox,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import type { FurnitureItem } from "@/lib/furniture-data";

interface FurnitureViewerProps {
  item: FurnitureItem;
  selectedFinish: string;
}

function ChairModel({ color, hex }: { color: string; hex: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  const woodColor = useMemo(() => hex, [hex]);

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Seat */}
      <RoundedBox args={[0.5, 0.04, 0.45]} radius={0.01} position={[0, 0.4, 0]}>
        <meshStandardMaterial color={woodColor} roughness={0.4} metalness={0.05} />
      </RoundedBox>

      {/* Backrest Y-shape */}
      <mesh position={[0, 0.75, -0.18]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.04, 0.5, 0.04]} />
        <meshStandardMaterial color={woodColor} roughness={0.4} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.55, -0.18]} rotation={[0.15, 0, 0.3]}>
        <boxGeometry args={[0.04, 0.25, 0.04]} />
        <meshStandardMaterial color={woodColor} roughness={0.4} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.55, -0.18]} rotation={[0.15, 0, -0.3]}>
        <boxGeometry args={[0.04, 0.25, 0.04]} />
        <meshStandardMaterial color={woodColor} roughness={0.4} metalness={0.05} />
      </mesh>

      {/* Woven seat */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.44, 0.015, 0.38]} />
        <meshStandardMaterial color="#D4C4A8" roughness={0.8} metalness={0} />
      </mesh>

      {/* Legs */}
      {[
        [0.2, 0.2, -0.17],
        [-0.2, 0.2, -0.17],
        [0.2, 0.2, 0.17],
        [-0.2, 0.2, 0.17],
      ].map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1] / 2, pos[2]]}>
          <cylinderGeometry args={[0.015, 0.012, 0.42, 8]} />
          <meshStandardMaterial color={woodColor} roughness={0.4} metalness={0.05} />
        </mesh>
      ))}

      {/* Back leg supports */}
      {[
        [0.2, 0.2, -0.17],
        [-0.2, 0.2, -0.17],
      ].map((pos, i) => (
        <mesh key={`bl${i}`} position={[pos[0], 0.58, pos[2]]}>
          <cylinderGeometry args={[0.013, 0.013, 0.38, 8]} />
          <meshStandardMaterial color={woodColor} roughness={0.4} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

function TableModel({ hex }: { hex: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.6, 0]}>
      {/* Table top */}
      <RoundedBox args={[1.4, 0.04, 0.9]} radius={0.005} position={[0, 0.55, 0]}>
        <meshStandardMaterial color={hex} roughness={0.35} metalness={0.05} />
      </RoundedBox>

      {/* Two interlocking base pieces - Noguchi style */}
      <mesh position={[0, 0.1, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.03, 0.65, 0.7]} />
        <meshStandardMaterial color={hex} roughness={0.35} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.03, 0.65, 0.7]} />
        <meshStandardMaterial color={hex} roughness={0.35} metalness={0.05} />
      </mesh>

      {/* Intersection lock */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.06, 0.04, 0.06]} />
        <meshStandardMaterial color={hex} roughness={0.35} metalness={0.05} />
      </mesh>
    </group>
  );
}

function SofaModel({ hex }: { hex: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.4, 0]}>
      {/* Base frame */}
      <RoundedBox args={[1.6, 0.15, 0.65]} radius={0.02} position={[0, 0.25, 0]}>
        <meshStandardMaterial color="#2A2A2A" roughness={0.3} metalness={0.8} />
      </RoundedBox>

      {/* Seat cushion */}
      <RoundedBox args={[1.45, 0.18, 0.55]} radius={0.03} position={[0, 0.42, 0.02]}>
        <meshStandardMaterial color={hex} roughness={0.6} metalness={0.02} />
      </RoundedBox>

      {/* Back cushion */}
      <RoundedBox args={[1.45, 0.35, 0.12]} radius={0.03} position={[0, 0.6, -0.25]}>
        <meshStandardMaterial color={hex} roughness={0.6} metalness={0.02} />
      </RoundedBox>

      {/* Side cushions */}
      <RoundedBox args={[0.12, 0.35, 0.55]} radius={0.03} position={[0.7, 0.6, 0.02]}>
        <meshStandardMaterial color={hex} roughness={0.6} metalness={0.02} />
      </RoundedBox>
      <RoundedBox args={[0.12, 0.35, 0.55]} radius={0.03} position={[-0.7, 0.6, 0.02]}>
        <meshStandardMaterial color={hex} roughness={0.6} metalness={0.02} />
      </RoundedBox>

      {/* X-frame legs */}
      {[
        [0.55, 0.08, -0.2, 0.2],
        [-0.55, 0.08, -0.2, -0.2],
        [0.55, 0.08, 0.2, 0.2],
        [-0.55, 0.08, 0.2, -0.2],
      ].map(([x, y, z, rot], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} rotation={[0, 0, (rot as number) * 0.3]}>
          <cylinderGeometry args={[0.015, 0.015, 0.25, 8]} />
          <meshStandardMaterial color="#2A2A2A" roughness={0.3} metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function ShelfModel({ hex }: { hex: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  const shelves = 5;
  return (
    <group ref={groupRef} position={[0, -0.4, 0]}>
      {/* Side panels */}
      <mesh position={[-0.55, 0.4, 0]}>
        <boxGeometry args={[0.015, 1.2, 0.25]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0.55, 0.4, 0]}>
        <boxGeometry args={[0.015, 1.2, 0.25]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Shelves */}
      {Array.from({ length: shelves }).map((_, i) => (
        <RoundedBox key={i} args={[1.05, 0.02, 0.25]} radius={0.003} position={[0, -0.2 + i * 0.3, 0]}>
          <meshStandardMaterial color={hex} roughness={0.4} metalness={0.05} />
        </RoundedBox>
      ))}

      {/* Decorative books/items on shelves */}
      {[
        { pos: [-0.2, 0.12, 0] as [number, number, number], scale: [0.08, 0.18, 0.15] as [number, number, number], color: "#8B4513" },
        { pos: [0.1, 0.42, 0] as [number, number, number], scale: [0.06, 0.15, 0.13] as [number, number, number], color: "#A0522D" },
        { pos: [-0.3, 0.72, 0] as [number, number, number], scale: [0.1, 0.12, 0.14] as [number, number, number], color: "#CD853F" },
      ].map((item, i) => (
        <mesh key={`book${i}`} position={item.pos} scale={item.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={item.color} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function LampModel({ hex }: { hex: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.6, 0]}>
      {/* Base */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.04, 32]} />
        <meshStandardMaterial color={hex} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Hole in base */}
      <mesh position={[0, 0.04, 0]}>
        <torusGeometry args={[0.06, 0.015, 8, 32]} />
        <meshStandardMaterial color={hex} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Stem */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.82, 8]} />
        <meshStandardMaterial color={hex} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Shade - asymmetrical */}
      <mesh position={[0.05, 0.92, 0]} rotation={[0.15, 0, 0.1]}>
        <coneGeometry args={[0.18, 0.2, 32, 1, true]} />
        <meshStandardMaterial color={hex} roughness={0.3} metalness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Inner glow */}
      <mesh position={[0.05, 0.9, 0]} rotation={[0.15, 0, 0.1]}>
        <coneGeometry args={[0.16, 0.18, 32, 1, true]} />
        <meshStandardMaterial color="#FFF8E7" emissive="#FFF8E7" emissiveIntensity={0.3} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Light cone */}
      <mesh position={[0.08, 0.6, 0.1]} rotation={[0.2, 0, 0.1]}>
        <coneGeometry args={[0.25, 0.5, 32, 1, true]} />
        <meshStandardMaterial color="#FFF8E7" transparent opacity={0.04} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function BedModel({ hex }: { hex: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Platform base */}
      <RoundedBox args={[1.5, 0.08, 2.0]} radius={0.01} position={[0, 0.15, 0]}>
        <meshStandardMaterial color={hex} roughness={0.4} metalness={0.05} />
      </RoundedBox>

      {/* Slatted headboard */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} position={[-0.5 + i * 0.17, 0.5, -0.92]}>
          <boxGeometry args={[0.06, 0.5, 0.025]} />
          <meshStandardMaterial color={hex} roughness={0.4} metalness={0.05} />
        </mesh>
      ))}

      {/* Headboard top rail */}
      <RoundedBox args={[1.4, 0.03, 0.03]} radius={0.005} position={[0, 0.77, -0.92]}>
        <meshStandardMaterial color={hex} roughness={0.4} metalness={0.05} />
      </RoundedBox>

      {/* Mattress */}
      <RoundedBox args={[1.35, 0.18, 1.85]} radius={0.02} position={[0, 0.3, 0.03]}>
        <meshStandardMaterial color="#E8E0D4" roughness={0.8} metalness={0} />
      </RoundedBox>

      {/* Pillow */}
      <RoundedBox args={[0.5, 0.08, 0.35]} radius={0.03} position={[-0.25, 0.42, -0.65]}>
        <meshStandardMaterial color="#F5F0E8" roughness={0.9} metalness={0} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.08, 0.35]} radius={0.03} position={[0.25, 0.42, -0.65]}>
        <meshStandardMaterial color="#F5F0E8" roughness={0.9} metalness={0} />
      </RoundedBox>

      {/* Low legs */}
      {[
        [-0.65, 0.05, -0.9],
        [0.65, 0.05, -0.9],
        [-0.65, 0.05, 0.9],
        [0.65, 0.05, 0.9],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
          <meshStandardMaterial color={hex} roughness={0.4} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

function ModelSelector({ item, hex }: { item: FurnitureItem; hex: string }) {
  switch (item.modelType) {
    case "chair":
      return <ChairModel color={item.finishes[0]?.name || "Roble Natural"} hex={hex} />;
    case "table":
      return <TableModel hex={hex} />;
    case "sofa":
      return <SofaModel hex={hex} />;
    case "shelf":
      return <ShelfModel hex={hex} />;
    case "lamp":
      return <LampModel hex={hex} />;
    case "bed":
      return <BedModel hex={hex} />;
    default:
      return <ChairModel color="Roble Natural" hex={hex} />;
  }
}

export default function FurnitureViewer({ item, selectedFinish }: FurnitureViewerProps) {
  const currentFinish = item.finishes.find((f) => f.id === selectedFinish) || item.finishes[0];
  const hex = currentFinish?.hex || "#C4A882";

  return (
    <div className="w-full h-full bg-background rounded-xl overflow-hidden">
      <Canvas
        camera={{ position: [2, 1.5, 2], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} />
        <pointLight position={[0, 3, 0]} intensity={0.2} />

        <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
          <ModelSelector item={item} hex={hex} />
        </Float>

        <ContactShadows
          position={[0, -1.1, 0]}
          opacity={0.3}
          scale={5}
          blur={2.5}
          far={4}
        />

        <Environment preset="city" />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={2}
          maxDistance={6}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}
