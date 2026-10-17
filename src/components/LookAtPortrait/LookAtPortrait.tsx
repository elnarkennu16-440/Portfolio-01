// LookAtPortrait.tsx

import React, { useRef, useEffect, useState } from "react";
import { siteContent } from "../../content/siteContent";
import { useLookAtPointer, LOOK_FRAMES } from "../../hooks/useLookAtPointer";
import styles from "./LookAtPortrait.module.css";

interface LookAtPortraitProps {
  isIntroDone?: boolean;
}

interface ParticlePoint {
  x: number;
  y: number;
  shade: number;
  size: number;
}

/* ────────────────────────────────────────────────────────────────────────────
 * DUST REVEAL TUNING  (edit these numbers to make it faster / slower)
 * ────────────────────────────────────────────────────────────────────────────
 * REVEAL_DURATION_MS   total length of the reveal AFTER the 3s loading screen
 * START_DELAY_MS       small calm pause after the loader before dust appears
 * PARTICLES_ARRIVE_BY  (0-1) when the LAST dust grain has landed on the face
 * MAX_STAGGER          (0-1) how spread-out the dust start times are
 * PHOTO_START          (0-1) when the real photo starts to develop underneath
 * PARTICLE_FADE_START  (0-1) when the dust starts melting into the photo
 * PHOTO_BLUR_PX        starting blur of the photo (it sharpens as it develops)
 * ──────────────────────────────────────────────────────────────────────────── */
const REVEAL_DURATION_MS = 4000;
const START_DELAY_MS = 200;
const PARTICLES_ARRIVE_BY = 0.78;
const MAX_STAGGER = 0.34;
const PHOTO_START = 0.5;
const PARTICLE_FADE_START = 0.84;
const PHOTO_BLUR_PX = 14;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
// Gentle slow-in / slow-out: dust drifts, glides, then softly settles
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Fallback portrait silhouette points (facial contours, hair, glasses, tie, suit shoulders)
 */
function generateFallbackPoints(
  stageWidth: number,
  stageHeight: number,
  targetCount: number,
): ParticlePoint[] {
  const result: ParticlePoint[] = [];
  const cx = 0;
  const cy = stageHeight * 0.04;

  for (let i = 0; i < targetCount; i++) {
    const r = Math.random();
    let px = cx;
    let py = cy;
    let lum = 0.55;

    if (r < 0.44) {
      // Head, face, hair, and glasses contours
      const u = Math.random();
      const v = Math.random();
      const w = Math.sqrt(u);
      const angle = v * Math.PI * 2;
      const rx = stageWidth * 0.22;
      const ry = stageHeight * 0.26;
      px = cx + Math.cos(angle) * rx * w;
      py = cy + stageHeight * 0.08 + Math.sin(angle) * ry * w;
      lum = 0.65 + Math.random() * 0.35;
    } else if (r < 0.72) {
      // Collar, tie, and neck
      const spreadX = (Math.random() - 0.5) * (stageWidth * 0.28);
      const spreadY = Math.random() * (stageHeight * 0.26);
      px = cx + spreadX;
      py = cy - stageHeight * 0.12 - spreadY;
      lum = 0.8 + Math.random() * 0.2;
    } else {
      // Suit jacket and shoulders
      const progressY = Math.random();
      const shoulderWidth = stageWidth * (0.42 + progressY * 0.46);
      px = cx + (Math.random() - 0.5) * shoulderWidth;
      py = cy - stageHeight * 0.22 - progressY * (stageHeight * 0.3);
      lum = 0.45 + Math.random() * 0.35;
    }

    result.push({
      x: px,
      y: py,
      shade: Math.floor(168 + lum * 80),
      size: 1.4 + Math.random() * 2.2,
    });
  }

  return result;
}

/**
 * Builds the dust targets directly from Kennu's center photo.
 *
 * Accuracy upgrades vs. the old version:
 *  - samples at 256px (was 160px) and respects the real image aspect ratio
 *    + the same "object-fit: contain" fit as the frames, so dust lands EXACTLY
 *    on the photo (no stretching / offset)
 *  - grains are picked by a weighted lottery (luminance + edge strength) instead
 *    of uniformly, so bright skin / shirt and high-detail areas (eyes, glasses,
 *    hairline, collar, tie, jacket outline) get more dust, like a real photo
 *    being built out of particles
 *  - transparent (cut-out) pixels never receive dust
 */
