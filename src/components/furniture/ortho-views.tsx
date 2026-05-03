"use client";

import { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Grid, Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useMobiStore } from "@/store/mobi-store";
import DemoTableModel from "./demo-model";
import { MeasurementLine } from "./measurement-lines";

// Loaded model for ortho views
function OrthoLoadedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (groupRef.current && scene) {
      const cloned = scene.clone(true);
      const box = new THREE.Box3().setFromObject(cloned);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 1.5 / maxDim : 1;

      cloned.position.sub(center.multiplyScalar(scale));
      cloned.scale.setScalar(scale);
      cloned.position.y -= box.min.y * scale;

      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }
      groupRef.current.add(cloned);
    }
  }, [scene]);

  return <group ref={groupRef} />;
}

// Camera setup helper
function CameraSetup({
  cameraUp,
}: {
  cameraUp: [number, number, number];
}) {
  const { camera } = useThree();

  useEffect(() => {
    camera.up.set(...cameraUp);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, cameraUp]);

  return null;
}

// Orthographic view
function OrthoView({
  label,
  cameraPosition,
  cameraUp,
  modelUrl,
  isLoadable,
  measurements,
}: {
  label: string;
  cameraPosition: [number, number, number];
  cameraUp: [number, number, number];
  modelUrl: string | null;
  isLoadable: boolean;
  measurements: ReturnType<typeof useMobiStore.getState>["measurements"];
}) {
  const frustumSize = 2.5;
  const aspect = 1;

  return (
    <div className="flex flex-col items-center">
      <div className="w-full aspect-square bg-white rounded-lg overflow-hidden border border-border/20 relative">
        <Canvas
          orthographic
          camera={{
            position: cameraPosition,
            zoom: 80,
            near: 0.1,
            far: 100,
            left: (-frustumSize * aspect) / 2,
            right: (frustumSize * aspect) / 2,
            top: frustumSize / 2,
            bottom: (-frustumSize) / 2,
          }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.setClearColor(new THREE.Color("#ffffff"), 1);
          }}
        >
          <color attach="background" args={["#ffffff"]} />
          <CameraSetup cameraUp={cameraUp} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 8, 5]} intensity={0.5} />

          <Grid
            args={[10, 10]}
            cellSize={0.1}
            cellThickness={0.3}
            cellColor="#d1d5db"
            sectionSize={0.5}
            sectionThickness={0.5}
            sectionColor="#9ca3af"
            fadeDistance={6}
            infiniteGrid
          />

          <Center>
            {isLoadable && modelUrl ? (
              <OrthoLoadedModel url={modelUrl} />
            ) : (
              <DemoTableModel />
            )}
          </Center>

          {/* Measurement lines in this view */}
          {measurements.map((m) => (
            <MeasurementLine key={m.id} measurement={m} />
          ))}
        </Canvas>

        {/* View label overlay */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono tracking-wider">
          {label}
        </div>
      </div>
      <span className="mt-1.5 text-[11px] font-mono font-semibold text-muted-foreground tracking-widest">
        {label}
      </span>
    </div>
  );
}

export default function OrthoViews() {
  const { fileUrl, fileType, measurements } = useMobiStore();
  const isLoadable = !!(fileUrl && fileType && fileType !== "skp");

  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      <OrthoView
        label="PLANTA"
        cameraPosition={[0, 5, 0.001]}
        cameraUp={[0, 0, -1]}
        modelUrl={isLoadable ? fileUrl : null}
        isLoadable={isLoadable}
        measurements={measurements}
      />
      <OrthoView
        label="FRONTAL"
        cameraPosition={[0, 0.5, 5]}
        cameraUp={[0, 1, 0]}
        modelUrl={isLoadable ? fileUrl : null}
        isLoadable={isLoadable}
        measurements={measurements}
      />
      <OrthoView
        label="LATERAL"
        cameraPosition={[5, 0.5, 0]}
        cameraUp={[0, 1, 0]}
        modelUrl={isLoadable ? fileUrl : null}
        isLoadable={isLoadable}
        measurements={measurements}
      />
    </div>
  );
}
