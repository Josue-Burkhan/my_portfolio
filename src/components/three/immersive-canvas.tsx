"use client";

import { AdaptiveDpr, PerformanceMonitor, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import { getExperienceScroll } from "@/lib/experience-scroll";

type ImmersiveCanvasProps = {
  modelVisible: boolean;
  onReady: () => void;
};

const MODEL_URL = "/models/claustre.glb";

const cameraPositions = [
  new THREE.Vector3(36.875, 18.713, 25.614),
  new THREE.Vector3(-11.486, -6.582, -3.475),
  new THREE.Vector3(1.293, -2.619, -11.041),
  new THREE.Vector3(1.325, 15.216, -10.905),
  new THREE.Vector3(5.196, 50.865, -5.466),
  new THREE.Vector3(4.935, 150.911, -8.82),
];

const cameraTargets = [
  new THREE.Vector3(0.939, -2.945, 4.061),
  new THREE.Vector3(8.222, -7.355, -3.551),
  new THREE.Vector3(1.36, -8.998, -10.924),
  new THREE.Vector3(1.325, -8.999, -10.905),
  new THREE.Vector3(5.165, -8.983, -3.728),
  new THREE.Vector3(5.004, 50.934, -6.698),
];

const cameraQuaternions = cameraPositions.map((position, index) => {
  const poseCamera = new THREE.PerspectiveCamera();
  poseCamera.position.copy(position);
  poseCamera.up.set(0, index === 3 ? 0 : 1, index === 3 ? 1 : 0);
  poseCamera.lookAt(cameraTargets[index]);
  return poseCamera.quaternion.clone();
});

const CAMERA_FOV = 40;
const ASH_COUNT = 14000;

function getCameraCurveProgress(progress: number, reducedMotion: boolean) {
  const lastIndex = cameraPositions.length - 1;
  if (reducedMotion) return Math.round(progress * lastIndex) / lastIndex;
  return THREE.MathUtils.clamp(progress, 0, 1);
}

function getFogDensity(progress: number) {
  const fogProgress = Math.pow(THREE.MathUtils.clamp(progress, 0, 1), 0.55);
  return THREE.MathUtils.lerp(0.005, 0.04, fogProgress);
}

function CameraRig() {
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }) => {
    const scroll = getExperienceScroll();
    if (!scroll.visible || scroll.paused) return;

    const progress = getCameraCurveProgress(
      scroll.progress,
      scroll.reducedMotion,
    );
    const scaledProgress = progress * (cameraPositions.length - 1);
    const fromIndex = Math.min(
      cameraPositions.length - 1,
      Math.floor(scaledProgress),
    );
    const toIndex = Math.min(cameraPositions.length - 1, fromIndex + 1);
    const segmentProgress = scaledProgress - fromIndex;

    desiredPosition.lerpVectors(
      cameraPositions[fromIndex],
      cameraPositions[toIndex],
      segmentProgress,
    );
    camera.position.copy(desiredPosition);
    camera.quaternion.slerpQuaternions(
      cameraQuaternions[fromIndex],
      cameraQuaternions[toIndex],
      segmentProgress,
    );
  });

  return null;
}

function ClaustreModel({ modelVisible, onReady }: ImmersiveCanvasProps) {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => scene.clone(true), [scene]);
  const whiteMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffffff",
        opacity: 0,
        side: THREE.DoubleSide,
        toneMapped: false,
        transparent: true,
      }),
    [],
  );
  const materialRef = useRef(whiteMaterial);

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

  useFrame((_, delta) => {
    materialRef.current.opacity = THREE.MathUtils.damp(
      materialRef.current.opacity,
      modelVisible ? 1 : 0,
      4.8,
      delta,
    );
  });

  return (
    <group position={[3.5, 0, 0]}>
      <primitive object={model} />
    </group>
  );
}

function ScrollFog() {
  const fog = useRef<THREE.FogExp2>(null);
  if (fog.current == null) {
    fog.current = new THREE.FogExp2("#000000", 0.005);
  }

  useFrame(({ scene }) => {
    const scroll = getExperienceScroll();
    if (!fog.current) return;
    fog.current.density = getFogDensity(scroll.progress);
    if (scene.fog !== fog.current) scene.fog = fog.current;
  });

  return null;
}

