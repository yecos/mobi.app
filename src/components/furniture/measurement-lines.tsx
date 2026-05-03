"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { Line, Html } from "@react-three/drei";
import { useMobiStore, type Measurement } from "@/store/mobi-store";

// Scale factor: 1 Three.js unit = 100 cm (so 1 unit = 1 meter)
const SCALE_CM = 100;

function MeasurementLine({ measurement }: { measurement: Measurement }) {
  const { start, end, distance } = measurement;

  // Direction vector
  const direction = useMemo(() => {
    const dir = new THREE.Vector3(
      end[0] - start[0],
      end[1] - start[1],
      end[2] - start[2]
    );
    return dir.normalize();
  }, [start, end]);

  // Midpoint for label
  const midpoint = useMemo<[number, number, number]>(
    () => [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
      (start[2] + end[2]) / 2,
    ],
    [start, end]
  );

  // Arrow endpoints (small offsets)
  const arrowSize = 0.03;
  const arrowStart1 = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const d = direction.clone().multiplyScalar(arrowSize * 3);
    const perp = new THREE.Vector3();
    perp.crossVectors(direction, new THREE.Vector3(0, 1, 0));
    if (perp.length() < 0.01) {
      perp.crossVectors(direction, new THREE.Vector3(1, 0, 0));
    }
    perp.normalize().multiplyScalar(arrowSize);
    const p1 = s.clone().add(d).add(perp);
    const p2 = s.clone().add(d).sub(perp);
    return [p1.toArray(), p2.toArray()] as [
      [number, number, number],
      [number, number, number]
    ];
  }, [start, direction]);

  const arrowEnd1 = useMemo(() => {
    const e = new THREE.Vector3(...end);
    const d = direction.clone().multiplyScalar(-arrowSize * 3);
    const perp = new THREE.Vector3();
    perp.crossVectors(direction, new THREE.Vector3(0, 1, 0));
    if (perp.length() < 0.01) {
      perp.crossVectors(direction, new THREE.Vector3(1, 0, 0));
    }
    perp.normalize().multiplyScalar(arrowSize);
    const p1 = e.clone().add(d).add(perp);
    const p2 = e.clone().add(d).sub(perp);
    return [p1.toArray(), p2.toArray()] as [
      [number, number, number],
      [number, number, number]
    ];
  }, [end, direction]);

  return (
    <group>
      {/* Main measurement line */}
      <Line
        points={[start, end]}
        color="#ef4444"
        lineWidth={2}
        dashed
        dashSize={0.02}
        gapSize={0.01}
      />

      {/* Start arrow */}
      <Line points={[start, arrowStart1[0]]} color="#ef4444" lineWidth={2} />
      <Line points={[start, arrowStart1[1]]} color="#ef4444" lineWidth={2} />

      {/* End arrow */}
      <Line points={[end, arrowEnd1[0]]} color="#ef4444" lineWidth={2} />
      <Line points={[end, arrowEnd1[1]]} color="#ef4444" lineWidth={2} />

      {/* Distance label */}
      <Html position={midpoint} center distanceFactor={5}>
        <div className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] font-mono whitespace-nowrap shadow-lg pointer-events-none select-none">
          {distance.toFixed(1)} cm
        </div>
      </Html>
    </group>
  );
}

// First point indicator (pulsing sphere when measuring)
function FirstPointIndicator({ point }: { point: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef} position={point}>
      <sphereGeometry args={[0.02, 16, 16]} />
      <meshBasicMaterial color="#ef4444" />
    </mesh>
  );
}

export default function MeasurementLines() {
  const { measurements, firstPoint } = useMobiStore();

  return (
    <group>
      {measurements.map((m) => (
        <MeasurementLine key={m.id} measurement={m} />
      ))}
      {firstPoint && <FirstPointIndicator point={firstPoint} />}
    </group>
  );
}

export { MeasurementLine, SCALE_CM };
