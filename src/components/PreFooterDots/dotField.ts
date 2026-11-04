/**
 * dotField.ts
 * ---------------------------------------------------------------------------
 * Interactive 3D "gravity" dot field for the PreFooter banner.
 *
 *  - Raw WebGL (no three.js): one draw call, one point per dot.
 *  - Your portrait is turned into a halftone of gray dots (bright = bigger
 *    and brighter dot). The same dots continue around the portrait, so the
 *    image is part of the field, not a picture on top of it.
 *  - The cursor acts like a heavy mass: it bends the dot sheet into a soft
 *    well (dots sink away in 3D, slide toward the cursor like a magnet) and
 *    the motion rolls outward as slow, damped water-like waves.
 *    A click / tap drops a stronger pulse.
 *  - The wave physics runs on the CPU at a fixed 60 Hz step (so it feels the
 *    same on 60 / 120 / 144 Hz screens) on a coarse dot grid. The GPU does
 *    the perspective, lighting and drawing.
 *  - Pauses when the banner is off screen or the tab is hidden. When nothing
 *    is moving, the simulation and the uploads stop completely.
 *
 * Only the tuning constants below should ever need changing.
 * ---------------------------------------------------------------------------
 */

import { setGravityBridge } from "./gravityBridge";
import type { GravityBridge, GravitySample } from "./gravityBridge";

export interface DotFieldOptions {
  canvas: HTMLCanvasElement;
  /** The banner <section>: gives the size and receives pointer events. */
  host: HTMLElement;
  /** The text block (left side). The portrait is kept clear of it. */
  textEl?: HTMLElement | null;
  /** URL of Prefooter-Background-Image.png. Leave out for a plain dot background (footer). */
  imageSrc?: string;
  /** "dark" (default) = always light dots on a dark banner; "auto" = follows data-theme (footer). */
  theme?: "dark" | "auto";
  /** Let the RainWindow read the waves (footer only). */
  publishGravity?: boolean;
}

export interface DotField {
  destroy: () => void;
}

/* ───────────────────────────── tuning ───────────────────────────── */

const MOBILE_BREAKPOINT = 768; // same breakpoint as the CSS
const MAX_DPR = 2; // sharp, but never heavier than 2x
const MAX_DOTS = 46000; // hard safety cap for weak GPUs
const HEX_ROW = 0.8660254; // hex packing: row distance / dot distance

const SIM_STEP = 1 / 60; // fixed physics step (seconds)
const WAVE_SPEED2 = 0.13; // wave speed² (lower = slower waves)
const WAVE_RESTORE = 0.011; // how fast the sheet springs back
const WAVE_DAMPING = 0.984; // closer to 1 = ripples live longer
const WELL_DEPTH = 40; // px the sheet sinks under the cursor
const CLICK_KICK = 2.4; // strength of the click / tap pulse
const POINTER_GLIDE = 0.1; // cursor smoothing (lower = softer, slower)
const SLIDE = 26; // how far dots slide toward the cursor (magnet feel)

const FOCAL = 780; // perspective strength (lower = stronger 3D)
const BASE_PITCH = 0.1; // resting tilt of the sheet (radians)
const MAX_TILT = 0.04; // extra parallax tilt that follows the cursor

const LOCAL_CONTRAST = 0.5; // 0 = plain photo, 1 = strong local contrast
const REVEAL_SECONDS = 2.4; // portrait fade-in when the banner appears

/* ───────────────────────────── shaders ───────────────────────────── */