function extractPointsFromImage(
  img: HTMLImageElement,
  stageWidth: number,
  stageHeight: number,
  targetCount: number,
): ParticlePoint[] {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih)
    return generateFallbackPoints(stageWidth, stageHeight, targetCount);

  const SAMPLE_LONG_SIDE = 256;
  const sampleW =
    iw >= ih
      ? SAMPLE_LONG_SIDE
      : Math.max(1, Math.round((SAMPLE_LONG_SIDE * iw) / ih));
  const sampleH =
    ih > iw
      ? SAMPLE_LONG_SIDE
      : Math.max(1, Math.round((SAMPLE_LONG_SIDE * ih) / iw));

  const canvas = document.createElement("canvas");
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return generateFallbackPoints(stageWidth, stageHeight, targetCount);

  ctx.drawImage(img, 0, 0, sampleW, sampleH);
  const data = ctx.getImageData(0, 0, sampleW, sampleH).data;

  // Same fit as `object-fit: contain` on the portrait frames
  const fit = Math.min(stageWidth / iw, stageHeight / ih);
  const drawW = iw * fit;
  const drawH = ih * fit;
  const cellW = drawW / sampleW;
  const cellH = drawH / sampleH;

  const total = sampleW * sampleH;
  const lumArr = new Float32Array(total); // pure luminance
  const maskedLum = new Float32Array(total); // luminance * alpha (for edge detection)
  const alphaArr = new Uint8Array(total);

  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    const a = data[idx + 3];
    const lum =
      (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
    alphaArr[i] = a;
    lumArr[i] = lum;
    maskedLum[i] = lum * (a / 255);
  }

  // Cumulative weight table → weighted random picking
  const cdf = new Float32Array(total);
  let running = 0;
  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < sampleW; x++) {
      const i = y * sampleW + x;
      if (alphaArr[i] > 40) {
        const xl = maskedLum[y * sampleW + Math.max(0, x - 1)];
        const xr = maskedLum[y * sampleW + Math.min(sampleW - 1, x + 1)];
        const yu = maskedLum[Math.max(0, y - 1) * sampleW + x];
        const yd = maskedLum[Math.min(sampleH - 1, y + 1) * sampleW + x];
        const edge = Math.min(1, Math.hypot(xr - xl, yd - yu) * 2.6);
        const weight =
          (0.18 + lumArr[i] * 0.9 + edge * 2.4) * (alphaArr[i] / 255);
        running += weight;
      }
      cdf[i] = running;
    }
  }

  if (running <= 0) {
    return generateFallbackPoints(stageWidth, stageHeight, targetCount);
  }

  const sizeScale = Math.min(1.15, Math.max(0.6, stageWidth / 480));
  const result: ParticlePoint[] = [];

  for (let n = 0; n < targetCount; n++) {
    const r = (Math.random() * 0.999999 + 0.000001) * running;

    // binary search: first pixel whose cumulative weight >= r
    let lo = 0;
    let hi = total - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] >= r) hi = mid;
      else lo = mid + 1;
    }

    const px0 = lo % sampleW;
    const py0 = Math.floor(lo / sampleW);

    // jitter inside the pixel cell so the dust never looks like a grid
    const px = (px0 + Math.random()) * cellW - drawW / 2;
    const py = -((py0 + Math.random()) * cellH - drawH / 2);

    // Strictly LIGHT GRAY tones based on real photo luminance (RGB 165 to 245)
    const shade = Math.floor(165 + lumArr[lo] * 80);
    // mostly fine dust, a few larger motes for realism
    const size = (1.2 + Math.pow(Math.random(), 1.8) * 2.2) * sizeScale;

    result.push({ x: px, y: py, shade, size });
  }

  return result;
}

