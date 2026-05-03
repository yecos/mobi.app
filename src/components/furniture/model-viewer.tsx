"use client";

import { useRef, useCallback, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  Environment,
  Center,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { useMobiStore } from "@/store/mobi-store";
import DemoTableModel from "./demo-model";
import MeasurementLines, { SCALE_CM } from "./measurement-lines";

// Loaded GLB/GLTF model
function LoadedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (groupRef.current && scene) {
      // Clone the scene to avoid re-use issues
      const cloned = scene.clone(true);

      // Auto-center and auto-scale
      const box = new THREE.Box3().setFromObject(cloned);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 1.5 / maxDim : 1;

      cloned.position.sub(center.multiplyScalar(scale));
      cloned.scale.setScalar(scale);
      cloned.position.y -= box.min.y * scale;

      // Clear previous children
      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }
      groupRef.current.add(cloned);
    }
  }, [scene]);

  return <group ref={groupRef} />;
}

// Click handler for measurements using DOM events
function ClickHandler() {
  const isMeasuring = useMobiStore((s) => s.isMeasuring);
  const firstPoint = useMobiStore((s) => s.firstPoint);
  const setFirstPoint = useMobiStore((s) => s.setFirstPoint);
  const addMeasurement = useMobiStore((s) => s.addMeasurement);
  const setMeasuring = useMobiStore((s) => s.setMeasuring);
  const { camera, scene } = useThree();

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (!useMobiStore.getState().isMeasuring) return;

      const canvas = e.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const rc = new THREE.Raycaster();
      rc.setFromCamera(mouse, camera);
      const intersects = rc.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        const pointArr: [number, number, number] = [
          point.x,
          point.y,
          point.z,
        ];

        const currentFirstPoint = useMobiStore.getState().firstPoint;
        if (!currentFirstPoint) {
          useMobiStore.getState().setFirstPoint(pointArr);
        } else {
          const start = new THREE.Vector3(...currentFirstPoint);
          const end = new THREE.Vector3(...pointArr);
          const dist = start.distanceTo(end) * SCALE_CM;

          const measurement = {
            id: `m-${Date.now()}`,
            start: currentFirstPoint,
            end: pointArr,
            distance: dist,
            label: `${dist.toFixed(1)} cm`,
          };
          useMobiStore.getState().addMeasurement(measurement);
          useMobiStore.getState().setFirstPoint(null);
          useMobiStore.getState().setMeasuring(false);
        }
      }
    },
    [camera, scene]
  );

  useEffect(() => {
    const canvas = document.querySelector(
      "#main-viewer canvas"
    ) as HTMLCanvasElement | null;
    if (!canvas) return;

    canvas.addEventListener("pointerdown", handlePointerDown);
    return () => canvas.removeEventListener("pointerdown", handlePointerDown);
  }, [handlePointerDown]);

  return null;
}

// Main scene content
function SceneContent() {
  const fileUrl = useMobiStore((s) => s.fileUrl);
  const fileType = useMobiStore((s) => s.fileType);
  const isMeasuring = useMobiStore((s) => s.isMeasuring);
  const isLoadable = fileUrl && fileType && fileType !== "skp";

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 4, -3]} intensity={0.3} />

      {/* Grid floor */}
      <Grid
        args={[10, 10]}
        cellSize={0.1}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={0.5}
        sectionThickness={1}
        sectionColor="#9ca3af"
        fadeDistance={8}
        infiniteGrid
      />

      {/* Model */}
      <Center>
        {isLoadable ? (
          <LoadedModel url={fileUrl!} />
        ) : (
          <DemoTableModel />
        )}
      </Center>

      {/* Measurement lines */}
      <MeasurementLines />

      {/* Click handler for measurements */}
      <ClickHandler />

      {/* Controls */}
      <OrbitControls
        makeDefault
        enablePan={true}
        enableZoom={true}
        minPolarAngle={0}
        maxPolarAngle={Math.PI * 0.85}
        minDistance={1}
        maxDistance={10}
      />

      {/* Environment */}
      <Environment preset="city" />
    </>
  );
}

export default function ModelViewer() {
  const isMeasuring = useMobiStore((s) => s.isMeasuring);

  return (
    <div
      id="main-viewer"
      className={`w-full h-full relative rounded-xl overflow-hidden border border-border/30 bg-card/30 ${
        isMeasuring ? "ring-2 ring-red-500/50" : ""
      }`}
    >
      <Canvas
        shadows
        camera={{ position: [2.5, 2, 2.5], fov: 40 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#1a1a1a"), 1);
        }}
      >
        <color attach="background" args={["#1a1a1a"]} />
        <fog attach="fog" args={["#1a1a1a", 8, 20]} />
        <SceneContent />
      </Canvas>

      {/* Measuring overlay */}
      {isMeasuring && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-xs font-medium shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Haz clic en dos puntos para medir
          </div>
        </div>
      )}
    </div>
  );
}