const VERT = `
precision highp float;
attribute vec2 aBase;
attribute float aTone;
attribute float aSeed;
attribute vec3 aWave;
uniform vec2 uHalf;
uniform vec2 uRot;
uniform float uSpacing;
uniform float uMinDiam;
uniform float uDpr;
uniform float uTime;
uniform float uFocal;
uniform float uSlide;
uniform float uReveal;
varying float vGray;
varying float vAlpha;

void main() {
  float h = aWave.x;
  vec2 slope = aWave.yz;
  float tone = aTone * uReveal;

  // very slow ambient swell so the sheet never looks dead
  float swell = (sin(aBase.x * 0.0105 + uTime * 0.30) +
                 cos(aBase.y * 0.0125 - uTime * 0.24)) * 2.4;
  float z = h + swell;

  // dots slide downhill = toward the cursor (gravity / magnet)
  vec2 p = aBase - slope * uSlide;

  // pitch (x) then yaw (y)
  float cp = cos(uRot.x);
  float sp = sin(uRot.x);
  float cy = cos(uRot.y);
  float sy = sin(uRot.y);
  float y1 = p.y * cp - z * sp;
  float z1 = p.y * sp + z * cp;
  float x2 = p.x * cy + z1 * sy;
  float z2 = -p.x * sy + z1 * cy;

  float persp = uFocal / max(uFocal - z2, 80.0);
  vec2 s = vec2(x2, y1) * persp;
  gl_Position = vec4(s.x / uHalf.x, -s.y / uHalf.y, 0.0, 1.0);

  // halftone size + brightness from the portrait tone
  float shape = clamp(tone, 0.0, 1.0);
  float bump = clamp(h / 40.0, -1.0, 1.0);
  float diam = uSpacing * mix(0.20, 0.86, shape) * (0.9 + 0.2 * aSeed);
  diam *= 1.0 + bump * 0.28;
  diam = max(diam, uMinDiam);
  gl_PointSize = max(diam * persp * uDpr, 1.5);

  // soft lighting from the local slope of the wave
  vec3 n = normalize(vec3(-slope.x * 2.4, -slope.y * 2.4, 1.0));
  vec3 L = vec3(-0.4511, -0.5514, 0.7017);
  float lit = clamp(max(dot(n, L), 0.0) / 0.7017, 0.45, 1.55);

  float wave = clamp(abs(h) / 34.0, 0.0, 1.0);
  float gray = mix(0.27, 0.93, shape);
  gray = gray * (0.72 + 0.28 * lit) + wave * 0.30 + bump * 0.10;
  vGray = clamp(gray, 0.0, 1.0);
  vAlpha = clamp(mix(0.62, 1.0, shape) + wave * 0.30, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
uniform float uLight;
varying float vGray;
varying float vAlpha;

void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(c, c);
  if (r2 > 1.0) discard;
  float edge = 1.0 - smoothstep(0.55, 1.0, r2);
  // tiny sphere shading so every dot reads as a small 3D bead
  vec3 n = vec3(c.x, c.y, sqrt(1.0 - r2));
  float sh = 0.62 + 0.55 * max(dot(n, vec3(-0.4511, -0.5514, 0.7017)), 0.0);
  float g = vGray * sh;
  g = mix(g, 1.0 - g, uLight); // light theme: dark dots on a light page
  float a = vAlpha * edge;
  gl_FragColor = vec4(vec3(g) * a, a);
}
`;

/* ───────────────────────── image → luminance map ───────────────────────── */

interface LumMap {
  w: number;
  h: number;
  data: Float32Array;
}