function AshStorm() {
  const { drifts, geometry, material, speeds } = useMemo(() => {
    let seed = 0x1a5f2026;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const positions = new Float32Array(ASH_COUNT * 3);
    const colors = new Float32Array(ASH_COUNT * 3);
    const sizes = new Float32Array(ASH_COUNT);
    const alphas = new Float32Array(ASH_COUNT);
    const nextSpeeds = new Float32Array(ASH_COUNT);
    const nextDrifts = new Float32Array(ASH_COUNT);
    const color = new THREE.Color();

    for (let index = 0; index < ASH_COUNT; index += 1) {
      const offset = index * 3;
      positions[offset] = -42 + random() * 90;
      positions[offset + 1] = -28 + random() * 220;
      positions[offset + 2] = -42 + random() * 84;

      color.setHSL(
        0.045 + random() * 0.025,
        0.22 + random() * 0.72,
        0.38 + random() * 0.2,
      );
      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;
      sizes[index] = 0.9 + random() * 2.2;
      alphas[index] = 0.25 + random() * 0.58;
      nextSpeeds[index] = 1.4 + random() * 4.2;
      nextDrifts[index] = -0.45 + random() * 0.9;
    }

    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    nextGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    nextGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    nextGeometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));

    const nextMaterial = new THREE.ShaderMaterial({
      blending: THREE.NormalBlending,
      depthWrite: false,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vDepth;
        uniform float uFogDensity;

        void main() {
          float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
          float particle = 1.0 - smoothstep(0.08, 0.5, distanceFromCenter);
          float fogFactor = exp(-uFogDensity * uFogDensity * vDepth * vDepth);
          float alpha = particle * vAlpha * fogFactor;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      uniforms: {
        uFogDensity: { value: 0.005 },
      },
      vertexColors: true,
      vertexShader: `
        attribute float aSize;
        attribute float aAlpha;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vDepth;

        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          vColor = color;
          vAlpha = aAlpha;
          vDepth = max(0.0, -viewPosition.z);
          gl_Position = projectionMatrix * viewPosition;
          gl_PointSize = aSize * (180.0 / max(1.0, vDepth));
        }
      `,
    });

    return {
      drifts: nextDrifts,
      geometry: nextGeometry,
      material: nextMaterial,
      speeds: nextSpeeds,
    };
  }, []);
  const materialRef = useRef(material);

  useFrame((_, delta) => {
    const scroll = getExperienceScroll();
    if (!scroll.visible || scroll.paused) return;
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;

    for (let index = 0; index < ASH_COUNT; index += 1) {
      const offset = index * 3;
      position.array[offset] += drifts[index] * delta;
      position.array[offset + 1] -= speeds[index] * delta;
      if (position.array[offset + 1] < -28) {
        position.array[offset + 1] = 192;
      }
      if (position.array[offset] < -42) position.array[offset] = 48;
      if (position.array[offset] > 48) position.array[offset] = -42;
    }

    position.needsUpdate = true;
    materialRef.current.uniforms.uFogDensity.value = getFogDensity(
      scroll.progress,
    );
  });

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <points frustumCulled={false} geometry={geometry} material={material} />;
}

function World(props: ImmersiveCanvasProps) {
  return (
    <>
      <color attach="background" args={["#000000"]} />
      <Suspense fallback={null}>
        <ClaustreModel {...props} />
      </Suspense>
      <AshStorm />
      <ScrollFog />
      <CameraRig />
    </>
  );
}

export function ImmersiveCanvas(props: ImmersiveCanvasProps) {
  const [dpr, setDpr] = useState(1.25);

  return (
    <Canvas
      camera={{
        far: 300,
        fov: CAMERA_FOV,
        near: 0.1,
        position: cameraPositions[0].toArray(),
      }}
      className="scene-canvas"
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
      <World {...props} />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
