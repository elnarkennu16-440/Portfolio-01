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

/* Exact CSS equivalent of smoothstep(t) = 3t² − 2t³ (used so the photo's
   opacity/blur can run on the GPU with the SAME curve as before). */
const SMOOTHSTEP_EASING = "cubic-bezier(0.3333, 0, 0.6667, 1)";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
// Gentle slow-in / slow-out: dust drifts, glides, then softly settles
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* ────────────────────────────────────────────────────────────────────────────
 * DUST DRAWING (performance)
 * Instead of one canvas fill per grain (7,500 fills every frame on desktop),
 * grains that share the same tone + opacity step are added to ONE path and
 * filled together. Tones step by 10 (RGB 165-245) and opacity in 14 steps, which
 * is not visible on tiny dust but cuts the draw calls from thousands to ~100.
 * ──────────────────────────────────────────────────────────────────────────── */
const SHADE_LEVELS = 9; // 165, 175, ... 245
const ALPHA_LEVELS = 14;
const BUCKET_STRIDE = ALPHA_LEVELS + 1;

/**
 * Pre-loads Kennu's center photo ONCE and shares it.
 * It is requested as soon as the component mounts (during the loading screen), so on
 * the very first visit the photo is already downloaded when the dust animation starts.
 * CORS mode is only used if the photo lives on another origin (same-origin images
 * never taint the canvas, and this keeps the browser cache shared with the <img> frames).
 */
