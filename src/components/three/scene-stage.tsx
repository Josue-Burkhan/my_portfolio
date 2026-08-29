"use client";

import dynamic from "next/dynamic";
import { useProgress } from "@react-three/drei";
import {
  Component,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

const ImmersiveCanvas = dynamic(
  () =>
    import("@/components/three/immersive-canvas").then(
      (module) => module.ImmersiveCanvas,
    ),
  { ssr: false },
);

type SceneErrorBoundaryProps = {
  children: ReactNode;
  onError: () => void;
};

class SceneErrorBoundary extends Component<SceneErrorBoundaryProps> {
  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.props.children;
  }
}

export function SceneStage() {
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(true);
  const { progress } = useProgress();
  const handleReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const canvas = document.createElement("canvas");
        setSupported(
          Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")),
        );
      } catch {
        setSupported(false);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <div className="scene-stage" aria-hidden="true">
        {supported ? (
          <SceneErrorBoundary onError={() => setSupported(false)}>
            <ImmersiveCanvas onReady={handleReady} />
          </SceneErrorBoundary>
        ) : null}

        <div className="scene-grain" />
        <div className="scene-caption">
          <span>{ready ? "Claustre study" : "Loading space"}</span>
          <span>Scene / 01</span>
        </div>
      </div>

      {supported && !ready ? (
        <div
          aria-label="Loading the 3D portfolio experience"
          aria-live="polite"
          className="scene-loader"
          role="status"
        >
          <div className="scene-loader-wordmark">
            <span>J</span>
            <i />
            <span>B</span>
          </div>
          <div className="scene-loader-status">
            <span>Loading claustre</span>
            <strong>{Math.round(progress)}%</strong>
          </div>
          <div className="scene-loader-track" aria-hidden="true">
            <i style={{ transform: `scaleX(${progress / 100})` }} />
          </div>
        </div>
      ) : null}
    </>
  );
}
