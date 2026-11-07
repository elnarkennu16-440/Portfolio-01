/* ────────────────────────────────────────────────────────────────────────────
 * ABOUT SCENE ENGINE (WebGL2, no libraries)
 *
 * One <canvas>, ~35 draw calls, real depth buffer. Light + dark look, a camera
 * that is driven by SCROLL (so it connects with the Hero: the high Hero view
 * dollies down into the street-level POV as About scrolls into place), and a
 * typing animation on the comment sign.
 *
 * Runs only while the section is on screen. Nothing here touches the DOM
 * except the one canvas.
 * ──────────────────────────────────────────────────────────────────────────── */

import {
  BILLBOARD,
  BUILDINGS,
  CAMERA,
  CARS,
  CARS_PORTRAIT_SCALE,
  CARS_RANGE,
  CAT,
  DUST,
  FOG,
  FOG_LIGHT,
  LAMP,
  LAND,
  LOOKS,
  Pose,
  SIGN,
  STREET,
  TIMELINE,
} from "./aboutSceneConfig";
import {
  Mat4,
  MeshBuilder,
  STRIDE,
  V3,
  around,
  clamp01,
  easeOut,
  easeOutBack,
  identity,
  lerp,
  lerp3,
  lookAt,
  makeProgram,
  mul,
  perspective,
  rotateX,
  rotateY,
  rotateZ,
  scale3,
  smooth,
  translate,
} from "./aboutGlUtils";
import { AboutCanvases, buildAboutCanvases } from "./aboutTextures";
import { CatGeo, buildCat } from "./aboutCat";
import {
  buildBillboard,
  buildBuilding,
  buildCar,
  buildCommentSign,
  buildDust,
  buildFloor,
  buildGround,
  buildLamp,
  buildLand,
  buildSignPosts,
} from "./aboutSceneParts";

export interface AboutInput {
  /** pointer, -1…1 */
  mx: number;
  my: number;
  /** 0 = About just peeking in from below, 1 = fully in place (set from scroll) */
  progress: number;
  /** true = dark look */
  dark: boolean;
}

export interface AboutController {
  dispose(): void;
}

/* ── LAND WAVES (gravity) — tweak freely ─────────────────────────────────
 * Only the land (the black squares on the near sidewalk) bends with the cursor, and the
 * cat sits on it and rides along. The road, cars, buildings, billboard, lamp and sign
 * never move. Units are metres. The same numbers are used by the shader and by the
 * cat, so they always agree. */
const WAVE_RIPPLES = 12; // must match uRip[12] in the shader
const LW = {
  depth: 0.5, // how deep the land sinks under the cursor
  sigma: 1.8, // width of that dip
  slide: 1.0, // how far the lines slide toward the cursor
  speed: 2.3, // ripple speed (m/s)
  width: 1.0, // ripple width
  amp: 0.45, // ripple height at full strength
  decay: 0.8,
  eps: 0.25, // step used to measure the slope
  glide: 7, // cursor smoothing (higher = quicker)
  life: 4.5, // seconds a ripple lives
  limit: 60, // keeps the pointer position inside a sane range
  glow: 2.2, // how much the lines light up where the land is bent
  catSlide: 0.3, // the cat barely slides (it stays where it sits)
  catTilt: 16, // how much the cat leans with the slope
};
const f3 = (n: number) => n.toFixed(3);

/* ── shaders ────────────────────────────────────────────────────────────── */
const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aUV;
layout(location=2) in vec4 aCol;
layout(location=3) in vec2 aExtra;
uniform mat4 uVP;
uniform mat4 uLocal;
uniform vec3 uEye;
uniform float uPoint;
uniform float uWave;     // 1 only for the land
uniform vec4 uWell;      // cursor "mass": x, z, depth, sigma (metres)
uniform vec4 uRip[${WAVE_RIPPLES}];   // ripples: x, z, age (s), strength
uniform float uSlide;
out vec2 vUV;
out vec4 vCol;
out float vDist;
out float vKind;
out float vGlow;

/* the land starts after the road; far away it fades back to still */
float landMask(vec2 q) {
  float m = smoothstep(${f3(LAND.split)}, ${f3(LAND.split + 0.9)}, q.y);
  m *= 1.0 - smoothstep(30.0, 44.0, abs(q.x));
  m *= 1.0 - smoothstep(18.0, 25.0, q.y);
  return m;
}
float landH(vec2 q) {
  vec2 d = q - uWell.xy;
  float h = -uWell.z * exp(-dot(d, d) / (2.0 * uWell.w * uWell.w));
  for (int i = 0; i < ${WAVE_RIPPLES}; i++) {
    vec4 r = uRip[i];
    if (r.w > 0.001) {
      float f = length(q - r.xy) - ${f3(LW.speed)} * r.z;
      h += r.w * ${f3(LW.amp)} * exp(-r.z * ${f3(LW.decay)}) * exp(-(f * f) / (2.0 * ${f3(LW.width)} * ${f3(LW.width)})) * cos(f / ${f3(LW.width)} * 1.7);
    }
  }
  return h;
}

