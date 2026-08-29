"use client";

import {
  AdaptiveDpr,
  OrbitControls,
  PerformanceMonitor,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import {
  Check,
  Clipboard,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

const MODEL_URL = "/models/claustre.glb";
const INITIAL_POSITION = new THREE.Vector3(36.875, 18.713, 25.614);
const INITIAL_TARGET = new THREE.Vector3(0.939, -2.945, 4.061);
const CAMERA_FOV = 40;

type CameraPose = {
  fov: number;
  position: [number, number, number];
  target: [number, number, number];
};

type SetterSceneProps = {
  onPoseChange: (pose: CameraPose) => void;
  onReady: () => void;
  resetVersion: number;
};

const roundVector = (vector: THREE.Vector3): [number, number, number] =>
  vector.toArray().map((value) => Number(value.toFixed(3))) as [
    number,
    number,
    number,
  ];

function ClaustreSetModel({ onReady }: Pick<SetterSceneProps, "onReady">) {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => scene.clone(true), [scene]);
  const whiteMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffffff",
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [],
  );

  useLayoutEffect(() => {
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());

    model.position.sub(center);
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.material = whiteMaterial;
      child.castShadow = false;
      child.receiveShadow = false;
    });

    onReady();
  }, [model, onReady, whiteMaterial]);

  useEffect(() => () => whiteMaterial.dispose(), [whiteMaterial]);

  return (
    <group position={[3.5, 0, 0]}>
      <primitive object={model} />
    </group>
  );
}

function SetControls({ onPoseChange, resetVersion }: SetterSceneProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const lastPose = useRef("");

  const publishPose = useCallback(() => {
    if (!controls.current) return;
    const pose: CameraPose = {
      fov: Number(camera.fov.toFixed(2)),
      position: roundVector(camera.position),
      target: roundVector(controls.current.target),
    };
    const serialized = JSON.stringify(pose);
    if (serialized === lastPose.current) return;
    lastPose.current = serialized;
    onPoseChange(pose);
  }, [camera, onPoseChange]);

  useEffect(() => {
    if (!controls.current) return;
    camera.position.copy(INITIAL_POSITION);
    controls.current.target.copy(INITIAL_TARGET);
    controls.current.update();
    publishPose();
  }, [camera, publishPose, resetVersion]);

  return (
    <OrbitControls
      dampingFactor={0.08}
      enableDamping
      makeDefault
      minDistance={0.01}
      onChange={publishPose}
      ref={controls}
      target={INITIAL_TARGET.toArray()}
    />
  );
}

function SetterScene(props: SetterSceneProps) {
  return (
    <>
      <color attach="background" args={["#000000"]} />
      <Suspense fallback={null}>
        <ClaustreSetModel onReady={props.onReady} />
      </Suspense>
      <SetControls {...props} />
    </>
  );
}

function CameraValue({
  label,
  value,
}: {
  label: string;
  value: number | [number, number, number];
}) {
  return (
    <div className="set-value">
      <dt>{label}</dt>
      <dd>{Array.isArray(value) ? value.join(", ") : value}</dd>
    </div>
  );
}

export function ModelSetter() {
  const [ready, setReady] = useState(false);
  const [dpr, setDpr] = useState(1.25);
  const [hudVisible, setHudVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const [pose, setPose] = useState<CameraPose>({
    fov: CAMERA_FOV,
    position: roundVector(INITIAL_POSITION),
    target: roundVector(INITIAL_TARGET),
  });
  const { progress } = useProgress();
  const handleReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "h") {
        setHudVisible((visible) => !visible);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const copyPose = async () => {
    const cameraConfig = {
      position: pose.position,
      target: pose.target,
      fov: pose.fov,
    };
    await navigator.clipboard.writeText(JSON.stringify(cameraConfig, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <main className="set-page">
      <Canvas
        camera={{
          far: 100000,
          fov: pose.fov,
          near: 0.01,
          position: pose.position,
        }}
        className="set-canvas"
        dpr={dpr}
        gl={{
          alpha: false,
          antialias: dpr <= 1.25,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.NoToneMapping;
        }}
      >
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => setDpr(0.85)}
          onIncline={() => setDpr(1.25)}
        />
        <AdaptiveDpr pixelated />
        <SetterScene
          onPoseChange={setPose}
          onReady={handleReady}
          resetVersion={resetVersion}
        />
      </Canvas>

      {!ready ? (
        <div aria-live="polite" className="set-loading" role="status">
          <span>Loading claustre</span>
          <strong>{Math.round(progress)}%</strong>
          <i style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
      ) : null}

      {hudVisible ? (
        <div className="set-hud">
          <div className="set-heading">
            <p>Set / Camera</p>
            <span>Drag · orbit / Shift + drag · pan / Scroll · zoom</span>
          </div>

          <aside aria-label="Current camera values" className="set-camera-panel">
            <div className="set-panel-head">
              <p>Current camera</p>
              <button
                aria-label="Reset camera"
                onClick={() => setResetVersion((version) => version + 1)}
                title="Reset camera"
                type="button"
              >
                <RotateCcw aria-hidden="true" size={16} />
              </button>
            </div>
            <dl>
              <CameraValue label="Position" value={pose.position} />
              <CameraValue label="Target" value={pose.target} />
              <CameraValue label="FOV" value={pose.fov} />
            </dl>
            <button className="set-copy" onClick={copyPose} type="button">
              {copied ? (
                <Check aria-hidden="true" size={16} />
              ) : (
                <Clipboard aria-hidden="true" size={16} />
              )}
              {copied ? "Copied" : "Copy camera"}
            </button>
          </aside>

          <button
            aria-label="Hide camera interface"
            className="set-hud-toggle"
            onClick={() => setHudVisible(false)}
            title="Hide interface (H)"
            type="button"
          >
            <EyeOff aria-hidden="true" size={17} />
            <span>Hide HUD</span>
          </button>
        </div>
      ) : (
        <button
          aria-label="Show camera interface"
          className="set-hud-toggle set-hud-toggle-hidden"
          onClick={() => setHudVisible(true)}
          title="Show interface (H)"
          type="button"
        >
          <Eye aria-hidden="true" size={17} />
        </button>
      )}
    </main>
  );
}

useGLTF.preload(MODEL_URL);
