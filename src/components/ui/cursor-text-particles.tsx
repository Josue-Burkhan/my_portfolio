"use client";

import { useEffect, useRef } from "react";

type Particle = {
  color: string;
  homeX: number;
  homeY: number;
  size: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

const INTERACTION_RADIUS = 124;

function getFont(style: CSSStyleDeclaration) {
  return `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
}

function createOutline(element: HTMLElement) {
  const bounds = element.getBoundingClientRect();
  const outline = element.cloneNode(true) as HTMLElement;
  const originals = [element, ...element.querySelectorAll<HTMLElement>("*")];
  const clones = [outline, ...outline.querySelectorAll<HTMLElement>("*")];

  outline.removeAttribute("data-particle-active");
  outline.removeAttribute("data-particle-text");
  outline.removeAttribute("data-reveal");
  outline.setAttribute("aria-hidden", "true");
  outline.classList.add("particle-text-outline");

  clones.forEach((clone, index) => {
    const color = window.getComputedStyle(originals[index] ?? element).color;
    clone.style.setProperty("color", "transparent", "important");
    clone.style.setProperty("-webkit-text-stroke", `0.8px ${color}`);
  });

  Object.assign(outline.style, {
    height: `${bounds.height}px`,
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: `${bounds.width}px`,
  });
  document.body.append(outline);
  return outline;
}

function createTextField(element: HTMLElement) {
  const bounds = element.getBoundingClientRect();
  const raster = document.createElement("canvas");
  raster.width = Math.max(1, Math.ceil(bounds.width));
  raster.height = Math.max(1, Math.ceil(bounds.height));
  const rasterContext = raster.getContext("2d", { willReadFrequently: true });
  if (!rasterContext) return [];

  rasterContext.textBaseline = "alphabetic";
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const textNode = node;
    const text = textNode.textContent ?? "";
    const parent = textNode.parentElement;
    if (parent) {
      const style = window.getComputedStyle(parent);
      rasterContext.font = getFont(style);
      rasterContext.fillStyle = style.color;

      for (let index = 0; index < text.length; index += 1) {
        const character = text[index];
        if (/\s/.test(character)) continue;
        const range = document.createRange();
        range.setStart(textNode, index);
        range.setEnd(textNode, index + 1);
        const characterBounds = range.getBoundingClientRect();
        if (!characterBounds.width || !characterBounds.height) continue;

        const metrics = rasterContext.measureText(character);
        const sourceWidth = Math.max(
          0.1,
          metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
        );
        const sourceHeight = Math.max(
          0.1,
          metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
        );
        rasterContext.save();
        rasterContext.translate(
          characterBounds.left - bounds.left,
          characterBounds.top - bounds.top,
        );
        rasterContext.scale(
          characterBounds.width / sourceWidth,
          characterBounds.height / sourceHeight,
        );
        rasterContext.fillText(
          character,
          metrics.actualBoundingBoxLeft,
          metrics.actualBoundingBoxAscent,
        );
        rasterContext.restore();
      }
    }
    node = walker.nextNode();
  }

  const pixels = rasterContext.getImageData(0, 0, raster.width, raster.height);
  const step = bounds.width * bounds.height > 260_000 ? 6 : 5;
  const particles: Particle[] = [];

  for (let y = 0; y < raster.height; y += step) {
    for (let x = 0; x < raster.width; x += step) {
      const pixelIndex = (y * raster.width + x) * 4;
      if (pixels.data[pixelIndex + 3] < 90) continue;
      const homeX = bounds.left + x;
      const homeY = bounds.top + y;
      particles.push({
        color: `rgb(${pixels.data[pixelIndex]} ${pixels.data[pixelIndex + 1]} ${pixels.data[pixelIndex + 2]})`,
        homeX,
        homeY,
        size: 1 + Math.random() * 1.8,
        vx: 0,
        vy: 0,
        x: homeX,
        y: homeY,
      });
    }
  }

  return particles;
}

export function CursorTextParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!canvas || !context || coarsePointer.matches || reducedMotion.matches) return;

    let activeText: HTMLElement | null = null;
    let outline: HTMLElement | null = null;
    let particles: Particle[] = [];
    let frame = 0;
    let pointerX = -1000;
    let pointerY = -1000;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const clearField = () => {
      activeText?.removeAttribute("data-particle-active");
      outline?.remove();
      activeText = null;
      outline = null;
      particles = [];
    };

    const setPointerPosition = (element: HTMLElement) => {
      const bounds = element.getBoundingClientRect();
      element.style.setProperty("--particle-x", `${pointerX - bounds.left}px`);
      element.style.setProperty("--particle-y", `${pointerY - bounds.top}px`);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const nextText =
        (event.target as Element | null)?.closest<HTMLElement>(
          "[data-particle-text]",
        ) ?? null;
      pointerX = event.clientX;
      pointerY = event.clientY;

      if (nextText === activeText) return;
      clearField();
      activeText = nextText;
      if (!activeText) return;
      activeText.setAttribute("data-particle-active", "true");
      setPointerPosition(activeText);
      outline = createOutline(activeText);
      setPointerPosition(outline);
      particles = createTextField(activeText);
    };

    const animate = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (activeText) {
        setPointerPosition(activeText);
        if (outline) setPointerPosition(outline);
        const visibleParticles: Particle[] = [];

        particles.forEach((particle) => {
          const dx = particle.x - pointerX;
          const dy = particle.y - pointerY;
          const distance = Math.max(0.1, Math.hypot(dx, dy));
          if (distance < INTERACTION_RADIUS) {
            const force = Math.pow(1 - distance / INTERACTION_RADIUS, 2) * 4.8;
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
          }

          particle.vx += (particle.homeX - particle.x) * 0.025;
          particle.vy += (particle.homeY - particle.y) * 0.025;
          particle.vx *= 0.9;
          particle.vy *= 0.9;
          particle.x += particle.vx;
          particle.y += particle.vy;

          const homeDistance = Math.hypot(
            particle.homeX - pointerX,
            particle.homeY - pointerY,
          );
          const displacement = Math.hypot(
            particle.x - particle.homeX,
            particle.y - particle.homeY,
          );
          if (homeDistance < INTERACTION_RADIUS + 18 || displacement > 1.2) {
            visibleParticles.push(particle);
          }
        });

        context.save();
        context.strokeStyle = "rgb(255 255 255 / 32%)";
        context.lineWidth = 0.55;
        for (let index = 0; index < visibleParticles.length; index += 1) {
          const particle = visibleParticles[index];
          for (
            let neighbor = index + 1;
            neighbor < Math.min(index + 6, visibleParticles.length);
            neighbor += 1
          ) {
            const next = visibleParticles[neighbor];
            const distance = Math.hypot(particle.x - next.x, particle.y - next.y);
            if (distance > 55) continue;
            context.globalAlpha = (1 - distance / 55) * 0.4;
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(next.x, next.y);
            context.stroke();
          }
        }
        context.restore();

        visibleParticles.forEach((particle) => {
          context.beginPath();
          context.fillStyle = particle.color;
          context.globalAlpha = 0.94;
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          context.fill();
        });
        context.globalAlpha = 1;
      }

      frame = window.requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", clearField, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", clearField);
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", clearField);
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("pointerleave", clearField);
      clearField();
    };
  }, []);

  return <canvas aria-hidden="true" className="text-particle-layer" ref={canvasRef} />;
}