void main() {
  vec4 wp = uLocal * vec4(aPos, 1.0);
  float glow = 0.0;
  if (uWave > 0.5) {
    float mk = landMask(wp.xz);
    if (mk > 0.001) {
      float h0 = landH(wp.xz);
      float gx = landH(wp.xz + vec2(${f3(LW.eps)}, 0.0)) - landH(wp.xz - vec2(${f3(LW.eps)}, 0.0));
      float gz = landH(wp.xz + vec2(0.0, ${f3(LW.eps)})) - landH(wp.xz - vec2(0.0, ${f3(LW.eps)}));
      wp.xz -= vec2(gx, gz) / ${f3(LW.eps * 2)} * uSlide * mk;   // downhill = toward the cursor (magnet)
      wp.y += (h0 > 0.0 ? h0 * 0.35 : h0) * mk;                  // sinks away from you, rises only a little
      glow = clamp(abs(h0) * mk / ${f3(LW.amp)}, 0.0, 1.0);
    }
  }
  vGlow = glow;
  gl_Position = uVP * wp;
  gl_PointSize = uPoint;
  vUV = aUV;
  vCol = aCol;
  vDist = length(wp.xyz - uEye);
  vKind = aExtra.x;
}`;

const FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform float uUseTex;
uniform float uAlpha;
uniform float uFade;
uniform vec3 uBg;
uniform vec3 uFadeTo;
uniform vec2 uFog;
uniform float uLook;
uniform float uPass;
uniform vec4 uType;
uniform float uTypeOn;
uniform float uBlink;
uniform float uPointMode;
uniform vec2 uRemap;
uniform float uGlowK;
in vec2 vUV;
in vec4 vCol;
in float vDist;
in float vKind;
in float vGlow;
out vec4 outColor;
void main() {
  vec4 c = vCol;
  if (uUseTex > 0.5) c *= texture(uTex, vUV);

  if (uPointMode > 0.5) {
    float d = length(gl_PointCoord - 0.5);
    c.a *= smoothstep(0.5, 0.05, d);
  }

  // comment-sign typing: lines above the caret are shown, the caret line up to x
  if (uTypeOn > 0.5) {
    float li = floor((vUV.y - uType.z) / uType.w);
    float full = step(li + 0.5, uType.x);
    float part = step(abs(li - uType.x), 0.5) * step(vUV.x, uType.y);
    c.a *= max(full, part);
    float caret = step(abs(li - uType.x), 0.5) * step(abs(vUV.x - uType.y), 0.0018) * uBlink;
    c = mix(c, vec4(0.93, 0.93, 0.95, 1.0), caret);
  }

  // light look: ONLY the street + floor turn light (they carry their own remap: colour × x + y).
  // Buildings, billboard, cat and sign are not touched, so they stay black / grey on the white world.
  c.rgb *= 1.0 + vGlow * uGlowK; // the land lines light up where it is bent
  c.rgb = mix(c.rgb, c.rgb * uRemap.x + uRemap.y, uLook);
  // floating dust: white on the night look, soft grey on the white look
  if (uPass > 2.5) c.rgb = mix(c.rgb, vec3(0.42, 0.42, 0.47), uLook);

  float fog = smoothstep(uFog.x, uFog.y, vDist) * 0.92;
  vec3 rgb = mix(c.rgb, uBg, fog);
  rgb = mix(uFadeTo, rgb, uFade);
  float a = c.a * uAlpha;
  if (uPass > 1.5 && uPass < 2.5) a *= mix(1.0, 0.7, uLook); // glow is a little quieter on the light look
  outColor = vec4(rgb, a);
}`;

/* ── a drawable thing ───────────────────────────────────────────────────── */
interface Frame {
  m: Mat4;
  fade?: number; // 0 = hidden, 1 = shown (opaque things)
  alpha?: number; // see-through things
}
interface Item {
  vao: WebGLVertexArrayObject;
  count: number;
  tex: WebGLTexture | null;
  pass: 0 | 1 | 2 | 3; // solid, see-through, additive glow, points
  fadeTo?: V3; // colour an item fades up from (default: the background)
  typed?: boolean;
  /** light look colour remap (colour × x + y). Default [1, 0] = unchanged. */
  remap?: [number, number];
  /** the land: bends with the cursor (gravity waves) */
  wave?: boolean;
  upd: (t: number) => Frame | null;
}

const ID = identity();

/** inverse of a 4x4 matrix (column-major) */
function invert4(m: Mat4): Mat4 | null {
  const a00 = m[0],
    a01 = m[1],
    a02 = m[2],
    a03 = m[3];
  const a10 = m[4],
    a11 = m[5],
    a12 = m[6],
    a13 = m[7];
  const a20 = m[8],
    a21 = m[9],
    a22 = m[10],
    a23 = m[11];
  const a30 = m[12],
    a31 = m[13],
    a32 = m[14],
    a33 = m[15];
  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;
  let det =
    b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) return null;
  det = 1 / det;
  const o = new Float32Array(16);
  o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return o;
}

/** screen point (css px) → point on the ground (y = 0) under it, or null if it looks above the horizon */
function pickGround(
  inv: Mat4,
  sx: number,
  sy: number,
  W: number,
  H: number,
): [number, number] | null {
  const nx = (sx / W) * 2 - 1;
  const ny = 1 - (sy / H) * 2;
  const at = (z: number): V3 => {
    const w = inv[3] * nx + inv[7] * ny + inv[11] * z + inv[15];
    return [
      (inv[0] * nx + inv[4] * ny + inv[8] * z + inv[12]) / w,
      (inv[1] * nx + inv[5] * ny + inv[9] * z + inv[13]) / w,
      (inv[2] * nx + inv[6] * ny + inv[10] * z + inv[14]) / w,
    ];
  };
  const a = at(-1);
  const b = at(1);
  const t = a[1] / (a[1] - b[1]);
  if (!isFinite(t) || t < 0) return null;
  return [a[0] + (b[0] - a[0]) * t, a[2] + (b[2] - a[2]) * t];
}

