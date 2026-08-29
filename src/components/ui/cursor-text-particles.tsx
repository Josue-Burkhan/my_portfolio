"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };

type GlyphParticle = {
  alpha: number;
  baseX: number;
  baseY: number;
  color: string;
  damping: number;
  glyphId: number;
  influence: number;
  maxDisplacement: number;
  mobility: number;
  noisePhase: number;
  size: number;
  stiffness: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

type GlyphConnection = {
  a: number;
  b: number;
  color: string;
  width: number;
};

type GlyphField = {
  connectionCount: number;
  id: number;
  particleCount: number;
};

type TitleField = {
  bounds: DOMRect;
  connections: GlyphConnection[];
  element: HTMLElement;
  glyphs: GlyphField[];
  innerRadius: number;
  layoutOpacity: number;
  outerRadius: number;
  outline: HTMLElement;
  particles: GlyphParticle[];
  settled: boolean;
  visualInfluence: number;
};

const SAMPLE_SCALE = 2;
const OUTLINE_STYLE_PROPERTIES = [
  "font-family",
  "font-feature-settings",
  "font-kerning",
  "font-size",
  "font-stretch",
  "font-style",
  "font-variant",
  "font-weight",
  "letter-spacing",
  "line-height",
  "overflow-wrap",
  "text-align",
  "text-indent",
  "text-transform",
  "text-wrap",
  "white-space",
  "word-spacing",
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothInfluence(distance: number, outerRadius: number, innerRadius: number) {
  const progress = clamp(
    (outerRadius - distance) / Math.max(1, outerRadius - innerRadius),
    0,
    1,
  );
  return progress * progress * (3 - 2 * progress);
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seedValue: number) {
  let seed = seedValue || 1;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function getFont(style: CSSStyleDeclaration) {
  return `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
}

function selectDistributed(candidates: Point[], count: number, seed: number) {
  if (candidates.length <= count) return [...candidates];
  const selected: Point[] = [candidates[seed % candidates.length]];

  while (selected.length < count) {
    let bestCandidate: Point | null = null;
    let bestDistance = -1;

    for (const candidate of candidates) {
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const current of selected) {
        const dx = candidate.x - current.x;
        const dy = candidate.y - current.y;
        nearestDistance = Math.min(nearestDistance, dx * dx + dy * dy);
      }
      if (nearestDistance > bestDistance) {
        bestDistance = nearestDistance;
        bestCandidate = candidate;
      }
    }

    if (!bestCandidate || bestDistance <= 0) break;
    selected.push(bestCandidate);
  }

  return selected;
}

function rasterizeGlyph(
  character: string,
  bounds: DOMRect,
  style: CSSStyleDeclaration,
) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.ceil(bounds.width * SAMPLE_SCALE));
  canvas.height = Math.max(2, Math.ceil(bounds.height * SAMPLE_SCALE));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return { contour: [] as Point[], interior: [] as Point[] };

  context.setTransform(SAMPLE_SCALE, 0, 0, SAMPLE_SCALE, 0, 0);
  context.font = getFont(style);
  context.fillStyle = "#ffffff";
  context.textBaseline = "alphabetic";
  const metrics = context.measureText(character);
  const sourceWidth = Math.max(
    0.1,
    metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
  );
  const sourceHeight = Math.max(
    0.1,
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
  );

  context.save();
  context.scale(bounds.width / sourceWidth, bounds.height / sourceHeight);
  context.fillText(
    character,
    metrics.actualBoundingBoxLeft,
    metrics.actualBoundingBoxAscent,
  );
  context.restore();

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const contour: Point[] = [];
  const interior: Point[] = [];
  const isFilled = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < canvas.width &&
    y < canvas.height &&
    pixels[(y * canvas.width + x) * 4 + 3] > 80;

  for (let y = 1; y < canvas.height - 1; y += 2) {
    for (let x = 1; x < canvas.width - 1; x += 2) {
      if (!isFilled(x, y)) continue;
      const boundary =
        !isFilled(x - 1, y) ||
        !isFilled(x + 1, y) ||
        !isFilled(x, y - 1) ||
        !isFilled(x, y + 1);
      const point = { x: x / SAMPLE_SCALE, y: y / SAMPLE_SCALE };
      if (boundary) contour.push(point);
      else if ((x + y) % 10 === 0) interior.push(point);
    }
  }

  return { contour, interior };
}

function createOutline(element: HTMLElement, bounds: DOMRect) {
  const outline = element.cloneNode(true) as HTMLElement;
  const originals = [element, ...element.querySelectorAll<HTMLElement>("*")];
  const clones = [outline, ...outline.querySelectorAll<HTMLElement>("*")];

  outline.removeAttribute("data-particle-text");
  outline.removeAttribute("data-particle-active");
  outline.removeAttribute("data-particle-ready");
  outline.removeAttribute("data-reveal");
  outline.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  outline.setAttribute("aria-hidden", "true");
  outline.classList.add("particle-text-outline");

  clones.forEach((clone, index) => {
    const computed = window.getComputedStyle(originals[index] ?? element);
    const color = computed.color;
    OUTLINE_STYLE_PROPERTIES.forEach((property) => {
      clone.style.setProperty(
        property,
        computed.getPropertyValue(property),
        "important",
      );
    });
    clone.style.setProperty("color", "transparent", "important");
    clone.style.setProperty("-webkit-text-stroke", `0.7px ${color}`, "important");
  });

  Object.assign(outline.style, {
    height: `${bounds.height}px`,
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: `${bounds.width}px`,
  });
  outline.style.setProperty("--particle-outline-opacity", "0");
  document.body.append(outline);
  return outline;
}

function buildConnections(
  particles: GlyphParticle[],
  startIndex: number,
  count: number,
  random: () => number,
) {
  const connections: GlyphConnection[] = [];
  if (count < 6) return connections;
  const budget = Math.max(1, Math.floor(count * 0.2));
  const degrees = new Uint8Array(count);
  const pairs: Array<{ a: number; b: number; score: number }> = [];

  for (let first = 0; first < count; first += 1) {
    for (let second = first + 1; second < count; second += 1) {
      const a = particles[startIndex + first];
      const b = particles[startIndex + second];
      const distance = Math.hypot(a.baseX - b.baseX, a.baseY - b.baseY);
      if (distance < 7 || distance > 62) continue;
      pairs.push({
        a: first,
        b: second,
        score: Math.abs(distance - 28) + random() * 8,
      });
    }
  }

  pairs.sort((a, b) => a.score - b.score);
  for (const pair of pairs) {
    if (connections.length >= budget) break;
    if (degrees[pair.a] >= 2 || degrees[pair.b] >= 2) continue;
    const a = startIndex + pair.a;
    const b = startIndex + pair.b;
    degrees[pair.a] += 1;
    degrees[pair.b] += 1;
    connections.push({
      a,
      b,
      color: particles[a].color,
      width: 0.45 + random() * 0.2,
    });
  }

  return connections;
}

function buildTitleField(element: HTMLElement, titleIndex: number): TitleField {
  const bounds = element.getBoundingClientRect();
  const computed = window.getComputedStyle(element);
  const fontSize = Number.parseFloat(computed.fontSize) || 48;
  const outerRadius = clamp(fontSize * 1.6, 110, 180);
  const innerRadius = outerRadius * 0.32;
  const particles: GlyphParticle[] = [];
  const connections: GlyphConnection[] = [];
  const glyphs: GlyphField[] = [];
  const titleSeed = hashText(`${element.innerText}-${titleIndex}`);
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  let glyphId = 0;

  while (node) {
    const textNode = node;
    const text = textNode.textContent ?? "";
    const parent = textNode.parentElement;
    if (parent) {
      const style = window.getComputedStyle(parent);
      for (let index = 0; index < text.length; index += 1) {
        const character = text[index];
        if (/\s/.test(character)) continue;
        const range = document.createRange();
        range.setStart(textNode, index);
        range.setEnd(textNode, index + 1);
        const characterBounds = range.getBoundingClientRect();
        if (!characterBounds.width || !characterBounds.height) continue;

        const glyphSeed = (titleSeed + Math.imul(glyphId + 1, 2654435761)) >>> 0;
        const random = createRandom(glyphSeed);
        const { contour, interior } = rasterizeGlyph(character, characterBounds, style);
        const targetCount = clamp(
          Math.round((characterBounds.width + characterBounds.height) / 11),
          6,
          18,
        );
        const interiorCount = clamp(Math.round(targetCount * 0.2), 1, 4);
        const contourPoints = selectDistributed(
          contour,
          Math.max(4, targetCount - interiorCount),
          glyphSeed,
        );
        const interiorPoints = selectDistributed(
          interior,
          Math.min(interiorCount, interior.length),
          glyphSeed >>> 8,
        );
        const selected = [...contourPoints, ...interiorPoints];
        const startIndex = particles.length;

        selected.forEach((point) => {
          const behavior = random();
          let mobility: number;
          let stiffness: number;
          let damping: number;
          if (behavior < 0.3) {
            mobility = 0.12 + random() * 0.16;
            stiffness = 0.06 + random() * 0.015;
            damping = 0.82 + random() * 0.03;
          } else if (behavior < 0.8) {
            mobility = 0.35 + random() * 0.27;
            stiffness = 0.04 + random() * 0.015;
            damping = 0.86 + random() * 0.03;
          } else {
            mobility = 0.72 + random() * 0.28;
            stiffness = 0.022 + random() * 0.013;
            damping = 0.9 + random() * 0.025;
          }
          const baseX = characterBounds.left + point.x;
          const baseY = characterBounds.top + point.y;
          particles.push({
            alpha: 0.45 + random() * 0.4,
            baseX,
            baseY,
            color: style.color,
            damping,
            glyphId,
            influence: 0,
            maxDisplacement: 20 + mobility * 12,
            mobility,
            noisePhase: random() * Math.PI * 2,
            size: 0.62 + random() * 0.73,
            stiffness,
            vx: 0,
            vy: 0,
            x: baseX,
            y: baseY,
          });
        });

        const glyphConnections = buildConnections(
          particles,
          startIndex,
          selected.length,
          random,
        );
        connections.push(...glyphConnections);
        glyphs.push({
          connectionCount: glyphConnections.length,
          id: glyphId,
          particleCount: selected.length,
        });
        glyphId += 1;
      }
    }
    node = walker.nextNode();
  }

  const outline = createOutline(element, bounds);
  [element, outline].forEach((target) => {
    target.style.setProperty("--particle-inner-radius", `${innerRadius}px`);
    target.style.setProperty("--particle-outer-radius", `${outerRadius}px`);
  });

  return {
    bounds,
    connections,
    element,
    glyphs,
    innerRadius,
    layoutOpacity: clamp(Number.parseFloat(computed.opacity) || 0, 0, 1),
    outerRadius,
    outline,
    particles,
    settled: true,
    visualInfluence: 0,
  };
}

function distanceToBounds(x: number, y: number, bounds: DOMRect) {
  const dx = Math.max(bounds.left - x, 0, x - bounds.right);
  const dy = Math.max(bounds.top - y, 0, y - bounds.bottom);
  return Math.hypot(dx, dy);
}

type CursorTextParticlesProps = {
  enabled?: boolean;
};

export function CursorTextParticles({ enabled = true }: CursorTextParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (
      !canvas ||
      !context ||
      !enabled ||
      coarsePointer.matches ||
      reducedMotion.matches
    ) {
      return;
    }

    let fields: TitleField[] = [];
    let animationFrame = 0;
    let rebuildFrame = 0;
    let secondaryRebuildFrame = 0;
    let rebuildTimer = 0;
    let pointerX = -10_000;
    let pointerY = -10_000;
    let hasPointer = false;
    let disposed = false;
    const resizeObserver = new ResizeObserver(() => scheduleRebuild());

    const clearFieldStyles = (field: TitleField) => {
      field.element.removeAttribute("data-particle-active");
      field.element.style.removeProperty("--particle-x");
      field.element.style.removeProperty("--particle-y");
      field.element.style.removeProperty("--particle-fill-alpha");
      field.element.style.removeProperty("--particle-inner-radius");
      field.element.style.removeProperty("--particle-outer-radius");
      field.outline.remove();
    };

    const clearFields = () => {
      fields.forEach(clearFieldStyles);
      fields = [];
    };

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const rebuildFields = () => {
      if (disposed) return;
      clearFields();
      const elements = [
        ...document.querySelectorAll<HTMLElement>("[data-particle-text]"),
      ];
      fields = elements.map(buildTitleField);
    };

    function scheduleRebuild(delay = 140) {
      window.clearTimeout(rebuildTimer);
      window.cancelAnimationFrame(rebuildFrame);
      window.cancelAnimationFrame(secondaryRebuildFrame);
      rebuildTimer = window.setTimeout(() => {
        rebuildFrame = window.requestAnimationFrame(() => {
          secondaryRebuildFrame = window.requestAnimationFrame(rebuildFields);
        });
      }, delay);
    }

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      hasPointer = true;
    };

    const handlePointerLeave = () => {
      hasPointer = false;
      pointerX = -10_000;
      pointerY = -10_000;
    };

    const suspendField = (field: TitleField) => {
      field.visualInfluence = 0;
      field.settled = true;
      field.element.removeAttribute("data-particle-active");
      field.outline.style.setProperty("--particle-outline-opacity", "0");
      for (const particle of field.particles) {
        particle.x = particle.baseX;
        particle.y = particle.baseY;
        particle.vx = 0;
        particle.vy = 0;
        particle.influence = 0;
      }
    };

    const suspendFields = () => fields.forEach(suspendField);

    const handleScroll = () => {
      handlePointerLeave();
      suspendFields();
      scheduleRebuild();
    };

    const handleResize = () => {
      resizeCanvas();
      scheduleRebuild();
    };

    const animate = (time: number) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (const field of fields) {
        if (!field.element.hasAttribute("data-particle-ready")) {
          if (!field.settled || field.visualInfluence > 0.001) {
            suspendField(field);
          }
          continue;
        }

        const pointerNearField =
          hasPointer &&
          distanceToBounds(pointerX, pointerY, field.bounds) <= field.outerRadius;
        if (!pointerNearField && field.settled && field.visualInfluence < 0.005) {
          continue;
        }
        if (pointerNearField) field.settled = false;

        let strongestInfluence = 0;
        let maxDisplacement = 0;
        let maxSpeed = 0;
        const particles = field.particles;

        for (let index = 0; index < particles.length; index += 1) {
          const particle = particles[index];
          const baseDx = particle.baseX - pointerX;
          const baseDy = particle.baseY - pointerY;
          const baseDistance = hasPointer
            ? Math.hypot(baseDx, baseDy)
            : Number.POSITIVE_INFINITY;
          const influence = smoothInfluence(
            baseDistance,
            field.outerRadius,
            field.innerRadius,
          );
          particle.influence = influence;
          strongestInfluence = Math.max(strongestInfluence, influence);

          if (influence > 0) {
            const dx = particle.x - pointerX;
            const dy = particle.y - pointerY;
            const distance = Math.max(0.1, Math.hypot(dx, dy));
            const repulsion = influence * influence * particle.mobility * 0.34;
            particle.vx += (dx / distance) * repulsion;
            particle.vy += (dy / distance) * repulsion;
            const noise = time * 0.00085 + particle.noisePhase;
            particle.vx += Math.cos(noise) * influence * particle.mobility * 0.012;
            particle.vy += Math.sin(noise * 1.07) * influence * particle.mobility * 0.012;
          }

          particle.vx += (particle.baseX - particle.x) * particle.stiffness;
          particle.vy += (particle.baseY - particle.y) * particle.stiffness;
          particle.vx *= particle.damping;
          particle.vy *= particle.damping;
          const speed = Math.hypot(particle.vx, particle.vy);
          maxSpeed = Math.max(maxSpeed, speed);
          if (speed > 2.2) {
            particle.vx = (particle.vx / speed) * 2.2;
            particle.vy = (particle.vy / speed) * 2.2;
          }
          particle.x += particle.vx;
          particle.y += particle.vy;

          const offsetX = particle.x - particle.baseX;
          const offsetY = particle.y - particle.baseY;
          const displacement = Math.hypot(offsetX, offsetY);
          maxDisplacement = Math.max(maxDisplacement, displacement);
          if (displacement > particle.maxDisplacement) {
            particle.x =
              particle.baseX + (offsetX / displacement) * particle.maxDisplacement;
            particle.y =
              particle.baseY + (offsetY / displacement) * particle.maxDisplacement;
            particle.vx *= 0.35;
            particle.vy *= 0.35;
          }
        }

        field.visualInfluence +=
          (strongestInfluence - field.visualInfluence) *
          (strongestInfluence > field.visualInfluence ? 0.22 : 0.12);
        const visualInfluence = field.visualInfluence;

        if (visualInfluence > 0.005) {
          const localX = pointerX - field.bounds.left;
          const localY = pointerY - field.bounds.top;
          field.element.setAttribute("data-particle-active", "true");
          [field.element, field.outline].forEach((target) => {
            target.style.setProperty("--particle-x", `${localX}px`);
            target.style.setProperty("--particle-y", `${localY}px`);
          });
          field.element.style.setProperty(
            "--particle-fill-alpha",
            `${1 - visualInfluence * 0.82}`,
          );
          field.outline.style.setProperty(
            "--particle-outline-opacity",
            `${visualInfluence * field.layoutOpacity}`,
          );
        } else {
          field.element.removeAttribute("data-particle-active");
          field.outline.style.setProperty("--particle-outline-opacity", "0");
        }

        if (
          !pointerNearField &&
          visualInfluence < 0.005 &&
          maxDisplacement < 0.08 &&
          maxSpeed < 0.015
        ) {
          for (const particle of particles) {
            particle.x = particle.baseX;
            particle.y = particle.baseY;
            particle.vx = 0;
            particle.vy = 0;
            particle.influence = 0;
          }
          field.visualInfluence = 0;
          field.settled = true;
        }

        for (const connection of field.connections) {
          const a = particles[connection.a];
          const b = particles[connection.b];
          const influence = Math.min(a.influence, b.influence);
          const alpha =
            influence * influence * 0.5 * field.layoutOpacity * visualInfluence;
          if (alpha < 0.008) continue;
          context.beginPath();
          context.globalAlpha = alpha;
          context.strokeStyle = connection.color;
          context.lineWidth = connection.width;
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }

        for (let index = 0; index < particles.length; index += 1) {
          const particle = particles[index];
          const alpha =
            Math.pow(particle.influence, 1.25) *
            particle.alpha *
            field.layoutOpacity *
            visualInfluence;
          if (alpha < 0.008) continue;
          context.beginPath();
          context.globalAlpha = alpha;
          context.fillStyle = particle.color;
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          context.fill();
        }
      }

      context.globalAlpha = 1;
      animationFrame = window.requestAnimationFrame(animate);
    };

    resizeCanvas();
    document.fonts.ready.then(() => {
      if (disposed) return;
      const elements = [
        ...document.querySelectorAll<HTMLElement>("[data-particle-text]"),
      ];
      elements.forEach((element) => resizeObserver.observe(element));
      rebuildFields();
    });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(rebuildFrame);
      window.cancelAnimationFrame(secondaryRebuildFrame);
      window.clearTimeout(rebuildTimer);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      document.documentElement.removeEventListener(
        "pointerleave",
        handlePointerLeave,
      );
      clearFields();
    };
  }, [enabled]);

  return (
    <canvas
      aria-hidden="true"
      className="text-particle-layer"
      ref={canvasRef}
      style={{ opacity: enabled ? 1 : 0 }}
    />
  );
}
