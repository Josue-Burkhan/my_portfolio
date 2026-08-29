"use client";

import { useEffect, useRef } from "react";

type Ember = {
  alpha: number;
  color: string;
  drift: number;
  size: number;
  speed: number;
  x: number;
  y: number;
};

const EMBER_COUNT = 180;

export function AmbientEmbers() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let frame = 0;
    let lastTime = performance.now();
    let embers: Ember[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      let seed = 0x28a62026;
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      embers = Array.from({ length: EMBER_COUNT }, () => ({
        alpha: 0.12 + random() * 0.5,
        color: random() > 0.14 ? "#ff6500" : "#d8d8d2",
        drift: -0.08 + random() * 0.16,
        size: 0.35 + Math.pow(random(), 3) * 3.8,
        speed: 0.045 + random() * 0.16,
        x: random() * window.innerWidth,
        y: random() * window.innerHeight,
      }));
    };

    const animate = (time: number) => {
      const delta = Math.min(2.5, (time - lastTime) / 16.67);
      lastTime = time;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      embers.forEach((ember) => {
        ember.y += ember.speed * delta;
        ember.x += ember.drift * delta;
        if (ember.y > window.innerHeight + 12) ember.y = -12;
        if (ember.x < -12) ember.x = window.innerWidth + 12;
        if (ember.x > window.innerWidth + 12) ember.x = -12;

        context.beginPath();
        context.fillStyle = ember.color;
        context.globalAlpha = ember.alpha;
        context.shadowBlur = ember.size > 1.5 ? ember.size * 3.2 : 0;
        context.shadowColor = ember.color;
        context.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;
      context.shadowBlur = 0;
      frame = window.requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    frame = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas aria-hidden="true" className="prehome-embers" ref={canvasRef} />;
}