/* ── controller ─────────────────────────────────────────────────────────── */
export function createAboutScene(
  canvas: HTMLCanvasElement,
  opts: { lite: boolean; input: { current: AboutInput } },
): AboutController | null {
  const gl = canvas.getContext("webgl2", {
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;
  const { lite, input } = opts;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let disposed = false;
  let visible = true;
  let raf = 0;
  let W = 1;
  let H = 1;
  let portrait = false;
  let t0 = -1;
  let built = false;
  let lastDraw = 0;
  const cur = {
    mx: 0,
    my: 0,
    p: input.current.progress,
    look: input.current.dark ? 0 : 1,
  };

  /* land waves: pointer over the section + the ripples it drops */
  const wIn = {
    px: 0,
    py: 0,
    hover: false,
    kicks: [] as { x: number; y: number }[],
  };
  const ripBuf = new Float32Array(WAVE_RIPPLES * 4); // x, z, age, strength
  const rips = Array.from({ length: WAVE_RIPPLES }, () => ({
    x: 0,
    z: 0,
    born: -1e9,
    amp: 0,
  }));
  let ripNext = 0;
  const wv = {
    x: 0,
    z: 0,
    lx: 0,
    lz: 0,
    has: false,
    amt: 0,
    lastEmit: -9,
    lastNow: 0,
  };
  let waveLive = false;
  const emitRipple = (x: number, z: number, amp: number, nowS: number) => {
    const r = rips[ripNext];
    ripNext = (ripNext + 1) % WAVE_RIPPLES;
    r.x = x;
    r.z = z;
    r.born = nowS;
    r.amp = amp;
  };
  const clampW = (v: number) => Math.max(-LW.limit, Math.min(LW.limit, v));
  /** same land maths as the shader, for the cat sitting on it */
  const landMaskCpu = (x: number, z: number) => {
    const ss = (a: number, b: number, v: number) => {
      const t = clamp01((v - a) / (b - a));
      return t * t * (3 - 2 * t);
    };
    return (
      ss(LAND.split, LAND.split + 0.9, z) *
      (1 - ss(30, 44, Math.abs(x))) *
      (1 - ss(18, 25, z))
    );
  };
  const landHCpu = (x: number, z: number) => {
    const d2 = (x - wv.x) ** 2 + (z - wv.z) ** 2;
    let h = -LW.depth * wv.amt * Math.exp(-d2 / (2 * LW.sigma * LW.sigma));
    for (let i = 0; i < WAVE_RIPPLES; i++) {
      const s = ripBuf[i * 4 + 3];
      if (s > 0.001) {
        const age = ripBuf[i * 4 + 2];
        const f =
          Math.hypot(x - ripBuf[i * 4], z - ripBuf[i * 4 + 1]) - LW.speed * age;
        h +=
          s *
          LW.amp *
          Math.exp(-age * LW.decay) *
          Math.exp(-(f * f) / (2 * LW.width * LW.width)) *
          Math.cos((f / LW.width) * 1.7);
      }
    }
    return h;
  };
  /** how the land moves the cat: it rides up / down with it and leans a little, but stays where it sits */
  const catLand = (cx: number, cz: number): Mat4 => {
    if (!waveLive) return ID;
    const mk = landMaskCpu(cx, cz);
    if (mk < 0.001) return ID;
    const e = LW.eps;
    const h0 = landHCpu(cx, cz);
    const sx = (landHCpu(cx + e, cz) - landHCpu(cx - e, cz)) / (2 * e);
    const sz = (landHCpu(cx, cz + e) - landHCpu(cx, cz - e)) / (2 * e);
    const y = (h0 > 0 ? h0 * 0.35 : h0) * mk;
    const dx = -sx * LW.slide * mk * LW.catSlide;
    const dz = -sz * LW.slide * mk * LW.catSlide;
    const lim = (v: number) => Math.max(-6, Math.min(6, v));
    const roll = lim(Math.atan(sx * mk) * (180 / Math.PI) * (LW.catTilt / 16));
    const pitch = lim(Math.atan(sz * mk) * (180 / Math.PI) * (LW.catTilt / 16));
    return mul(
      translate(dx, y, dz),
      around([cx, 0, cz], mul(rotateX(-pitch), rotateZ(roll))),
    );
  };

  let program: WebGLProgram | null = null;
  let items: Item[] = [];
  let textures: WebGLTexture[] = [];
  let buffers: WebGLBuffer[] = [];
  let vaos: WebGLVertexArrayObject[] = [];
  let white: WebGLTexture | null = null;
  let layout: AboutCanvases["sign"] | null = null;
  const U: Record<string, WebGLUniformLocation | null> = {};

  /* ── GPU resources ────────────────────────────────────────────────────── */
  const tex = (c: HTMLCanvasElement, repeat = false) => {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    const ext = gl.getExtension("EXT_texture_filter_anisotropic");
    if (ext) {
      const max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
      gl.texParameterf(
        gl.TEXTURE_2D,
        ext.TEXTURE_MAX_ANISOTROPY_EXT,
        Math.min(lite ? 4 : 8, max),
      );
    }
    textures.push(t);
    return t;
  };

  const mesh = (mb: MeshBuilder) => {
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mb.data), gl.STATIC_DRAW);
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const f = 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, STRIDE * f, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, STRIDE * f, 3 * f);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, STRIDE * f, 5 * f);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, STRIDE * f, 9 * f);
    gl.bindVertexArray(null);
    buffers.push(buf);
    vaos.push(vao);
    return { vao, count: mb.data.length / STRIDE };
  };

  /* ── animation helpers (t = seconds since the reveal started) ─────────── */
  const prog = (t: number, delay: number, dur: number) => (t - delay) / dur;

  /** grows out of the ground (the floor hides the part that is still below it) */
  type Base = Mat4 | (() => Mat4);
  const baseOf = (b: Base) => (typeof b === "function" ? b() : b);
  const rise =
    (delay: number, dur: number, sink: number, base: Base = ID) =>
    (t: number): Frame | null => {
      const p = prog(t, delay, dur);
      if (p <= 0) return null;
      return {
        m: mul(baseOf(base), translate(0, -sink * (1 - easeOut(p)), 0)),
        fade: clamp01(p * 2.2),
      };
    };
  const fadeIn =
    (delay: number, dur: number, base: Base = ID) =>
    (t: number): Frame | null => {
      const p = prog(t, delay, dur);
      if (p <= 0) return null;
      return { m: baseOf(base), fade: smooth(p), alpha: smooth(p) };
    };
  /** how much an object should lean to face the camera (phones: the camera looks down on them) */
  const facing = (objY: number, objZ: number, end: Pose) =>
    (Math.atan2(end.eye[1] - objY, end.eye[2] - objZ) * 180) / Math.PI;

  /* ── build the whole scene ────────────────────────────────────────────── */
  function build(c: AboutCanvases, catGeo: CatGeo) {
    program = makeProgram(gl!, VS, FS);
    for (const n of [
      "uVP",
      "uLocal",
      "uEye",
      "uPoint",
      "uTex",
      "uUseTex",
      "uAlpha",
      "uFade",
      "uBg",
      "uFadeTo",
      "uFog",
      "uLook",
      "uPass",
      "uType",
      "uTypeOn",
      "uBlink",
      "uPointMode",
      "uRemap",
      "uWave",
      "uWell",
      "uRip",
      "uSlide",
      "uGlowK",
    ]) {
      U[n] = gl!.getUniformLocation(program, n);
    }
    const wc = document.createElement("canvas");
    wc.width = wc.height = 2;
    const wg = wc.getContext("2d")!;
    wg.fillStyle = "#fff";
    wg.fillRect(0, 0, 2, 2);
    white = tex(wc);

    const glowT = tex(c.glow);
    const reflT = tex(c.reflection);
    items = [];
    const add = (
      mb: MeshBuilder,
      texture: WebGLTexture | null,
      pass: Item["pass"],
      upd: Item["upd"],
      extra: Partial<Item> = {},
    ) => items.push({ ...mesh(mb), tex: texture, pass, upd, ...extra });

    const T = TIMELINE;
    const lampX = LAMP.x;
    void lampX;

    /* floor + street */
    // light look: the plain floor becomes white, the street texture becomes light grey
    // (dark sidewalk → near-white, dark asphalt → light grey, white markings stay white)
    add(buildFloor(), null, 0, fadeIn(T.ground.delay, T.ground.dur), {
      remap: [0, 1],
    });
    const groundT = tex(c.ground);
    add(buildGround(), groundT, 0, fadeIn(T.ground.delay, T.ground.dur), {
      remap: [2.1, 0.58],
    });
    // the land (near sidewalk, black squares). Light look: it turns near-white with grey lines.
    add(buildLand(lite), groundT, 0, fadeIn(T.ground.delay, T.ground.dur), {
      remap: [-2.4, 0.99],
      wave: true,
    });

    /* buildings */
    const blds = BUILDINGS.filter((b) => !(lite && b.skipOnLite));
    blds.forEach((b, i) => {
      const g = buildBuilding(b);
      const r = rise(b.delay, 1.5, b.h + 2);
      add(g.front, tex(c.walls[i].front), 0, r);
      add(g.side, tex(c.walls[i].side), 0, r);
      add(g.top, null, 0, r);
    });

    /* GitHub billboard */
    {
      const bb = BILLBOARD;
      const pb = portrait ? bb.portrait : null;
      const sc = pb ? pb.scale : 1;
      const lift = pb ? pb.lift : 0;
      const bx = pb ? pb.x : bb.x;
      const bz = pb ? pb.z : bb.z;
      const byaw = pb ? pb.yaw : bb.yaw;
      // phones: the board leans back a little so it faces the camera (straight, not skewed)
      const cy = (bb.yBottom + lift + bb.h / 2) * sc;
      const tilt = pb ? facing(cy, bz, CAMERA.endPortrait) : 0;
      const base = () =>
        mul(
          translate(bx, 0, bz),
          mul(
            rotateY(byaw),
            mul(
              around([0, cy, 0], rotateX(-tilt * smooth(cur.p))),
              scale3(sc, sc, sc),
            ),
          ),
        );
      const geo = buildBillboard(lift);
      const r = rise(TIMELINE.billboard.delay, TIMELINE.billboard.dur, 7, base);
      add(geo.frame, null, 0, r);
      // the screen: dark while the board rises, then switches on (with a short flicker)
      add(
        geo.panel,
        tex(c.board),
        0,
        (t) => {
          const f = r(t);
          if (!f) return null;
          const on = prog(t, TIMELINE.billboardOn, 0.9);
          const flick =
            on < 0
              ? 0
              : on < 1
                ? Math.sin(on * 38) > -0.2
                  ? smooth(on)
                  : 0.15
                : 1;
          return { m: f.m, fade: (f.fade ?? 1) * flick };
        },
        { fadeTo: [0.025, 0.025, 0.03] },
      );
      add(geo.beams, null, 2, (t) => {
        const f = r(t);
        if (!f) return null;
        const on = prog(t, TIMELINE.billboardOn, 1.2);
        return on <= 0 ? null : { m: f.m, alpha: smooth(on) };
      });
    }

    /* street lamp + wet reflection */
    {
      const lamp = buildLamp();
      // light look: pole + lamp head get darker so they still show on white
      add(lamp.pole, null, 0, rise(1.2, 1.2, 9), { remap: [0.55, 0] });
      const lampOn = (t: number): Frame | null => {
        const p = prog(t, TIMELINE.lampOn, 1.4);
        if (p <= 0) return null;
        const flick = p < 0.5 ? (Math.sin(p * 60) > -0.1 ? 1 : 0.2) : 1;
        return { m: ID, alpha: smooth(p) * flick };
      };
      add(lamp.beam, null, 2, lampOn);
      add(lamp.pool, glowT, 2, lampOn);
      add(lamp.streak, reflT, 2, lampOn);
    }

    /* comment sign + cat (the layout of the sign text decides the typing) */
    layout = c.sign;
    {
      const sx = portrait ? SIGN.portrait.x : SIGN.x;
      const sy = portrait ? SIGN.portrait.y : SIGN.y;
      const sw = portrait ? SIGN.portrait.w : SIGN.w;
      const sh = portrait ? SIGN.portrait.h : SIGN.h;
      const geo = buildCommentSign(
        sw,
        sh,
        portrait ? SIGN.portrait.tailX : SIGN.tailX,
      );
      const tip = geo.tip;
      const sz = portrait ? SIGN.portrait.z : SIGN.z;
      const syaw = portrait ? SIGN.portrait.yaw : SIGN.yaw;
      // phones: the sign faces the camera exactly (level, not tilted)
      const stilt = portrait ? facing(sy, sz, CAMERA.endPortrait) : 0;
      const place = () =>
        mul(
          translate(sx, sy, sz),
          mul(rotateY(syaw), rotateX(-stilt * smooth(cur.p))),
        );
      const sign = (t: number): Frame | null => {
        const p = prog(t, TIMELINE.sign.delay, TIMELINE.sign.dur);
        if (p <= 0) return null;
        const s = lerp(0.15, 1, easeOutBack(p));
        const bob = Math.sin(t * 0.8) * 0.05;
        const pop = around(tip, scale3(s, s, s));
        return {
          m: mul(translate(0, bob, 0), mul(place(), pop)),
          fade: clamp01(p * 2.4),
          alpha: clamp01(p * 2.4),
        };
      };
      add(geo.body, null, 0, sign);
      add(geo.text, tex(c.sign.canvas), 1, sign, { typed: true });
      add(
        buildSignPosts(sx, sy - sh / 2 - SIGN.tailLen * 0.2, sz, sw),
        null,
        0,
        rise(TIMELINE.sign.delay, 1.0, 6),
      );
    }

    {
      const cat = catGeo;
      const cx = portrait ? CAT.portraitX : CAT.x;
      const cz = portrait ? CAT.portraitZ : CAT.z;
      const k = portrait ? CAT.portraitScale : CAT.scale;
      const cyaw = portrait ? CAT.portraitYaw : CAT.yaw;
      const base0 = mul(
        translate(cx, 0, cz),
        mul(rotateY(cyaw), scale3(k, k, k)),
      );
      const appear = (t: number): Frame | null => {
        const p = prog(t, TIMELINE.cat.delay, TIMELINE.cat.dur);
        if (p <= 0) return null;
        return {
          // the cat sits on the land: it follows the waves (see catLand)
          m: mul(
            mul(catLand(cx, cz), base0),
            translate(0, -0.5 * (1 - easeOut(p)), 0),
          ),
          fade: smooth(p * 1.4),
        };
      };
      add(cat.body, null, 0, appear);
      add(cat.head, null, 0, (t) => {
        const f = appear(t);
        if (!f) return null;
        const turn = Math.sin(t * 0.5) * 7 + Math.sin(t * 0.17) * 3;
        const tilt = Math.sin(t * 0.37 + 1) * 2.5;
        return {
          m: mul(f.m, around(cat.headPivot, mul(rotateY(turn), rotateZ(tilt)))),
          fade: f.fade,
        };
      });
      // eyes: light up after the cat has appeared, blink now and then
      add(
        cat.eyes,
        null,
        0,
        (t) => {
          const f = appear(t);
          if (!f) return null;
          const on = prog(t, TIMELINE.cat.delay + 0.9, 0.5);
          if (on <= 0) return null;
          const turn = Math.sin(t * 0.5) * 7 + Math.sin(t * 0.17) * 3;
          const tilt = Math.sin(t * 0.37 + 1) * 2.5;
          const ph = (t % 4.6) / 4.6;
          const blink =
            ph > 0.94 ? Math.max(0.05, Math.abs(ph - 0.97) / 0.03) : 1;
          const lid = around(cat.eyesPivot, scale3(1, blink, 1));
          return {
            m: mul(
              f.m,
              mul(
                around(cat.headPivot, mul(rotateY(turn), rotateZ(tilt))),
                lid,
              ),
            ),
            fade: smooth(on),
          };
        },
        { fadeTo: [0.02, 0.02, 0.02] },
      );
      add(cat.tail, null, 0, (t) => {
        const f = appear(t);
        if (!f) return null;
        const sway = Math.sin(t * 1.1) * 6 + Math.sin(t * 0.43) * 3;
        return {
          m: mul(f.m, around(cat.tailPivot, rotateY(sway * 0.8))),
          fade: f.fade,
        };
      });
    }

    /* cars driving by */
    {
      CARS.forEach((cr, i) => {
        const car = buildCar(cr.len, cr.tone);
        const flip = cr.dir < 0 ? -1 : 1;
        const move = (t: number): Frame | null => {
          const p = prog(t, TIMELINE.cars + i * 1.2, 0.8);
          if (p <= 0) return null;
          const range = CARS_RANGE;
          const x =
            ((((cr.x0 + range / 2 + cr.dir * cr.speed * (t - TIMELINE.cars)) %
              range) +
              range) %
              range) -
            range / 2;
          const k = portrait ? CARS_PORTRAIT_SCALE : 1;
          return {
            m: mul(translate(x, 0, cr.lane), scale3(flip * k, k, k)),
            fade: 1,
          };
        };
        add(car.body, null, 0, move);
        add(car.lights, null, 0, move);
      });
    }

    /* dust / stars */
    add(buildDust(lite ? DUST.liteCount : DUST.count), null, 3, (t) => {
      const p = prog(t, 0.8, 2);
      if (p <= 0) return null;
      return {
        m: translate(0, Math.sin(t * 0.12) * 0.4, Math.cos(t * 0.09) * 0.3),
        alpha: smooth(p),
      };
    });
  }

  /* ── drawing ──────────────────────────────────────────────────────────── */
  function poseFor(
    p: number,
    aspect: number,
  ): { eye: V3; target: V3; fov: number } {
    const end: Pose = portrait ? CAMERA.endPortrait : CAMERA.end;
    const a = CAMERA.start;
    const e = smooth(p);
    let eye = lerp3(a.eye, end.eye, e);
    let target = lerp3(a.target, end.target, e);
    const base = lerp(a.fov, end.fov, e);
    // keep the horizontal view wide enough on narrow screens
    const minH = portrait ? CAMERA.minHFovPortrait : CAMERA.minHFov;
    const need =
      (2 * Math.atan(Math.tan((minH * Math.PI) / 360) / aspect) * 180) /
      Math.PI;
    const fov = Math.min(
      portrait ? CAMERA.maxFovPortrait : CAMERA.maxFov,
      Math.max(base, lerp(base, need, e)),
    );
    // pointer parallax (only when we are close to the street)
    eye = [eye[0] + cur.mx * 0.4 * e, eye[1] - cur.my * 0.14 * e, eye[2]];
    target = [target[0] + cur.mx * 0.3 * e, target[1], target[2]];
    return { eye, target, fov };
  }

  function draw(now: number) {
    const g = gl!;
    cur.mx += (input.current.mx - cur.mx) * 0.06;
    cur.my += (input.current.my - cur.my) * 0.06;
    cur.p += (input.current.progress - cur.p) * (reduced ? 1 : 0.14);
    cur.look += ((input.current.dark ? 0 : 1) - cur.look) * 0.12;

    const bgD = LOOKS.dark.bg;
    const bgL = LOOKS.light.bg;
    const bg: V3 = [
      lerp(bgD[0], bgL[0], cur.look) / 255,
      lerp(bgD[1], bgL[1], cur.look) / 255,
      lerp(bgD[2], bgL[2], cur.look) / 255,
    ];

    g.viewport(0, 0, canvas.width, canvas.height);
    g.clearColor(bg[0], bg[1], bg[2], 1);
    g.clear(g.COLOR_BUFFER_BIT | g.DEPTH_BUFFER_BIT);
    if (!program || !items.length) return;

    // the reveal starts the first time the section peeks into view
    if (t0 < 0) {
      if (cur.p > 0.04 || reduced) t0 = reduced ? now - 60_000 : now;
      else return;
    }
    const t = (now - t0) / 1000;

    const aspect = W / H;
    const pose = poseFor(cur.p, aspect);
    const vp = mul(
      perspective(pose.fov, aspect, CAMERA.near, CAMERA.far),
      lookAt(pose.eye, pose.target),
    );

    /* ── land waves: cursor → point on the ground, a soft well that follows it,
       and ripples dropped while it moves / when you click or tap ── */
    const nowS = now / 1000;
    const dtW = Math.min(0.1, Math.max(0, nowS - wv.lastNow));
    wv.lastNow = nowS;
    if (!reduced && (wIn.hover || wIn.kicks.length)) {
      const inv = invert4(vp);
      if (inv) {
        if (wIn.hover) {
          const gp = pickGround(inv, wIn.px, wIn.py, W, H);
          if (gp) {
            const gx = clampW(gp[0]);
            const gz = clampW(gp[1]);
            if (!wv.has || wv.amt < 0.05) {
              wv.x = wv.lx = gx;
              wv.z = wv.lz = gz;
              wv.has = true;
            }
            const f = 1 - Math.exp(-dtW * LW.glide);
            wv.x += (gx - wv.x) * f;
            wv.z += (gz - wv.z) * f;
            wv.amt += (1 - wv.amt) * (1 - Math.exp(-dtW * 4));
            const moved = Math.hypot(wv.x - wv.lx, wv.z - wv.lz);
            if (moved > 0.9 && nowS - wv.lastEmit > 0.26) {
              emitRipple(wv.x, wv.z, 0.25 + Math.min(0.35, moved / 8), nowS);
              wv.lx = wv.x;
              wv.lz = wv.z;
              wv.lastEmit = nowS;
            }
          } else {
            wv.amt *= Math.exp(-dtW * 2.5);
          }
        } else {
          wv.amt *= Math.exp(-dtW * 2.5);
        }
        if (wIn.kicks.length) {
          for (const k of wIn.kicks.splice(0, 3)) {
            const gp = pickGround(inv, k.x, k.y, W, H);
            if (gp) emitRipple(clampW(gp[0]), clampW(gp[1]), 1, nowS);
          }
        }
      }
    } else {
      wv.amt *= Math.exp(-dtW * 2.5);
      wIn.kicks.length = 0;
    }
    if (wv.amt < 0.004) wv.amt = 0;
    waveLive = wv.amt > 0;
    for (let i = 0; i < WAVE_RIPPLES; i++) {
      const r = rips[i];
      const age = nowS - r.born;
      const live = r.amp > 0 && age >= 0 && age < LW.life;
      ripBuf[i * 4] = r.x;
      ripBuf[i * 4 + 1] = r.z;
      ripBuf[i * 4 + 2] = live ? age : 0;
      ripBuf[i * 4 + 3] = live ? r.amp : 0;
      if (live) waveLive = true;
    }

    g.useProgram(program);
    g.uniform1f(U.uSlide, LW.slide);
    g.uniform4f(U.uWell, wv.x, wv.z, LW.depth * wv.amt, LW.sigma);
    g.uniform4fv(U.uRip, ripBuf);
    g.uniform1f(U.uGlowK, LW.glow);
    g.uniformMatrix4fv(U.uVP, false, vp);
    g.uniform3f(U.uEye, pose.eye[0], pose.eye[1], pose.eye[2]);
    g.uniform3f(U.uBg, bg[0], bg[1], bg[2]);
    g.uniform2f(
      U.uFog,
      lerp(FOG.start, FOG_LIGHT.start, cur.look),
      lerp(FOG.end, FOG_LIGHT.end, cur.look),
    );
    g.uniform1f(U.uLook, cur.look);
    g.uniform1i(U.uTex, 0);
    g.uniform1f(U.uPoint, Math.max(1.5, (canvas.width / W) * 2.2));
    g.enable(g.DEPTH_TEST);
    g.depthFunc(g.LEQUAL);
    g.disable(g.CULL_FACE);

    // typing state for the comment sign
    let typeLine = 0;
    let typeX = 0;
    let typeOn = 0;
    if (layout) {
      const chars = Math.max(0, (t - TIMELINE.typeStart) * SIGN.charsPerSecond);
      let n = Math.floor(reduced ? 1e9 : chars);
      typeX = layout.x0;
      if (n >= layout.total) {
        typeLine = layout.lines.length + 1;
        typeX = 1;
      } else {
        let li = 0;
        while (li < layout.lines.length && n > layout.lines[li].text.length) {
          n -= layout.lines[li].text.length + 1;
          li++;
        }
        typeLine = li;
        const ln = layout.lines[Math.min(li, layout.lines.length - 1)];
        typeX = n <= 0 ? layout.x0 : ln.ends[Math.min(n, ln.ends.length) - 1];
      }
      typeOn = 1;
    }
    const typing = !!layout && typeLine <= layout.lines.length;
    const caret =
      typing && t > TIMELINE.sign.delay + 0.6 && Math.floor(t * 2.2) % 2 === 0
        ? 1
        : 0;
    g.uniform1f(U.uBlink, caret);

    for (let pass = 0; pass < 4; pass++) {
      if (pass === 0) {
        g.disable(g.BLEND);
        g.depthMask(true);
      } else {
        g.enable(g.BLEND);
        g.depthMask(false);
        // glow (pass 2) is additive; see-through (1) and dust (3) use normal blending so the
        // dust stays visible on the white look (white-on-white additive would vanish)
        g.blendFunc(g.SRC_ALPHA, pass === 2 ? g.ONE : g.ONE_MINUS_SRC_ALPHA);
      }
      g.uniform1f(U.uPass, pass);
      g.uniform1f(U.uPointMode, pass === 3 ? 1 : 0);
      for (const it of items) {
        if (it.pass !== pass) continue;
        const f = it.upd(t);
        if (!f) continue;
        const fade = f.fade ?? 1;
        const alpha = f.alpha ?? 1;
        if (pass === 0 ? fade <= 0.002 : alpha <= 0.002) continue;
        g.uniformMatrix4fv(U.uLocal, false, f.m);
        g.uniform1f(U.uWave, it.wave && waveLive ? 1 : 0);
        g.activeTexture(g.TEXTURE0);
        g.bindTexture(g.TEXTURE_2D, it.tex ?? white);
        g.uniform1f(U.uUseTex, it.tex ? 1 : 0);
        const rm = it.remap ?? [1, 0];
        g.uniform2f(U.uRemap, rm[0], rm[1]);
        const ft = it.fadeTo ?? bg;
        g.uniform3f(U.uFadeTo, ft[0], ft[1], ft[2]);
        g.uniform1f(U.uFade, pass === 0 ? fade : 1);
        g.uniform1f(U.uAlpha, pass === 0 ? 1 : alpha);
        g.uniform1f(U.uTypeOn, it.typed ? typeOn : 0);
        if (it.typed)
          g.uniform4f(U.uType, typeLine, typeX, layout!.topUV, layout!.lineHUV);
        g.bindVertexArray(it.vao);
        g.drawArrays(pass === 3 ? g.POINTS : g.TRIANGLES, 0, it.count);
      }
    }
    g.bindVertexArray(null);
  }

  /* ── loop: only while the section is on screen ────────────────────────── */
  const frame = (now: number) => {
    raf = 0;
    if (disposed || !visible) return;
    if (lite && now - lastDraw < 30) {
      raf = requestAnimationFrame(frame);
      return;
    }
    lastDraw = now;
    draw(now);
    if (!reduced) raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (!raf && visible && !disposed) raf = requestAnimationFrame(frame);
  };

  /* ── size ─────────────────────────────────────────────────────────────── */
  const resize = () => {
    const r = (canvas.parentElement ?? canvas).getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    const wasPortrait = portrait;
    portrait = W / H < 1.1;
    let dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2);
    dpr = Math.min(dpr, Math.sqrt(4_200_000 / (W * H)));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    if (wasPortrait !== portrait && (built || building)) {
      built = false;
      building = false;
      rebuild().catch(() => undefined); // different bubble + cat spot for portrait
    }
    if (reduced) draw(performance.now());
    start();
  };
  let rt = 0;
  const onResize = () => {
    window.clearTimeout(rt);
    rt = window.setTimeout(resize, 90);
  };
  const ro =
    typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
  ro?.observe(canvas.parentElement ?? canvas);

  const io =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([e]) => {
          visible = e.isIntersecting && !document.hidden;
          if (visible) {
            ensureBuilt();
            start();
          }
        })
      : null;
  io?.observe(canvas);
  const onVis = () => {
    visible = !document.hidden;
    if (visible) start();
  };
  document.addEventListener("visibilitychange", onVis);

  /* land waves: pointer position over the About section (mouse hover, or a tap / touch) and
     clicks / taps that drop a stronger pulse. Passive: scrolling is never blocked. */
  const waveHost =
    (canvas.closest("section") as HTMLElement | null) ?? canvas.parentElement;
  const waveLocal = (e: PointerEvent) => {
    const r = (canvas.parentElement ?? canvas).getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onWaveMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const p = waveLocal(e);
    wIn.px = p.x;
    wIn.py = p.y;
    wIn.hover = true;
  };
  const onWaveDown = (e: PointerEvent) => {
    const p = waveLocal(e);
    wIn.px = p.x;
    wIn.py = p.y;
    wIn.hover = true;
    if (wIn.kicks.length < 6) wIn.kicks.push({ x: p.x, y: p.y });
  };
  const onWaveEnd = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") wIn.hover = false;
  };
  const onWaveLeave = () => {
    wIn.hover = false;
  };
  if (waveHost && !reduced) {
    waveHost.addEventListener("pointermove", onWaveMove, { passive: true });
    waveHost.addEventListener("pointerdown", onWaveDown, { passive: true });
    waveHost.addEventListener("pointerup", onWaveEnd, { passive: true });
    waveHost.addEventListener("pointercancel", onWaveEnd, { passive: true });
    waveHost.addEventListener("pointerleave", onWaveLeave, { passive: true });
  }

  const onLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const onRestored = () => rebuild();
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  function release() {
    textures.forEach((x) => gl!.deleteTexture(x));
    buffers.forEach((x) => gl!.deleteBuffer(x));
    vaos.forEach((x) => gl!.deleteVertexArray(x));
    if (program) gl!.deleteProgram(program);
    textures = [];
    buffers = [];
    vaos = [];
    items = [];
    program = null;
  }

  /* the textures are drawn in small steps, while the browser is idle (so the
     Hero intro is never disturbed) — or at once if About is already on screen */
  let building = false;
  let canvases: AboutCanvases | null = null;
  async function rebuild() {
    if (building) return;
    building = true;
    release();
    built = false;
    try {
      canvases = await buildAboutCanvases(lite, portrait);
      if (disposed) return;
      // the cat mesh is built once, in small steps (see aboutCat.ts)
      const catGeo = await buildCat(lite);
      if (disposed) return;
      build(canvases, catGeo);
      built = true;
      start();
    } finally {
      building = false;
    }
  }
  const ensureBuilt = () => {
    if (!built && !building && !disposed) rebuild().catch(() => undefined);
  };

  resize();
  type Idle = (cb: () => void, o?: { timeout: number }) => number;
  const ric = (window as unknown as { requestIdleCallback?: Idle })
    .requestIdleCallback;
  const idleTimer = ric
    ? ric(ensureBuilt, { timeout: 5000 })
    : window.setTimeout(ensureBuilt, 2500);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(rt);
      window.clearTimeout(idleTimer);
      const cic = (
        window as unknown as { cancelIdleCallback?: (n: number) => void }
      ).cancelIdleCallback;
      cic?.(idleTimer);
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      if (waveHost) {
        waveHost.removeEventListener("pointermove", onWaveMove);
        waveHost.removeEventListener("pointerdown", onWaveDown);
        waveHost.removeEventListener("pointerup", onWaveEnd);
        waveHost.removeEventListener("pointercancel", onWaveEnd);
        waveHost.removeEventListener("pointerleave", onWaveLeave);
      }
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      release();
    },
  };
}