function boxBlur(
  src: Float32Array,
  w: number,
  h: number,
  r: number,
): Float32Array {
  if (r < 1) return src.slice();
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const d = 2 * r + 1;
  const cl = (n: number, max: number) => (n < 0 ? 0 : n > max ? max : n);

  for (let y = 0; y < h; y++) {
    const row = y * w;
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += src[row + cl(k, w - 1)];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc / d;
      acc += src[row + cl(x + r + 1, w - 1)] - src[row + cl(x - r, w - 1)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += tmp[cl(k, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / d;
      acc += tmp[cl(y + r + 1, h - 1) * w + x] - tmp[cl(y - r, h - 1) * w + x];
    }
  }
  return out;
}

function buildLumMap(img: HTMLImageElement): LumMap | null {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh) return null;

  const k = Math.min(1, 320 / Math.max(nw, nh));
  const w = Math.max(8, Math.round(nw * k));
  const h = Math.max(8, Math.round(nh * k));

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  let px: Uint8ClampedArray;
  try {
    px = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return null;
  }

  const n = w * h;
  const L = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    L[i] =
      ((0.299 * px[o] + 0.587 * px[o + 1] + 0.114 * px[o + 2]) / 255) *
      (px[o + 3] / 255);
  }

  // local contrast: brings out the face / jacket / road instead of one gray blob
  const fine = boxBlur(L, w, h, 2);
  const wide = boxBlur(L, w, h, Math.round(Math.max(w, h) * 0.07));
  const mixed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const local = 0.5 + (L[i] - wide[i]) * 2.1;
    mixed[i] =
      L[i] * (1 - LOCAL_CONTRAST) +
      local * LOCAL_CONTRAST +
      (L[i] - fine[i]) * 0.55;
  }

  // auto levels (ignore the extreme 3% / 0.5%)
  const bins = new Uint32Array(256);
  for (let i = 0; i < n; i++) {
    const t = mixed[i];
    bins[Math.max(0, Math.min(255, Math.round(t * 255)))]++;
  }
  const pick = (frac: number) => {
    const target = n * frac;
    let acc = 0;
    for (let b = 0; b < 256; b++) {
      acc += bins[b];
      if (acc >= target) return b / 255;
    }
    return 1;
  };
  const lo = pick(0.01);
  const hi = Math.max(pick(0.998), lo + 0.1);

  const data = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let t = (mixed[i] - lo) / (hi - lo);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    // lift the shadows (so hair / shirt / hills still show as dots) and
    // keep the bright sky from turning into a solid block
    data[i] = 0.05 + 0.85 * Math.pow(t, 0.58);
  }
  return { w, h, data };
}

function sampleLum(m: LumMap, u: number, v: number): number {
  const fx = Math.max(0, Math.min(1, u)) * (m.w - 1);
  const fy = Math.max(0, Math.min(1, v)) * (m.h - 1);
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(x0 + 1, m.w - 1);
  const y1 = Math.min(y0 + 1, m.h - 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const d = m.data;
  const a = d[y0 * m.w + x0] * (1 - tx) + d[y0 * m.w + x1] * tx;
  const b = d[y1 * m.w + x0] * (1 - tx) + d[y1 * m.w + x1] * tx;
  return a * (1 - ty) + b * ty;
}

/* ───────────────────────────── layout ───────────────────────────── */

interface Box {
  l: number;
  t: number;
  r: number;
  b: number;
}

interface Layout {
  /** portrait box, in section pixels */
  left: number;
  top: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
  spacing: number;
}

/** Position of `el` inside `host` (ignores CSS transforms, so the reveal animation can't skew it). */
function measureInside(el: HTMLElement, host: HTMLElement): Box | null {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== host) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  if (n !== host) return null;
  return { l: x, t: y, r: x + el.offsetWidth, b: y + el.offsetHeight };
}

function computeLayout(
  W: number,
  H: number,
  text: Box | null,
  aspect: number,
): Layout {
  const mobile = W < MOBILE_BREAKPOINT;
  let size: number;
  let cx: number;
  let cy: number;

  if (mobile) {
    // phone: portrait sits in the free band above the text, fully visible
    const top = 20;
    const bottom = text ? text.t - 12 : H * 0.42;
    const avail = Math.max(140, bottom - top);
    size = Math.min(W - 44, avail, 360);
    cx = W / 2;
    cy = top + avail / 2;
  } else {
    // desktop: portrait sits in the free area to the right of the text
    const pref = Math.min(H * 0.74, W * 0.44, 780);
    const freeL = text ? text.r + 12 : W * 0.5;
    const freeW = W - 24 - freeL;
    size = Math.max(Math.min(pref, freeW), pref * 0.64);
    cx = freeW >= size ? freeL + freeW / 2 : W - 24 - size / 2;
    cy = H * 0.46;
  }

  const width = aspect >= 1 ? size : size * aspect;
  const height = aspect >= 1 ? size / aspect : size;

  const minSpacing = mobile ? 3.6 : 4.6;
  const spacing = Math.max(
    minSpacing,
    Math.min(7.4, Math.max(width, height) / 112),
  );

  return {
    left: cx - width / 2,
    top: cy - height / 2,
    width,
    height,
    cx,
    cy,
    spacing,
  };
}