export const LookAtPortrait: React.FC<LookAtPortraitProps> = ({
  isIntroDone = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const portraitWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Existing interactive look-at-pointer logic (100% preserved)
  const { activeDirection, previousDirection } = useLookAtPointer({
    containerRef,
    basePath: siteContent.lookGrid.basePath,
  });

  // Strict single-run guards: guaranteed to run EXACTLY ONCE
  const hasStartedRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const [isSettled, setIsSettled] = useState(false);

  // Main Photographic 3D Particle Convergence: Runs EXACTLY 1 Time
  useEffect(() => {
    // Check prefers-reduced-motion
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      hasCompletedRef.current = true;
      setIsSettled(true);
      if (portraitWrapperRef.current) {
        portraitWrapperRef.current.style.opacity = "1";
        portraitWrapperRef.current.style.filter = "";
      }
      return;
    }

    if (!isIntroDone || hasStartedRef.current || hasCompletedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const canvas = canvasRef.current;
    const stage = containerRef.current;
    const wrapper = portraitWrapperRef.current;
    if (!canvas || !stage || !wrapper) {
      hasStartedRef.current = false;
      return;
    }

    // Keep the portrait fully hidden while the dust builds it.
    // (transition is disabled while JS drives the reveal so it never lags/fights)
    wrapper.style.transition = "none";
    wrapper.style.opacity = "0";
    wrapper.style.setProperty("--reveal-blur", `${PHOTO_BLUR_PX}px`);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      hasCompletedRef.current = true;
      setIsSettled(true);
      wrapper.style.transition = "";
      wrapper.style.opacity = "1";
      wrapper.style.removeProperty("--reveal-blur");
      wrapper.style.filter = "";
      return;
    }

    const stageRect = stage.getBoundingClientRect();
    const stageWidth = Math.max(Math.round(stageRect.width), 280);
    const stageHeight = Math.max(Math.round(stageRect.height), 280);

    const PADDING = 40;
    const sceneWidth = stageWidth + PADDING * 2;
    const sceneHeight = stageHeight + PADDING * 2;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = sceneWidth * dpr;
    canvas.height = sceneHeight * dpr;
    ctx.scale(dpr, dpr);

    // More dust on big stages for photographic detail, fewer on phones for speed
    const PARTICLE_COUNT = Math.round(
      Math.min(7500, Math.max(2800, (stageWidth * stageHeight) / 30)),
    );

    let cancelled = false;
    let animId: number | null = null;
    let startTimeout: ReturnType<typeof setTimeout> | undefined;
    let loadTimeout: ReturnType<typeof setTimeout> | undefined;
    let began = false;

    // Pre-built light-gray colour strings (avoids creating thousands of strings per frame)
    const shadeStyles: string[] = [];
    const getShadeStyle = (shade: number) => {
      const s = Math.max(0, Math.min(255, shade | 0));
      if (!shadeStyles[s]) shadeStyles[s] = `rgb(${s}, ${s}, ${s})`;
      return shadeStyles[s];
    };

    const finishReveal = () => {
      hasCompletedRef.current = true;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, sceneWidth, sceneHeight);
      wrapper.style.opacity = "1";
      wrapper.style.removeProperty("--reveal-blur");
      wrapper.style.filter = "";
      wrapper.style.transition = ""; // hand control back to the original CSS
      setIsSettled(true);
    };

    const beginAnimation = (targets: ParticlePoint[]) => {
      if (cancelled) return;

      const count = targets.length;

      // 3D coordinate arrays
      const origX = new Float32Array(count);
      const origY = new Float32Array(count);
      const origZ = new Float32Array(count);
      const settleZ = new Float32Array(count);

      const delays = new Float32Array(count);
      const vortexDirs = new Float32Array(count);
      const randoms = new Float32Array(count);

      // Dust starts as a soft round cloud that stays INSIDE the canvas
      // (no grains clipped at the canvas edge → no visible square box)
      const halfW = stageWidth / 2 + 24;
      const halfH = stageHeight / 2 + 24;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random());
        origX[i] = Math.cos(angle) * radius * halfW * 1.05;
        origY[i] = Math.sin(angle) * radius * halfH * 1.05;
        origZ[i] = (Math.random() - 0.5) * 360 - 40; // 3D depth
        settleZ[i] = (Math.random() - 0.5) * 5; // stable (no per-frame flicker)

        // Head & face start forming first, shoulders / suit follow (organic flow)
        const topFactor = clamp01(
          (stageHeight / 2 - targets[i].y) / stageHeight,
        );
        delays[i] = (Math.random() * 0.65 + topFactor * 0.35) * MAX_STAGGER;

        // Most dust swirls the same way (coherent vortex), a few go against it
        vortexDirs[i] = Math.random() < 0.85 ? 1.0 : -1.0;
        randoms[i] = Math.random();
      }

      const cx = sceneWidth / 2;
      const cy = sceneHeight / 2;
      const fovZ = 520;
      let animStartTime: number | null = null;

      const renderFrame = (timestamp: number) => {
        if (cancelled) return;

        if (animStartTime === null) {
          animStartTime = timestamp;
        }

        const time = timestamp * 0.001;
        const elapsed = timestamp - animStartTime;
        const progress = Math.min(elapsed / REVEAL_DURATION_MS, 1.0);

        // PHOTO DEVELOPS UNDERNEATH THE DUST
        // Slow smoothstep cross-dissolve: blurry → sharp while the dust melts into it.
        if (progress < PHOTO_START) {
          wrapper.style.opacity = "0";
        } else {
          const photoT = (progress - PHOTO_START) / (1.0 - PHOTO_START);
          const photoEase = smoothstep(photoT);
          wrapper.style.opacity = `${photoEase}`;
          wrapper.style.setProperty(
            "--reveal-blur",
            `${((1.0 - photoEase) * PHOTO_BLUR_PX).toFixed(2)}px`,
          );
        }

        // Finish when progress reaches 1.0
        if (progress >= 1.0) {
          finishReveal();
          return; // Stop animation loop FOREVER
        }

        // Soft motion trails: previous frame fades out instead of hard-clearing,
        // so flying dust leaves delicate streaks (cinematic, volumetric feel)
        ctx.globalCompositeOperation = "destination-out";
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
        ctx.fillRect(0, 0, sceneWidth, sceneHeight);
        ctx.globalCompositeOperation = "source-over";

        // Dust gently materialises at the start, melts into the photo at the end
        const introAlpha = smoothstep(progress / 0.1);
        const meltAlpha =
          progress > PARTICLE_FADE_START
            ? 1.0 -
              smoothstep(
                (progress - PARTICLE_FADE_START) / (1.0 - PARTICLE_FADE_START),
              )
            : 1.0;
        const particleAlpha = introAlpha * meltAlpha;
        const EDGE_MARGIN = 70;

        for (let i = 0; i < count; i++) {
          const pt = targets[i];
          const aDelay = delays[i];
          const aRandom = randoms[i];

          // Each grain has its own start time and a smooth journey
          const p = clamp01(
            (progress - aDelay) / Math.max(PARTICLES_ARRIVE_BY - aDelay, 0.001),
          );
          const ease = easeInOutCubic(p);

          // Subtle 3D floating (calms down as the grain lands)
          const calm = 1.0 - ease * 0.85;
          const ambientPhase = time * 0.45 + aRandom * 6.28318;
          const ambX = Math.sin(ambientPhase) * 10.0 * calm;
          const ambY = Math.cos(ambientPhase * 0.85) * 8.0 * calm;
          const ambZ = Math.sin(ambientPhase * 1.3) * 16.0 * calm;

          // Churning turbulence mid-flight: the dust gathers like swirling smoke,
          // then the turbulence dies out exactly as the grain reaches the face
          const churn = Math.sin(Math.PI * ease);
          const churnPhase = time * 1.6 + aRandom * 40.0;
          const turbX = Math.sin(churnPhase) * 26.0 * churn;
          const turbY =
            Math.cos(churnPhase * 0.8 + aRandom * 9.0) * 26.0 * churn;

          let posX = origX[i] + (pt.x - origX[i]) * ease + ambX + turbX;
          let posY = origY[i] + (pt.y - origY[i]) * ease + ambY + turbY;
          const posZ = origZ[i] * (1.0 - ease) + settleZ[i] * ease + ambZ;

          // Coherent 3D vortex swirl that unwinds smoothly to exactly 0 on arrival
          const unwind = (1.0 - ease) * (1.0 - ease);
          if (unwind > 0.0001) {
            const swirlAngle = unwind * Math.PI * 0.9 * vortexDirs[i];
            const cosA = Math.cos(swirlAngle);
            const sinA = Math.sin(swirlAngle);
            const rotX = posX * cosA - posY * sinA;
            const rotY = posX * sinA + posY * cosA;
            posX = rotX;
            posY = rotY;
          }

          // 3D Perspective Projection
          const depthScale = fovZ / Math.max(fovZ - posZ, 60);
          const screenX = cx + posX * depthScale;
          const screenY = cy - posY * depthScale;

          // Soft fade near the canvas border so dust never gets cut into a box
          const edgeDist = Math.min(
            screenX,
            sceneWidth - screenX,
            screenY,
            sceneHeight - screenY,
          );
          if (edgeDist <= 0) continue;
          const edgeFade = smoothstep(edgeDist / EDGE_MARGIN);

          // Opening: only a few sparse specks drift in the air; the rest of the
          // dust fades in as it starts to move and gather
          const early = aRandom < 0.12 ? 1.0 : smoothstep(p / 0.3);

          // Depth of field feel: far grains are dimmer, near grains brighter
          const depthFade = Math.min(1, Math.max(0.45, depthScale));
          const shimmer = 0.9 + 0.1 * Math.sin(time * 2.2 + aRandom * 6.28);
          const ptAlpha =
            (0.3 + 0.62 * ease) *
            shimmer *
            depthFade *
            particleAlpha *
            early *
            edgeFade;
          if (ptAlpha < 0.01) continue;

          const ptSize = Math.max(
            0.9,
            Math.min(pt.size * depthScale * (1.0 - ease * 0.1), 14.0),
          );

          ctx.globalAlpha = Math.min(ptAlpha, 0.94);
          // STRICTLY LIGHT GRAY TONES (RGB 165 - 245)
          ctx.fillStyle = getShadeStyle(pt.shade);
          ctx.beginPath();
          ctx.arc(screenX, screenY, ptSize * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
        animId = requestAnimationFrame(renderFrame);
      };

      // Calm pause after the loader so the dust begins cleanly
      startTimeout = setTimeout(() => {
        if (cancelled) return;
        animId = requestAnimationFrame(renderFrame);
      }, START_DELAY_MS);
    };

    // Wait for the real photo BEFORE starting, so the dust is built on the exact
    // face from the first frame (no mid-flight swap / sudden jump).
    const startWith = (points: ParticlePoint[]) => {
      if (began || cancelled) return;
      began = true;
      if (loadTimeout) clearTimeout(loadTimeout);
      beginAnimation(points);
    };

    const centerImg = new Image();
    centerImg.crossOrigin = "anonymous";

    const sampleImageTargets = () => {
      try {
        startWith(
          extractPointsFromImage(
            centerImg,
            stageWidth,
            stageHeight,
            PARTICLE_COUNT,
          ),
        );
      } catch {
        startWith(
          generateFallbackPoints(stageWidth, stageHeight, PARTICLE_COUNT),
        );
      }
    };

    centerImg.onload = sampleImageTargets;
    centerImg.onerror = () =>
      startWith(
        generateFallbackPoints(stageWidth, stageHeight, PARTICLE_COUNT),
      );
    centerImg.src = `${siteContent.lookGrid.basePath}looking-center.png`;

    if (centerImg.complete && centerImg.naturalWidth > 0) {
      sampleImageTargets();
    } else {
      // Safety net: never leave the portrait hidden if the image is very slow
      loadTimeout = setTimeout(
        () =>
          startWith(
            generateFallbackPoints(stageWidth, stageHeight, PARTICLE_COUNT),
          ),
        2500,
      );
    }

    return () => {
      cancelled = true;
      if (startTimeout) clearTimeout(startTimeout);
      if (loadTimeout) clearTimeout(loadTimeout);
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
      // If React re-runs this effect before we finished, allow a clean restart
      if (!hasCompletedRef.current) {
        hasStartedRef.current = false;
      }
    };
  }, [isIntroDone]);

  return (
    <div
      ref={containerRef}
      className={styles.stage}
      role="img"
      aria-label={`Interactive portrait of ${siteContent.meta.name}, following cursor direction`}
    >
      {/* Background Soft Grayscale Aura */}
      <div className={styles.backdropAura} aria-hidden="true" />

      {/* 3D Volumetric Light Gray Dust Particle Canvas Overlay */}
      {!isSettled && (
        <canvas
          ref={canvasRef}
          className={`${styles.dustCanvas} ${isSettled ? styles.dustCanvasSettled : ""}`}
          aria-hidden="true"
        />
      )}

      {/* Layered 9-Angle Head Direction Cutouts with zero-blink solid base */}
      {/* Continuous mathematical cross-dissolve: starts at opacity 0 and smoothly solidifies */}
      <div
        ref={portraitWrapperRef}
        className={`${styles.portraitWrapper} ${
          isSettled ? styles.portraitSettled : styles.portraitHidden
        }`}
      >
        {LOOK_FRAMES.map((frame) => {
          const isActive = frame.id === activeDirection;
          const isPrevious = frame.id === previousDirection && !isActive;

          let stateClass = "";
          if (isActive) {
            stateClass = styles.frameActive;
          } else if (isPrevious) {
            stateClass = styles.framePrevious;
          }

          return (
            <img
              key={frame.id}
              src={`${siteContent.lookGrid.basePath}${frame.file}`}
              alt={frame.label}
              width={1024}
              height={1024}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className={`${styles.frameImage} ${stateClass}`}
              aria-hidden={!isActive}
            />
          );
        })}
      </div>
    </div>
  );
};
