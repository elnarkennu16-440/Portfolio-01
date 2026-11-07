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
import { LAND_HOLE_EVENT, getLandHole } from "./holeBridge";
import type { LandHole } from "./holeBridge";
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
  /** Element that gives the canvas size (default: host). Used by the viewport-sized sections. */
  area?: HTMLElement;
  /** Lower pixel-ratio cap for big sections (default 2). */
  maxDpr?: number;
  /** Turn the big background word (element with data-dot-mask inside host) into waving dots. */
  mask?: boolean;
  /** Dot strength of that word, 0..1 (default 0.22). */
  maskTone?: number;
  /** Hide the dots over the "land" of the Highlight 3D scene (see holeBridge.ts). */
  landHole?: boolean;
  /** A full-screen sub page (Resume, All Works): while it is open, the dot fields of the page behind it pause. */
  overlay?: boolean;
  /**
   * Opt-in (PreFooter only, default off = nothing changes for the other sections):
   * the image covers the whole area like a wide background (cropped to fit,
   * never stretched), without edge fade, and its dots are toned down.
   */
  fill?: boolean;
  /** With `fill`: strongest dot tone of the image, 0..1 (default 0.6). Lower = darker image. */
  fillTone?: number;
  /** With `fill`: which part of the image stays visible when it is cropped, 0..1 (default 0.5 / 0.5). */
  fillFocusX?: number;
  fillFocusY?: number;
  /**
   * Opt-in (PreFooter only, default off = nothing changes for the other sections):
   * "calm zones" on the image (with `fill`). Inside them the gravity waves are weakened,
   * so the figure in the picture is barely bent when the cursor goes over it.
   * The zones are ellipses written in pixels of a reference section size (refW x refH);
   * they are attached to the IMAGE, so they follow it on every screen size.
   */
  calm?: {
    refW: number;
    refH: number;
    /** 0..1 : how much of the wave movement is removed inside the zones (1 = none left) */
    amount: number;
    zones: Array<{ x: number; y: number; rx: number; ry: number }>;
  };
}

/* ───── full-screen sub pages pause the page behind them ───── */
let overlayCount = 0;
const overlayListeners = new Set<() => void>();
const changeOverlay = (delta: number) => {
  overlayCount = Math.max(0, overlayCount + delta);
  overlayListeners.forEach((fn) => fn());
};

export interface DotField {
  destroy: () => void;
}

/* ───────────────────────────── tuning ───────────────────────────── */

const MOBILE_BREAKPOINT = 768; // same breakpoint as the CSS
const MAX_DPR = 2; // sharp, but never heavier than 2x
const MAX_CANVAS_PIXELS = 5500000; // keeps tall / huge areas light on memory
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
uniform sampler2D uMask;
uniform vec4 uMaskRect;
uniform float uMaskOn;
uniform float uMaskTone;
uniform float uHoleOn;
uniform mat2 uHoleA;
uniform vec2 uHoleB;
uniform vec2 uHoleC;
uniform vec4 uHoleP;   // e, perspective, anchor x, anchor y
uniform vec4 uHoleG;   // land ellipse on the ground: cx, cy, rx, ry
uniform vec4 uHoleR;   // 3D stage rectangle inside this field (css px)
uniform float uHoleS;  // strength 0..1
varying float vGray;
varying float vAlpha;