/* ───────────────────────────── helpers ───────────────────────────── */

function smooth(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function hash2(i: number, j: number): number {
  let n = (i * 374761393 + j * 668265263) | 0;
  n = ((n ^ (n >>> 13)) * 1274126177) | 0;
  return (((n ^ (n >>> 16)) >>> 0) % 1000) / 1000;
}

function compile(
  gl: WebGLRenderingContext,
  type: number,
  src: string,
): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("[PreFooterDots] shader error:", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

/* ───────────────────────────── engine ───────────────────────────── */

export function createDotField(opts: DotFieldOptions): DotField {
  const {
    canvas,
    host,
    textEl,
    imageSrc,
    theme = "dark",
    publishGravity = false,
  } = opts;
  const hasImage = !!imageSrc;

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: "high-performance",
  }) as WebGLRenderingContext | null;
  if (!gl) return { destroy: () => undefined };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let destroyed = false;
  let glReady = false;
  let program: WebGLProgram | null = null;
  let staticBuf: WebGLBuffer | null = null;
  let waveBuf: WebGLBuffer | null = null;
  const U: Record<string, WebGLUniformLocation | null> = {};
  const A: Record<string, number> = {};

  // scene state
  let W = 0;
  let H = 0;
  let dpr = 1;
  let lum: LumMap | null = null;
  let lumAspect = 1;
  let layoutKey = "";
  let layout: Layout | null = null;

  // dot grid + wave simulation
  let N = 0;
  let cols = 0;
  let rows = 0;
  let sx = 1;
  let sy = 1;
  let X0 = 0;
  let Y0 = 0;
  let sigma = 40;
  let anis = 1.3333;
  let hgt = new Float32Array(0);
  let vel = new Float32Array(0);
  let wave = new Float32Array(0);
  let settled = true;
  let waveDirty = false;
  let spacingNow = 6;

  // time / loop
  let visible = false;
  let running = false;
  let raf = 0;
  let rebuildRaf = 0;
  let last = 0;
  let acc = 0;
  let time = 0;
  let light = false;
  let rectL = 0;
  let rectT = 0;
  let reveal = reduced ? 1 : 0;
  let revealStart = -1;
  let rotX = BASE_PITCH;
  let rotY = 0;

  // pointer
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, active: 0, target: 0, has: false };
  const kicks: Array<{ x: number; y: number; k: number }> = [];

  /* ---------- GL setup ---------- */

  const initGL = (): boolean => {
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    const p = gl.createProgram();
    if (!p) return false;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error("[PreFooterDots] link error:", gl.getProgramInfoLog(p));
      gl.deleteProgram(p);
      return false;
    }
    program = p;
    for (const name of [
      "uHalf",
      "uRot",
      "uSpacing",
      "uMinDiam",
      "uDpr",
      "uTime",
      "uFocal",
      "uSlide",
      "uReveal",
      "uLight",
    ]) {
      U[name] = gl.getUniformLocation(p, name);
    }
    for (const name of ["aBase", "aTone", "aSeed", "aWave"]) {
      A[name] = gl.getAttribLocation(p, name);
    }
    staticBuf = gl.createBuffer();
    waveBuf = gl.createBuffer();
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    glReady = true;
    return true;
  };

  /* ---------- build the dot grid ---------- */

  const rebuild = () => {
    if (destroyed || !glReady || !program) return;

    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w < 2 || h < 2) return;

    const text = textEl ? measureInside(textEl, host) : null;
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const key = [
      w,
      h,
      ratio,
      lum ? 1 : 0,
      text ? `${text.l},${text.t},${text.r},${text.b}` : "-",
    ].join("|");
    if (key === layoutKey) return;
    layoutKey = key;

    W = w;
    H = h;
    dpr = ratio;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    const lay = computeLayout(W, H, text, lumAspect);
    layout = lay;

    // grid (spacing grows only if a huge screen would exceed the dot cap)
    let spacing = hasImage ? lay.spacing : W < MOBILE_BREAKPOINT ? 4.4 : 6;
    const margin = 3;
    for (;;) {
      sx = spacing;
      sy = spacing * HEX_ROW;
      cols = Math.ceil(W / sx) + margin * 2 + 1;
      rows = Math.ceil(H / sy) + margin * 2 + 1;
      if (cols * rows <= MAX_DOTS) break;
      spacing *= 1.06;
    }
    spacingNow = spacing;
    N = cols * rows;
    anis = (sx / sy) * (sx / sy);
    X0 = -margin * sx;
    Y0 = -margin * sy;
    sigma = Math.max(
      36,
      Math.min(
        84,
        (hasImage ? Math.max(lay.width, lay.height) : Math.min(W, H)) * 0.12,
      ),
    );

    const stat = new Float32Array(N * 4);
    const feather = Math.min(lay.width, lay.height) * 0.1;
    const pad = 12;
    const tb = text
      ? { l: text.l - pad, t: text.t - pad, r: text.r + pad, b: text.b + pad }
      : null;

    for (let j = 0; j < rows; j++) {
      const py = Y0 + j * sy;
      const stagger = j & 1 ? sx * 0.5 : 0;
      for (let i = 0; i < cols; i++) {
        const px = X0 + i * sx + stagger;
        const o = (j * cols + i) * 4;

        let tone = 0;
        if (lum) {
          const u = (px - lay.left) / lay.width;
          const v = (py - lay.top) / lay.height;
          if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
            const edge = Math.min(
              px - lay.left,
              lay.left + lay.width - px,
              py - lay.top,
              lay.top + lay.height - py,
            );
            tone = sampleLum(lum, u, v) * smooth(0, feather, edge);
          }
        }
        if (tb && tone > 0) {
          const dx = Math.max(tb.l - px, 0, px - tb.r);
          const dy = Math.max(tb.t - py, 0, py - tb.b);
          tone *= 0.3 + 0.7 * smooth(0, 48, Math.hypot(dx, dy));
        }

        stat[o] = px - W / 2;
        stat[o + 1] = py - H / 2;
        stat[o + 2] = tone;
        stat[o + 3] = hash2(i, j);
      }
    }

    hgt = new Float32Array(N);
    vel = new Float32Array(N);
    wave = new Float32Array(N * 3);
    settled = true;
    waveDirty = false;
    acc = 0;
    kicks.length = 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, staticBuf);
    gl.bufferData(gl.ARRAY_BUFFER, stat, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, waveBuf);
    gl.bufferData(gl.ARRAY_BUFFER, wave, gl.DYNAMIC_DRAW);

    draw();
  };

  const scheduleRebuild = () => {
    if (rebuildRaf || destroyed) return;
    rebuildRaf = requestAnimationFrame(() => {
      rebuildRaf = 0;
      rebuild();
    });
  };

  /* ---------- theme + gravity bridge (footer) ---------- */

  const themeEl =
    theme === "auto"
      ? ((host.closest("[data-theme]") as HTMLElement | null) ??
        document.documentElement)
      : null;
  const readTheme = () => {
    light = !!themeEl && themeEl.getAttribute("data-theme") === "light";
  };
  readTheme();
  const mo = themeEl
    ? new MutationObserver(() => {
        readTheme();
        if (!running) draw();
      })
    : null;
  if (mo && themeEl)
    mo.observe(themeEl, { attributes: true, attributeFilter: ["data-theme"] });

  const bridge: GravityBridge | null = publishGravity
    ? {
        active: false,
        sample: (cx: number, cy: number, out: GravitySample) => {
          out.x = 0;
          out.y = 0;
          out.h = 0;
          if (settled || N === 0) return;
          const j = Math.round((cy - rectT - Y0) / sy);
          if (j < 1 || j >= rows - 1) return;
          const stagger = j & 1 ? sx * 0.5 : 0;
          const i = Math.round((cx - rectL - X0 - stagger) / sx);
          if (i < 1 || i >= cols - 1) return;
          const o = (j * cols + i) * 3;
          out.h = wave[o];
          out.x = -wave[o + 1] * SLIDE;
          out.y = -wave[o + 2] * SLIDE;
        },
      }
    : null;
  if (bridge) setGravityBridge(bridge);

  /* ---------- physics (fixed 60 Hz step) ---------- */

  const wake = () => {
    settled = false;
    if (bridge) bridge.active = true;
  };

  const applyGauss = (px: number, py: number, amount: number, sig: number) => {
    const R = sig * 3;
    const inv = 1 / (2 * sig * sig);
    const j0 = Math.max(1, Math.floor((py - R - Y0) / sy));
    const j1 = Math.min(rows - 2, Math.ceil((py + R - Y0) / sy));
    const i0 = Math.max(1, Math.floor((px - R - X0) / sx) - 1);
    const i1 = Math.min(cols - 2, Math.ceil((px + R - X0) / sx));
    for (let j = j0; j <= j1; j++) {
      const cy = Y0 + j * sy;
      const stagger = j & 1 ? sx * 0.5 : 0;
      const dy = cy - py;
      for (let i = i0; i <= i1; i++) {
        const dx = X0 + i * sx + stagger - px;
        vel[j * cols + i] -= amount * Math.exp(-(dx * dx + dy * dy) * inv);
      }
    }
  };

  let energy = 0;

  const step = () => {
    // soft cursor glide
    const dx = ptr.tx - ptr.x;
    const dy = ptr.ty - ptr.y;
    ptr.x += dx * POINTER_GLIDE;
    ptr.y += dy * POINTER_GLIDE;
    const speed = Math.hypot(dx, dy) * POINTER_GLIDE;
    ptr.active +=
      (ptr.target - ptr.active) * (ptr.target > ptr.active ? 0.08 : 0.035);
    if (ptr.target === 0 && ptr.active < 0.002) ptr.active = 0;

    // the cursor is a mass: it pulls the sheet down around it
    if (ptr.has && ptr.active > 0) {
      const pull =
        WAVE_RESTORE *
        WELL_DEPTH *
        ptr.active *
        (1 + Math.min(speed * 0.35, 1));
      applyGauss(ptr.x, ptr.y, pull, sigma);
    }

    // click / tap pulses
    while (kicks.length) {
      const k = kicks.pop();
      if (k) applyGauss(k.x, k.y, k.k, sigma * 0.9);
    }

    // wave equation (velocity first, then position: stable and smooth)
    for (let j = 1; j < rows - 1; j++) {
      let idx = j * cols + 1;
      for (let i = 1; i < cols - 1; i++, idx++) {
        const hc = hgt[idx];
        const lap =
          hgt[idx - 1] +
          hgt[idx + 1] -
          2 * hc +
          (hgt[idx - cols] + hgt[idx + cols] - 2 * hc) * anis;
        vel[idx] =
          (vel[idx] + WAVE_SPEED2 * lap - WAVE_RESTORE * hc) * WAVE_DAMPING;
      }
    }
    let e = 0;
    for (let idx = 0; idx < N; idx++) {
      const nh = hgt[idx] + vel[idx];
      hgt[idx] = nh;
      const m = Math.abs(nh) + Math.abs(vel[idx]) * 10;
      if (m > e) e = m;
    }
    energy = e;
  };

  const updateWave = () => {
    const ix = 1 / (2 * sx);
    const iy = 1 / (2 * sy);
    for (let j = 1; j < rows - 1; j++) {
      let idx = j * cols + 1;
      for (let i = 1; i < cols - 1; i++, idx++) {
        const o = idx * 3;
        wave[o] = hgt[idx];
        wave[o + 1] = (hgt[idx + 1] - hgt[idx - 1]) * ix;
        wave[o + 2] = (hgt[idx + cols] - hgt[idx - cols]) * iy;
      }
    }
    waveDirty = true;
  };

  /* ---------- draw ---------- */

  const draw = () => {
    if (!glReady || !program || N === 0) return;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    gl.uniform2f(U.uHalf, W / 2, H / 2);
    gl.uniform2f(U.uRot, rotX, rotY);
    gl.uniform1f(U.uSpacing, spacingNow);
    gl.uniform1f(U.uMinDiam, 1.1);
    gl.uniform1f(U.uDpr, dpr);
    gl.uniform1f(U.uTime, reduced ? 0 : time);
    gl.uniform1f(U.uFocal, FOCAL);
    gl.uniform1f(U.uSlide, SLIDE);
    gl.uniform1f(U.uReveal, reveal);
    gl.uniform1f(U.uLight, light ? 1 : 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, staticBuf);
    gl.enableVertexAttribArray(A.aBase);
    gl.vertexAttribPointer(A.aBase, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(A.aTone);
    gl.vertexAttribPointer(A.aTone, 1, gl.FLOAT, false, 16, 8);
    gl.enableVertexAttribArray(A.aSeed);
    gl.vertexAttribPointer(A.aSeed, 1, gl.FLOAT, false, 16, 12);

    gl.bindBuffer(gl.ARRAY_BUFFER, waveBuf);
    if (waveDirty) {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, wave);
      waveDirty = false;
    }
    gl.enableVertexAttribArray(A.aWave);
    gl.vertexAttribPointer(A.aWave, 3, gl.FLOAT, false, 12, 0);

    gl.drawArrays(gl.POINTS, 0, N);
  };

  /* ---------- main loop ---------- */

  const startReveal = () => {
    if (revealStart >= 0 || reveal >= 1 || !lum || !layout) return;
    revealStart = time;
    // one soft pulse through the portrait as it appears
    kicks.push({ x: layout.cx, y: layout.cy, k: 0.9 });
    wake();
  };

  const frame = (now: number) => {
    raf = 0;
    if (!running || destroyed) return;

    const dt = Math.min(0.064, Math.max(0, (now - last) / 1000));
    last = now;
    time += dt;

    // fixed-step physics, only while something is moving
    const needSim = !settled || ptr.target > 0 || kicks.length > 0;
    if (needSim) {
      acc += dt;
      let n = 0;
      while (acc >= SIM_STEP && n < 3) {
        step();
        acc -= SIM_STEP;
        n++;
      }
      if (n === 3) acc = 0;
      if (n > 0) updateWave();

      if (
        ptr.target === 0 &&
        ptr.active === 0 &&
        kicks.length === 0 &&
        energy < 0.02
      ) {
        hgt.fill(0);
        vel.fill(0);
        wave.fill(0);
        waveDirty = true;
        settled = true;
        energy = 0;
      }
    } else {
      acc = 0;
    }

    if (bridge) {
      const r = host.getBoundingClientRect();
      rectL = r.left;
      rectT = r.top;
      bridge.active = !settled;
    }

    // portrait fade-in
    if (revealStart >= 0 && reveal < 1) {
      const t = Math.min(1, (time - revealStart) / REVEAL_SECONDS);
      reveal = 1 - Math.pow(1 - t, 3);
    }

    // 3D parallax (smooth, frame-rate independent)
    const follow = 1 - Math.exp(-dt * 3.5);
    const nx = ptr.has && ptr.target > 0 ? (ptr.x / W - 0.5) * 2 : 0;
    const ny = ptr.has && ptr.target > 0 ? (ptr.y / H - 0.5) * 2 : 0;
    rotY += (nx * MAX_TILT - rotY) * follow;
    rotX += (BASE_PITCH + ny * MAX_TILT * 0.8 - rotX) * follow;

    draw();
    raf = requestAnimationFrame(frame);
  };

  const updateRunning = () => {
    const should =
      visible && !document.hidden && glReady && !destroyed && !reduced;
    if (should && !running) {
      running = true;
      last = performance.now();
      startReveal();
      raf = requestAnimationFrame(frame);
    } else if (!should && running) {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  /* ---------- pointer ---------- */

  const local = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const aim = (x: number, y: number) => {
    if (!ptr.has || (ptr.target === 0 && ptr.active < 0.05)) {
      ptr.x = x;
      ptr.y = y;
    }
    ptr.tx = x;
    ptr.ty = y;
    ptr.has = true;
    ptr.target = 1;
    wake();
  };

  const onMove = (e: PointerEvent) => {
    if (reduced) return;
    const p = local(e);
    aim(p.x, p.y);
  };
  const onDown = (e: PointerEvent) => {
    if (reduced) return;
    const p = local(e);
    aim(p.x, p.y);
    kicks.push({ x: p.x, y: p.y, k: CLICK_KICK });
  };
  const onLeave = () => {
    ptr.target = 0;
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") ptr.target = 0;
  };

  host.addEventListener("pointermove", onMove, { passive: true });
  host.addEventListener("pointerdown", onDown, { passive: true });
  host.addEventListener("pointerleave", onLeave, { passive: true });
  host.addEventListener("pointerup", onUp, { passive: true });
  host.addEventListener("pointercancel", onUp, { passive: true });

  /* ---------- observers / lifecycle ---------- */

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((en) => en.isIntersecting);
      updateRunning();
    },
    { rootMargin: "150px 0px" },
  );
  io.observe(host);

  const ro = new ResizeObserver(scheduleRebuild);
  ro.observe(host);
  if (textEl) ro.observe(textEl);

  const onVisibility = () => updateRunning();
  const onResize = () => scheduleRebuild();
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("resize", onResize, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleRebuild).catch(() => undefined);
  }

  const onLost = (e: Event) => {
    e.preventDefault();
    glReady = false;
    updateRunning();
  };
  const onRestored = () => {
    layoutKey = "";
    if (initGL()) {
      rebuild();
      updateRunning();
    }
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  // image (the footer runs without one: plain dot background)
  let img: HTMLImageElement | null = null;
  if (imageSrc) {
    const el = new Image();
    img = el;
    el.decoding = "async";
    el.onload = () => {
      if (destroyed) return;
      lum = buildLumMap(el);
      if (lum) {
        lumAspect = el.naturalWidth / el.naturalHeight;
        layoutKey = "";
        rebuild();
        if (reduced) {
          reveal = 1;
          draw();
        } else {
          startReveal();
        }
      }
    };
    el.src = imageSrc;
  }

  if (initGL()) {
    rebuild();
    updateRunning();
  }

  return {
    destroy: () => {
      destroyed = true;
      running = false;
      if (raf) cancelAnimationFrame(raf);
      if (rebuildRaf) cancelAnimationFrame(rebuildRaf);
      io.disconnect();
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      if (img) img.onload = null;
      if (mo) mo.disconnect();
      if (bridge) setGravityBridge(null);
      if (glReady) {
        if (staticBuf) gl.deleteBuffer(staticBuf);
        if (waveBuf) gl.deleteBuffer(waveBuf);
        if (program) gl.deleteProgram(program);
      }
      glReady = false;
    },
  };
}