const centerImageCache = new Map<string, Promise<HTMLImageElement | null>>();
function loadCenterImage(src: string): Promise<HTMLImageElement | null> {
  const cached = centerImageCache.get(src);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    try {
      const url = new URL(src, window.location.href);
      if (url.origin !== window.location.origin) img.crossOrigin = "anonymous";
    } catch {
      // keep default
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      centerImageCache.delete(src); // allow a retry later
      resolve(null);
    };
    img.src = src;
  });

  centerImageCache.set(src, promise);
  return promise;
}

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

  // Start downloading the dust source photo immediately (during the loading screen)
  useEffect(() => {
    void loadCenterImage(`${siteContent.lookGrid.basePath}looking-center.png`);
  }, []);

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

    const PADDING = 40;
    let stageWidth = 280;
    let stageHeight = 280;
    let sceneWidth = stageWidth + PADDING * 2;
    let sceneHeight = stageHeight + PADDING * 2;
    let PARTICLE_COUNT = 2800;

    // Measures the stage + sizes the canvas. It is called again at the exact moment the
    // photo is ready, so the dust always matches the FINAL layout (not a mid-load one).
    const prepareScene = () => {
      const stageRect = stage.getBoundingClientRect();
      stageWidth = Math.max(Math.round(stageRect.width), 280);
      stageHeight = Math.max(Math.round(stageRect.height), 280);
      sceneWidth = stageWidth + PADDING * 2;
      sceneHeight = stageHeight + PADDING * 2;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = sceneWidth * dpr;
      canvas.height = sceneHeight * dpr;
      ctx.scale(dpr, dpr);

      // More dust on big stages for photographic detail, fewer on phones for speed
      PARTICLE_COUNT = Math.round(
        Math.min(7500, Math.max(2800, (stageWidth * stageHeight) / 30)),
      );
    };
    prepareScene();

    let cancelled = false;
    let animId: number | null = null;
    let startTimeout: ReturnType<typeof setTimeout> | undefined;
    let loadTimeout: ReturnType<typeof setTimeout> | undefined;
    let began = false;
    // GPU-driven photo opacity + blur animations (null = fallback to per-frame styles)
    let gpuAnims: Animation[] | null = null;

    const cancelGpuAnims = () => {
      if (gpuAnims) {
        gpuAnims.forEach((a) => a.cancel());
        gpuAnims = null;
      }
    };

    /**
     * PERF: the photo's opacity + blur used to be rewritten on the main thread
     * EVERY frame, which forced the browser to re-render the whole filtered
     * portrait (9 images + grayscale/contrast/drop-shadow/mask) 60x per second.
     * They now run as native animations with the exact same timing and the exact
     * same smoothstep curve, so they cost the main thread nothing.
     */
    const startGpuPhotoReveal = (): Animation[] | null => {
      if (typeof wrapper.animate !== "function") return null;
      try {
        const timing: KeyframeAnimationOptions = {
          delay: PHOTO_START * REVEAL_DURATION_MS,
          duration: (1 - PHOTO_START) * REVEAL_DURATION_MS,
          easing: SMOOTHSTEP_EASING,
          fill: "both",
        };
        const list: Animation[] = [];
        list.push(wrapper.animate([{ opacity: 0 }, { opacity: 1 }], timing));

        const fromFilter = getComputedStyle(wrapper).filter;
        if (fromFilter && /blur\(/.test(fromFilter)) {
          const toFilter = fromFilter.replace(/blur\([^)]*\)/, "blur(0px)");
          list.push(
            wrapper.animate(
              [{ filter: fromFilter }, { filter: toFilter }],
              timing,
            ),
          );
        }
        return list;
      } catch {
        return null;
      }
    };

    const finishReveal = () => {
      hasCompletedRef.current = true;
      cancelGpuAnims();
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

      // Target data in flat typed arrays (faster than reading objects every frame)
      const targetX = new Float32Array(count);
      const targetY = new Float32Array(count);
      const targetSize = new Float32Array(count);
      const targetShadeLevel = new Uint8Array(count);

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

        targetX[i] = targets[i].x;
        targetY[i] = targets[i].y;
        targetSize[i] = targets[i].size;
        targetShadeLevel[i] = Math.max(
          0,
          Math.min(SHADE_LEVELS - 1, Math.round((targets[i].shade - 165) / 10)),
        );

        // Head & face start forming first, shoulders / suit follow (organic flow)
        const topFactor = clamp01(
          (stageHeight / 2 - targets[i].y) / stageHeight,
        );
        delays[i] = (Math.random() * 0.65 + topFactor * 0.35) * MAX_STAGGER;

        // Most dust swirls the same way (coherent vortex), a few go against it
        vortexDirs[i] = Math.random() < 0.85 ? 1.0 : -1.0;
        randoms[i] = Math.random();
      }

      // Pre-built light-gray colour strings (one per tone step)
      const shadeStyles: string[] = [];
      for (let k = 0; k < SHADE_LEVELS; k++) {
        const g = 165 + k * 10;
        shadeStyles.push(`rgb(${g}, ${g}, ${g})`);
      }
      const bucketPaths: (Path2D | undefined)[] = new Array(
        SHADE_LEVELS * BUCKET_STRIDE,
      );

      // Safety net for slow PCs: if frames take too long, draw a slightly smaller
      // share of the grains (never goes below 50%). On a healthy PC this stays at
      // 100% so the dust looks exactly the same. Timing is never affected.
      let drawFraction = 1;
      let emaDt = 16.7;
      let lastTs = 0;
      let frameCounter = 0;

      const cx = sceneWidth / 2;
      const cy = sceneHeight / 2;
      const fovZ = 520;
      const TWO_PI = Math.PI * 2;
      let animStartTime: number | null = null;

      const renderFrame = (timestamp: number) => {
        if (cancelled) return;

        if (animStartTime === null) {
          animStartTime = timestamp;
          gpuAnims = startGpuPhotoReveal();
        }

        if (lastTs > 0) {
          emaDt = emaDt * 0.9 + (timestamp - lastTs) * 0.1;
          frameCounter++;
          if (frameCounter % 20 === 0 && emaDt > 24 && drawFraction > 0.5) {
            drawFraction = Math.max(0.5, drawFraction - 0.1);
          }
        }
        lastTs = timestamp;

        const time = timestamp * 0.001;
        const elapsed = timestamp - animStartTime;
        const progress = Math.min(elapsed / REVEAL_DURATION_MS, 1.0);

        // PHOTO DEVELOPS UNDERNEATH THE DUST
        // Slow smoothstep cross-dissolve: blurry → sharp while the dust melts into it.
        // (Normally handled by the native animations above; this is only the
        // fallback for browsers without the Web Animations API.)
        if (!gpuAnims) {
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

        bucketPaths.fill(undefined);
        const drawCount = Math.max(1, Math.floor(count * drawFraction));

        for (let i = 0; i < drawCount; i++) {
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

          let posX = origX[i] + (targetX[i] - origX[i]) * ease + ambX + turbX;
          let posY = origY[i] + (targetY[i] - origY[i]) * ease + ambY + turbY;
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
          const shimmer = 0.9 + 0.1 * Math.sin(time * 2.2 + aRandom * TWO_PI);
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
            Math.min(targetSize[i] * depthScale * (1.0 - ease * 0.1), 14.0),
          );

          // STRICTLY LIGHT GRAY TONES (RGB 165 - 245): grains with the same tone
          // and opacity step are collected into one path and filled once below
          let alphaIdx = Math.round(Math.min(ptAlpha, 0.94) * ALPHA_LEVELS);
          if (alphaIdx < 1) alphaIdx = 1;
          const bucket = targetShadeLevel[i] * BUCKET_STRIDE + alphaIdx;
          let path = bucketPaths[bucket];
          if (!path) {
            path = new Path2D();
            bucketPaths[bucket] = path;
          }
          const radius = ptSize * 0.5;
          path.moveTo(screenX + radius, screenY);
          path.arc(screenX, screenY, radius, 0, TWO_PI);
        }

        for (let b = 0; b < bucketPaths.length; b++) {
          const path = bucketPaths[b];
          if (!path) continue;
          ctx.globalAlpha = (b % BUCKET_STRIDE) / ALPHA_LEVELS;
          ctx.fillStyle = shadeStyles[Math.floor(b / BUCKET_STRIDE)];
          ctx.fill(path);
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

    // Wait for the REAL photo before starting, so the dust is ALWAYS built on the exact
    // face. The photo was pre-loaded at mount, so on the first visit it is normally ready.
    // A slow download no longer switches to the generic silhouette — we just wait for it.
    const startWith = (img: HTMLImageElement | null) => {
      if (began || cancelled) return;
      began = true;
      if (loadTimeout) clearTimeout(loadTimeout);

      prepareScene(); // measure the final layout right now

      let points: ParticlePoint[];
      try {
        points = img
          ? extractPointsFromImage(img, stageWidth, stageHeight, PARTICLE_COUNT)
          : generateFallbackPoints(stageWidth, stageHeight, PARTICLE_COUNT);
      } catch {
        points = generateFallbackPoints(
          stageWidth,
          stageHeight,
          PARTICLE_COUNT,
        );
      }
      beginAnimation(points);
    };

    void loadCenterImage(
      `${siteContent.lookGrid.basePath}looking-center.png`,
    ).then(startWith);

    // Last-resort safety net only (e.g. network is down) — NOT triggered by a slow download
    loadTimeout = setTimeout(() => startWith(null), 15000);

    return () => {
      cancelled = true;
      if (startTimeout) clearTimeout(startTimeout);
      if (loadTimeout) clearTimeout(loadTimeout);
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
      cancelGpuAnims();
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