void main() {
  float h = aWave.x;
  vec2 slope = aWave.yz;

  // the land of the 3D scene: dots disappear exactly over it, in the scene's own 3D view
  float keep = 1.0;
  if (uHoleOn > 0.5) {
    vec2 sp = aBase + uHalf - uHoleR.xy;
    if (sp.x > 0.0 && sp.y > 0.0 && sp.x < uHoleR.z && sp.y < uHoleR.w) {
      vec2 u = sp - uHoleP.zw;
      float k00 = uHoleA[0][0] + u.x * uHoleC.x / uHoleP.y;
      float k10 = uHoleA[0][1] + u.y * uHoleC.x / uHoleP.y;
      float k01 = uHoleA[1][0] + u.x * uHoleC.y / uHoleP.y;
      float k11 = uHoleA[1][1] + u.y * uHoleC.y / uHoleP.y;
      vec2 rhs = u * (1.0 - uHoleP.x / uHoleP.y) - uHoleB;
      float det = k00 * k11 - k01 * k10;
      if (abs(det) > 1e-6) {
        vec2 g = vec2(k11 * rhs.x - k01 * rhs.y, -k10 * rhs.x + k00 * rhs.y) / det;
        float d = length((g - uHoleG.xy) / uHoleG.zw);
        float hole = 1.0 - smoothstep(0.55, 1.0, d);
        float edge = min(min(sp.x, sp.y), min(uHoleR.z - sp.x, uHoleR.w - sp.y));
        hole *= smoothstep(0.0, 28.0, edge);
        keep = 1.0 - hole * uHoleS;
      }
    }
  }
  // big background word (text mask): the dots under the letters light up
  float m = 0.0;
  if (uMaskOn > 0.5) {
    vec2 uv = (aBase - uMaskRect.xy) / uMaskRect.zw;
    if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
      m = texture2D(uMask, uv).a;
    }
  }
  float tone = max(aTone * uReveal, m * uMaskTone);

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
  diam *= mix(0.45, 1.0, keep);
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
  vAlpha = clamp(mix(0.62, 1.0, shape) + wave * 0.30, 0.0, 1.0) * keep;
  if (keep < 0.02) gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // fully hidden: off screen
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
  } catch (err) {
    console.error("[dotField] could not read the image pixels:", err);
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
  fill: { x: number; y: number } | null = null,
): Layout {
  if (fill) {
    // wide background: the image covers the whole area (like object-fit: cover).
    // 10% overscan so the 3D tilt of the sheet never shows an empty edge.
    const over = 1.1;
    const width = Math.max(W, H * aspect) * over;
    const height = width / aspect;
    const left = -(width - W) * fill.x;
    const top = -(height - H) * fill.y;
    return {
      left,
      top,
      width,
      height,
      cx: left + width / 2,
      cy: top + height / 2,
      spacing: W < MOBILE_BREAKPOINT ? 4.4 : 6,
    };
  }

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
  const area = opts.area ?? host;
  const maxDpr = opts.maxDpr ?? MAX_DPR;
  const maskTone = opts.maskTone ?? 0.22;
  const isOverlay = !!opts.overlay;
  const useHole = !!opts.landHole;
  const maskEl = opts.mask
    ? host.querySelector<HTMLElement>("[data-dot-mask]")
    : null;
  const hasImage = !!imageSrc;
  const useFill = !!opts.fill && hasImage;
  const fillTone = Math.max(0, Math.min(1, opts.fillTone ?? 0.6));
  const fillFocus = {
    x: Math.max(0, Math.min(1, opts.fillFocusX ?? 0.5)),
    y: Math.max(0, Math.min(1, opts.fillFocusY ?? 0.5)),
  };

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: "high-performance",
  }) as WebGLRenderingContext | null;
  if (!gl) {
    console.error(
      "[dotField] WebGL is not available: the dot background is skipped.",
    );
    return { destroy: () => undefined };
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let destroyed = false;
  let glReady = false;
  let program: WebGLProgram | null = null;
  let staticBuf: WebGLBuffer | null = null;
  let waveBuf: WebGLBuffer | null = null;
  let maskTex: WebGLTexture | null = null;
  let vtf = false;
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
  let calmK = new Float32Array(0); // per dot: 1 = full movement, lower = calmer (see `calm`)
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
  let maskOn = false;
  let maskKey = "";
  let maskHiddenByUs = false;
  let maskPrevVisibility = "";
  const mRect = { x: 0, y: 0, w: 1, h: 1, on: false };
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
      "uMask",
      "uMaskRect",
      "uMaskOn",
      "uMaskTone",
      "uHoleOn",
      "uHoleA",
      "uHoleB",
      "uHoleC",
      "uHoleP",
      "uHoleG",
      "uHoleR",
      "uHoleS",
    ]) {
      U[name] = gl.getUniformLocation(p, name);
    }
    for (const name of ["aBase", "aTone", "aSeed", "aWave"]) {
      A[name] = gl.getAttribLocation(p, name);
    }
    staticBuf = gl.createBuffer();
    waveBuf = gl.createBuffer();
    vtf = (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) as number) > 0;
    maskTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, maskTex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(4),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    glReady = true;
    return true;
  };

  /* ---------- land hole (Highlight scene) ---------- */

  const holeState: {
    on: boolean;
    lh: LandHole | null;
    x: number;
    y: number;
    w: number;
    h: number;
  } = {
    on: false,
    lh: null,
    x: 0,
    y: 0,
    w: 1,
    h: 1,
  };

  const updateHole = () => {
    if (!useHole) return;
    const lh = getLandHole();
    if (!lh || lh.strength < 0.003) {
      holeState.on = false;
      return;
    }
    const sr = lh.stage.getBoundingClientRect();
    const ar = area.getBoundingClientRect();
    holeState.lh = lh;
    holeState.x = sr.left - ar.left;
    holeState.y = sr.top - ar.top;
    holeState.w = sr.width;
    holeState.h = sr.height;
    holeState.on = sr.width > 2 && sr.height > 2;
  };

  /* ---------- big background word -> texture ---------- */

  const showMaskEl = () => {
    if (maskEl && maskHiddenByUs) {
      maskEl.style.visibility = maskPrevVisibility;
      maskHiddenByUs = false;
    }
  };

  const setMaskOff = () => {
    maskOn = false;
    maskKey = "";
    mRect.on = false;
    showMaskEl();
  };

  const buildMask = () => {
    if (!maskEl || !glReady || !vtf || !maskTex) {
      setMaskOff();
      return;
    }
    const w = maskEl.offsetWidth;
    const h = maskEl.offsetHeight;
    if (w < 4 || h < 4) {
      setMaskOff();
      return;
    }
    const cs = window.getComputedStyle(maskEl);
    let text = maskEl.textContent ?? "";
    if (!/pre/.test(cs.whiteSpace)) text = text.replace(/\s+/g, " ").trim();
    if (cs.textTransform === "uppercase") text = text.toUpperCase();
    else if (cs.textTransform === "lowercase") text = text.toLowerCase();
    if (!text) {
      setMaskOff();
      return;
    }

    const key = [
      w,
      h,
      text,
      cs.fontFamily,
      cs.fontWeight,
      cs.fontStyle,
      cs.fontSize,
      cs.letterSpacing,
      cs.lineHeight,
      cs.textAlign,
      cs.paddingLeft,
      cs.paddingTop,
    ].join("|");
    if (maskOn && key === maskKey) return;

    const scale = Math.min(0.5, 4096 / w, 2048 / h);
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));
    const c = document.createElement("canvas");
    c.width = cw;
    c.height = ch;
    const g = c.getContext("2d");
    if (!g) {
      setMaskOff();
      return;
    }
    g.setTransform(scale, 0, 0, scale, 0, 0);
    const fs = parseFloat(cs.fontSize) || 16;
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    g.fillStyle = "#ffffff";
    g.textBaseline = "alphabetic";

    const ls = parseFloat(cs.letterSpacing) || 0;
    const native =
      typeof (g as unknown as { letterSpacing?: unknown }).letterSpacing ===
      "string";
    if (native)
      (g as unknown as { letterSpacing: string }).letterSpacing = `${ls}px`;

    const mt = g.measureText("Hg");
    const fa = mt.fontBoundingBoxAscent || fs * 0.8;
    const fd = mt.fontBoundingBoxDescent || fs * 0.2;
    let lh = parseFloat(cs.lineHeight);
    if (!isFinite(lh)) lh = fa + fd;
    const pl = parseFloat(cs.paddingLeft) || 0;
    const pr = parseFloat(cs.paddingRight) || 0;
    const pt = parseFloat(cs.paddingTop) || 0;
    const baseline = pt + (lh - (fa + fd)) / 2 + fa;

    let tw = 0;
    if (native) {
      tw = g.measureText(text).width;
    } else {
      for (const chr of Array.from(text)) tw += g.measureText(chr).width + ls;
    }
    let x = pl;
    if (cs.textAlign === "center") x = (w - tw) / 2;
    else if (cs.textAlign === "right" || cs.textAlign === "end")
      x = w - pr - tw;

    if (native) {
      g.fillText(text, x, baseline);
    } else {
      let cx = x;
      for (const chr of Array.from(text)) {
        g.fillText(chr, cx, baseline);
        cx += g.measureText(chr).width + ls;
      }
    }

    gl.bindTexture(gl.TEXTURE_2D, maskTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    maskKey = key;
    maskOn = true;
    // the dots now draw this word, so the plain text steps aside
    if (!maskHiddenByUs) {
      maskPrevVisibility = maskEl.style.visibility;
      maskEl.style.visibility = "hidden";
      maskHiddenByUs = true;
    }
  };

  /** Where the word is on screen right now (follows scroll, parallax, reveal transforms). */
  const updateMaskRect = () => {
    if (!maskOn || !maskEl) {
      mRect.on = false;
      return;
    }
    const ar = area.getBoundingClientRect();
    const mr = maskEl.getBoundingClientRect();
    if (mr.width < 2 || mr.height < 2) {
      mRect.on = false;
      return;
    }
    mRect.x = mr.left - ar.left - W / 2;
    mRect.y = mr.top - ar.top - H / 2;
    mRect.w = mr.width;
    mRect.h = mr.height;
    mRect.on = true;
  };

  /* ---------- build the dot grid ---------- */

  const rebuild = () => {
    if (destroyed || !glReady || !program) return;

    const w = area.clientWidth;
    const h = area.clientHeight;
    if (w < 2 || h < 2) return;

    const text = textEl ? measureInside(textEl, host) : null;
    let ratio = Math.min(window.devicePixelRatio || 1, maxDpr);
    if (w * h * ratio * ratio > MAX_CANVAS_PIXELS) {
      ratio = Math.max(0.75, Math.sqrt(MAX_CANVAS_PIXELS / (w * h)));
    }
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

    const lay = computeLayout(
      W,
      H,
      text,
      lumAspect,
      useFill ? fillFocus : null,
    );
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
            tone =
              sampleLum(lum, u, v) *
              (useFill ? fillTone : smooth(0, feather, edge));
          }
        }
        if (tb && tone > 0) {
          const dx = Math.max(tb.l - px, 0, px - tb.r);
          const dy = Math.max(tb.t - py, 0, py - tb.b);
          // fill: a wider soft fade so the text stays easy to read
          tone *= 0.3 + 0.7 * smooth(0, useFill ? 150 : 48, Math.hypot(dx, dy));
        }

        stat[o] = px - W / 2;
        stat[o + 1] = py - H / 2;
        stat[o + 2] = tone;
        stat[o + 3] = hash2(i, j);
      }
    }

    // calm zones (opt-in): weaker wave movement over the figure of the image
    calmK = new Float32Array(0);
    const calmOpt = opts.calm;
    if (useFill && calmOpt && calmOpt.zones.length && lay.width > 0) {
      const ref = computeLayout(
        calmOpt.refW,
        calmOpt.refH,
        null,
        lumAspect,
        fillFocus,
      );
      const sc = lay.width / ref.width;
      const zs = calmOpt.zones.map((z) => ({
        x: lay.left + (z.x - ref.left) * sc,
        y: lay.top + (z.y - ref.top) * sc,
        rx: Math.max(1, z.rx * sc),
        ry: Math.max(1, z.ry * sc),
      }));
      const amt = Math.max(0, Math.min(1, calmOpt.amount));
      calmK = new Float32Array(N);
      for (let j = 0; j < rows; j++) {
        const py = Y0 + j * sy;
        const stagger = j & 1 ? sx * 0.5 : 0;
        for (let i = 0; i < cols; i++) {
          const px = X0 + i * sx + stagger;
          let inside = 0;
          for (const z of zs) {
            const d = Math.hypot((px - z.x) / z.rx, (py - z.y) / z.ry);
            inside = Math.max(inside, 1 - smooth(1.0, 1.3, d)); // full calm up to the edge, soft fade outside
          }
          calmK[j * cols + i] = 1 - amt * inside;
        }
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

    buildMask();
    updateMaskRect();
    updateHole();
    draw();
  };

  const scheduleRebuild = () => {
    if (rebuildRaf || destroyed) return;
    rebuildRaf = requestAnimationFrame(() => {
      rebuildRaf = 0;
      buildMask();
      rebuild();
      updateMaskRect();
      if (!running) draw();
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
    const calm = calmK.length === N ? calmK : null; // null = no calm zones (all other sections)
    for (let j = 1; j < rows - 1; j++) {
      let idx = j * cols + 1;
      for (let i = 1; i < cols - 1; i++, idx++) {
        const o = idx * 3;
        const k = calm ? calm[idx] : 1;
        wave[o] = hgt[idx] * k;
        wave[o + 1] = (hgt[idx + 1] - hgt[idx - 1]) * ix * k;
        wave[o + 2] = (hgt[idx + cols] - hgt[idx - cols]) * iy * k;
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
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, maskTex);
    gl.uniform1i(U.uMask, 0);
    gl.uniform4f(U.uMaskRect, mRect.x, mRect.y, mRect.w, mRect.h);
    gl.uniform1f(U.uMaskOn, mRect.on ? 1 : 0);
    gl.uniform1f(U.uMaskTone, maskTone);
    const hs = holeState;
    const lh = hs.on ? hs.lh : null;
    gl.uniform1f(U.uHoleOn, lh ? 1 : 0);
    if (lh) {
      gl.uniformMatrix2fv(U.uHoleA, false, lh.a);
      gl.uniform2f(U.uHoleB, lh.b[0], lh.b[1]);
      gl.uniform2f(U.uHoleC, lh.c[0], lh.c[1]);
      gl.uniform4f(U.uHoleP, lh.e, lh.persp, lh.ax, lh.ay);
      gl.uniform4f(U.uHoleG, lh.cx, lh.cy, lh.rx, lh.ry);
      gl.uniform4f(U.uHoleR, hs.x, hs.y, hs.w, hs.h);
      gl.uniform1f(U.uHoleS, lh.strength);
    }

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

    updateMaskRect();
    updateHole();

    if (bridge) {
      const r = area.getBoundingClientRect();
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
    const covered = !isOverlay && overlayCount > 0; // a sub page is open on top of this one
    const should =
      visible &&
      !covered &&
      !document.hidden &&
      glReady &&
      !destroyed &&
      !reduced;
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

  const onOverlayChange = () => updateRunning();
  if (isOverlay) changeOverlay(1);
  else overlayListeners.add(onOverlayChange);

  /* ---------- pointer ---------- */

  const local = (e: PointerEvent) => {
    const r = area.getBoundingClientRect();
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
  ro.observe(area);
  if (area !== host) ro.observe(host);
  if (textEl) ro.observe(textEl);
  if (maskEl) ro.observe(maskEl);

  // reduced motion: no loop, but the word must still follow the page while scrolling
  let scrollRaf = 0;
  const onScrollStatic = () => {
    if (scrollRaf || !reduced || !maskOn) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      updateMaskRect();
      draw();
    });
  };
  if (reduced && maskEl)
    window.addEventListener("scroll", onScrollStatic, { passive: true });

  // the scene tells us when the land changes while nothing is animating
  const onHoleEvent = () => {
    updateHole();
    if (!running) draw();
  };
  if (useHole) window.addEventListener(LAND_HOLE_EVENT, onHoleEvent);

  const onVisibility = () => updateRunning();
  const onResize = () => scheduleRebuild();
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("resize", onResize, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready
      .then(scheduleRebuild)
      .catch((err) => console.error("[dotField] fonts.ready failed:", err));
  }

  const onLost = (e: Event) => {
    e.preventDefault();
    glReady = false;
    setMaskOff();
    updateRunning();
  };
  const onRestored = () => {
    layoutKey = "";
    maskKey = "";
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
      if (isOverlay) changeOverlay(-1);
      else overlayListeners.delete(onOverlayChange);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      window.removeEventListener("scroll", onScrollStatic);
      window.removeEventListener(LAND_HOLE_EVENT, onHoleEvent);
      showMaskEl();
      if (bridge) setGravityBridge(null);
      if (glReady) {
        if (staticBuf) gl.deleteBuffer(staticBuf);
        if (waveBuf) gl.deleteBuffer(waveBuf);
        if (maskTex) gl.deleteTexture(maskTex);
        if (program) gl.deleteProgram(program);
      }
      glReady = false;
    },
  };
}
