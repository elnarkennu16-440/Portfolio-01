/* ────────────────────────────────────────────────────────────────────────────
 * HIGHLIGHT SCENE ENGINE (WebGL2, no libraries)
 *
 * Built exactly like the hero engine (glScene.ts): one <canvas>, a real depth
 * buffer, the same camera maths (yaw / tilt / perspective), the same helper
 * file (HeroScene/glUtils.ts, imported, never edited) and the same grey look.
 *
 * Differences from the hero, on purpose:
 *  • the canvas is TRANSPARENT: the page background shows through, so it blends
 *    with whatever your site theme is.
 *  • the camera is fitted automatically: the scene is scaled so every tower and
 *    the arrow always fit the stage, on any screen size (desktop or phone).
 *  • it only renders while it is on screen, and it only builds its textures when
 *    the visitor is close to the section (nothing is paid at page load).
 *
 * THEME: follows the site theme like the hero ("kennu:themechange" + data-theme).
 * ──────────────────────────────────────────────────────────────────────────── */

import {
  HL_ARROW,
  HL_BARS,
  HL_CAMERA,
  HL_GRID,
  HL_SLAB,
  barRect,
  barTop,
  buildArrowPath,
  buildFitPoints,
} from "./highlightConfig";
import type { V3 } from "./highlightConfig";
import { buildHighlightCanvases } from "./highlightTextures";
import { LAND_HOLE_EVENT, setLandHole } from "../PreFooterDots/holeBridge";
import type { LandHole } from "../PreFooterDots/holeBridge";
import type { HighlightCanvases } from "./highlightTextures";
import {
  MeshBuilder,
  STRIDE,
  makeProgram,
  mul,
  rotateX,
  rotateZ,
  scaleUniform,
} from "../HeroScene/glUtils";
import type { Mat4, RGBA, V2 } from "../HeroScene/glUtils";

export interface HighlightInput {
  /** pointer position over the section, -1…1 */
  mx: number;
  my: number;
  /** pointer position over the stage (css px) and whether it is hovering / touching: drives the land waves */
  px?: number;
  py?: number;
  hover?: boolean;
  /** clicks / taps waiting to become a pulse on the land */
  kicks?: { x: number; y: number }[];
}

export interface HighlightController {
  dispose(): void;
}

type Theme = "dark" | "light";

/** same event name ThemeToggle dispatches (same as the hero) */
const THEME_EVENT = "kennu:themechange";

function readTheme(): Theme {
  const el = document.documentElement;
  const v =
    el.getAttribute("data-theme") ?? document.body?.getAttribute("data-theme");
  if (v === "dark" || v === "light") return v;
  if (el.classList.contains("dark")) return "dark";
  return "light";
}

/** colour multiplier per theme (light mode lifts the dark concrete like the hero does) */
const WALL_TINT: Record<Theme, V3> = {
  dark: [1, 1, 1],
  light: [1.65, 1.65, 1.65],
};
const SLAB_TINT: Record<Theme, V3> = {
  dark: [1, 1, 1],
  light: [4.4, 4.4, 4.5],
};
const LINE_TINT: Record<Theme, V3> = { dark: [1, 1, 1], light: [0, 0, 0] };
const ARROW_TINT: Record<Theme, V3> = {
  dark: [1, 1, 1],
  light: [0.1, 0.1, 0.11],
};

/* ── shaders ────────────────────────────────────────────────────────────── */
const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aUV;
layout(location=2) in vec4 aCol;
uniform mat4 uModel;
uniform float uZScale;
uniform vec3 uCam;   // perspective distance, anchor x, anchor y (css px)
uniform vec2 uView;  // stage size (css px)
uniform float uWave;     // 1 only for the ground grid (land); everything else stays still
uniform vec4 uWell;      // cursor "mass": x, y, depth, sigma (scene units)
uniform vec4 uRip[12];   // ripples: x, y, age (s), strength
uniform float uSlide;    // how far the land slides toward the cursor
out vec2 vUV;
out vec4 vCol;
out float vGlow;

/* height of the land at (x, y): a soft well under the cursor + slow expanding rings */
float landH(vec2 q) {
  vec2 d = q - uWell.xy;
  float h = -uWell.z * exp(-dot(d, d) / (2.0 * uWell.w * uWell.w));
  for (int i = 0; i < 12; i++) {
    vec4 r = uRip[i];
    if (r.w > 0.001) {
      float f = length(q - r.xy) - 300.0 * r.z;
      h += r.w * 70.0 * exp(-r.z * 0.85) * exp(-(f * f) / (2.0 * 160.0 * 160.0)) * cos(f / 160.0 * 1.7);
    }
  }
  return h;
}

void main() {
  vec3 p = aPos;
  p.z *= uZScale;
  float glow = 0.0;
  if (uWave > 0.5) {
    float h0 = landH(p.xy);
    float gx = landH(p.xy + vec2(40.0, 0.0)) - landH(p.xy - vec2(40.0, 0.0));
    float gy = landH(p.xy + vec2(0.0, 40.0)) - landH(p.xy - vec2(0.0, 40.0));
    p.xy -= vec2(gx, gy) / 80.0 * uSlide;      // downhill = toward the cursor (magnet)
    p.z += h0 > 0.0 ? h0 * 0.35 : h0;          // sinks away from you, rises only a little
    glow = clamp(abs(h0) / 70.0, 0.0, 1.0);
  }
  vGlow = glow;
  vec3 q = (uModel * vec4(p, 1.0)).xyz;
  float w = 1.0 - q.z / uCam.x;
  vec2 s = vec2(uCam.y, uCam.z) + q.xy / w;
  vec2 ndc = vec2(s.x / uView.x * 2.0 - 1.0, 1.0 - s.y / uView.y * 2.0);
  gl_Position = vec4(ndc * w, w - 0.1, w);
  vUV = aUV;
  vCol = aCol;
}`;

/* premultiplied-alpha output (the canvas is composited over the page) */
const FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform float uUseTex;
uniform float uAlpha;
uniform vec3 uTint;
in vec2 vUV;
in vec4 vCol;
in float vGlow;
out vec4 outColor;
void main() {
  vec4 c = vCol;
  if (uUseTex > 0.5) c *= texture(uTex, vUV);
  vec3 rgb = min(c.rgb * uTint, vec3(1.0));
  float a = min(c.a * uAlpha * (1.0 + vGlow * 2.4), 1.0);
  outColor = vec4(rgb * a, a);
}`;

/* ── helpers ────────────────────────────────────────────────────────────── */
const col = (n: number, a = 1): RGBA => [n / 255, n / 255, n / 255, a];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (p: number) => 1 - Math.pow(1 - clamp01(p), 4.5);
const smooth = (p: number) => {
  const x = clamp01(p);
  return x * x * (3 - 2 * x);
};

interface Anim {
  delay: number;
  dur: number;
}
interface Item {
  vao: WebGLVertexArrayObject;
  count: number;
  mode: number;
  tex: WebGLTexture | null;
  pass: 0 | 1; // 0 = solid (writes depth), 1 = see-through
  zs?: Anim; // tower grows out of the ground
  fade?: Anim;
  partial?: Anim; // ribbon is drawn piece by piece
  alphaBy?: Record<Theme, number>;
  tintBy?: Record<Theme, V3>;
  wave?: boolean; // the land: bends with the cursor (gravity waves)
}

interface View {
  k: number;
  ax: number;
  ay: number;
  yaw: number;
  tilt: number;
  persp: number;
}

/** one point → screen (css px), same maths as the vertex shader */
function project(
  M: Mat4,
  p: V3,
  persp: number,
  ax: number,
  ay: number,
): [number, number] {
  const x = M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12];
  const y = M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13];
  const z = M[2] * p[0] + M[6] * p[1] + M[10] * p[2] + M[14];
  const w = 1 - z / persp;
  return [ax + x / w, ay + y / w];
}

/** screen point (css px) → point on the horizontal plane z = zc of the scene (inverse of project) */
function unproject(
  M: Mat4,
  persp: number,
  ax: number,
  ay: number,
  sx: number,
  sy: number,
  zc: number,
): [number, number] {
  const a = M[0];
  const b = M[4];
  const c = M[1];
  const d = M[5];
  const bx = M[8] * zc + M[12];
  const by = M[9] * zc + M[13];
  const det = a * d - b * c || 1e-9;
  let w = 1;
  let x = 0;
  let y = 0;
  for (let i = 0; i < 6; i++) {
    const rx = (sx - ax) * w - bx;
    const ry = (sy - ay) * w - by;
    x = (d * rx - b * ry) / det;
    y = (-c * rx + a * ry) / det;
    const qz = M[2] * x + M[6] * y + M[10] * zc + M[14];
    w = 1 - qz / persp;
  }
  return [x, y];
}

/* ── LAND WAVES (gravity) — tweak freely ─────────────────────────────────
 * Only the ground grid moves. Towers, the grey slab, the arrow and the notes never do. */
const WAVE_RIPPLES = 12; // must match uRip[12] in the shader
const WAVE_DEPTH = 85; // how deep the land sinks under the cursor (scene units)
const WAVE_SIGMA = 230; // width of that dip
const WAVE_SLIDE = 110; // how far the lines slide toward the cursor (magnet feel)
const WAVE_GLIDE = 7; // cursor smoothing (higher = quicker, lower = softer)
const WAVE_LIFE = 4.5; // seconds a ripple lives
const WAVE_LIMIT = 3000; // keeps the pointer position inside a sane range

const FIT_POINTS = buildFitPoints();
const ANCHORS: V3[] = HL_BARS.map((_, i) => barTop(i));

/** timing of the reveal (seconds after it starts) */
const BAR_DELAY = 0.45;
const BAR_STEP = 0.2;
const BAR_DUR = 1.3;
const ARROW_DELAY = 0.9;
const ARROW_DUR = 2.6;

/** scale + position the scene so everything fits the stage (linear in k, see below) */
function computeView(W: number, H: number): View {
  const c = W < 700 ? HL_CAMERA.mobile : HL_CAMERA.desktop;
  const base = mul(rotateX(c.tilt), rotateZ(c.yaw));
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of FIT_POINTS) {
    const [x, y] = project(base, p, c.perspective, 0, 0);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const padL = W >= 1005 && c.wideLeft ? c.wideLeft : c.pad.l;
  const availW = Math.max(60, W - padL - c.pad.r);
  const availH = Math.max(60, H - c.pad.t - c.pad.b);
  /* scaling the model by k and the perspective distance by k scales the picture
     by exactly k, so the bounds measured at k = 1 can simply be multiplied */
  const k = Math.min(availW / (maxX - minX), availH / (maxY - minY));
  return {
    k,
    ax: padL + availW / 2 - (k * (minX + maxX)) / 2,
    ay: c.pad.t + availH / 2 - (k * (minY + maxY)) / 2,
    yaw: c.yaw,
    tilt: c.tilt,
    persp: c.perspective * k,
  };
}

/* ── controller ─────────────────────────────────────────────────────────── */
export function createHighlightScene(
  canvas: HTMLCanvasElement,
  opts: {
    lite: boolean;
    input: { current: HighlightInput };
    /** called after every frame: screen position (css px) of every tower roof + seconds since reveal */
    onFrame?: (xy: Float32Array, t: number) => void;
  },
): HighlightController | null {
  const ctx = canvas.getContext("webgl2", {
    antialias: true,
    alpha: true,
    premultipliedAlpha: true,
    powerPreference: "high-performance",
  });
  if (!ctx) return null;
  const gl: WebGL2RenderingContext = ctx;
  const { lite, input } = opts;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let disposed = false;
  let canvases: HighlightCanvases | null = null;
  let t0 = -1;
  let onScreen = false; // any part of the stage is on screen
  let visible = false; // on screen AND tab is shown (render loop runs only then)
  let inView = false; // enough on screen to start the reveal
  let raf = 0;
  let lastDraw = 0;
  let W = 1;
  let H = 1;
  let view: View = { k: 1, ax: 0, ay: 0, yaw: 46, tilt: 56, persp: 3200 };
  const cur = { mx: 0, my: 0 };
  const xy = new Float32Array(ANCHORS.length * 2);

  /* land waves state */
  const ripBuf = new Float32Array(WAVE_RIPPLES * 4); // x, y, age, strength
  const rips = Array.from({ length: WAVE_RIPPLES }, () => ({
    x: 0,
    y: 0,
    born: -1e9,
    amp: 0,
  }));
  let ripNext = 0;
  const wv = {
    x: 0,
    y: 0,
    lx: 0,
    ly: 0,
    has: false,
    amt: 0,
    lastEmit: -9,
    lastNow: 0,
  };
  const emitRipple = (x: number, y: number, amp: number, nowS: number) => {
    const r = rips[ripNext];
    ripNext = (ripNext + 1) % WAVE_RIPPLES;
    r.x = x;
    r.y = y;
    r.born = nowS;
    r.amp = amp;
  };
  const clampW = (v: number) => Math.max(-WAVE_LIMIT, Math.min(WAVE_LIMIT, v));

  /* the land (ground grid) as seen by the dot background behind this section:
     the dots hide exactly over it, in this scene's own 3D view (see holeBridge.ts) */
  const hole: LandHole = {
    stage: canvas.parentElement ?? canvas,
    a: [1, 0, 0, 1],
    b: [0, 0],
    c: [0, 0],
    e: 0,
    persp: 1,
    ax: 0,
    ay: 0,
    cx: HL_GRID.cx,
    cy: HL_GRID.cy,
    rx: HL_GRID.rx,
    ry: HL_GRID.ry,
    strength: 0,
  };
  setLandHole(hole);
  const announceHole = () => window.dispatchEvent(new Event(LAND_HOLE_EVENT));

  let program: WebGLProgram | null = null;
  let theme: Theme = readTheme();
  let items: Item[] = [];
  let textures: WebGLTexture[] = [];
  let buffers: WebGLBuffer[] = [];
  let vaos: WebGLVertexArrayObject[] = [];
  let white: WebGLTexture | null = null;
  const U: Record<string, WebGLUniformLocation | null> = {};

  /* ── GPU resources ────────────────────────────────────────────────────── */
  const tex = (c: HTMLCanvasElement, repeat = false) => {
    const t = gl.createTexture();
    if (!t) throw new Error("texture");
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
    const buf = gl.createBuffer();
    const vao = gl.createVertexArray();
    if (!buf || !vao) throw new Error("buffer");
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mb.data), gl.STATIC_DRAW);
    gl.bindVertexArray(vao);
    const f = 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, STRIDE * f, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, STRIDE * f, 3 * f);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, STRIDE * f, 5 * f);
    gl.bindVertexArray(null);
    buffers.push(buf);
    vaos.push(vao);
    return { vao, count: mb.data.length / STRIDE };
  };

  const UVS: V2[] = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];

  /* ── build the whole scene ────────────────────────────────────────────── */
  function build(c: HighlightCanvases) {
    program = makeProgram(gl, VS, FS);
    for (const n of [
      "uModel",
      "uZScale",
      "uCam",
      "uView",
      "uTex",
      "uUseTex",
      "uAlpha",
      "uTint",
      "uWave",
      "uWell",
      "uRip",
      "uSlide",
    ]) {
      U[n] = gl.getUniformLocation(program, n);
    }
    const wc = document.createElement("canvas");
    wc.width = wc.height = 2;
    const wg = wc.getContext("2d");
    if (wg) {
      wg.fillStyle = "#fff";
      wg.fillRect(0, 0, 2, 2);
    }
    white = tex(wc);
    const T = { top: tex(c.top, true), ao: tex(c.ao) };

    items = [];
    const add = (
      mb: MeshBuilder,
      texture: WebGLTexture | null,
      extra: Partial<Item> = {},
      mode: number = gl.TRIANGLES,
    ) => {
      const m = mesh(mb);
      items.push({ ...m, mode, tex: texture, pass: 0, ...extra });
    };

    /* base slab */
    {
      const S = HL_SLAB;
      const m = new MeshBuilder();
      m.box(
        S.x0,
        S.y0,
        -S.thick,
        S.x1 - S.x0,
        S.y1 - S.y0,
        S.thick,
        col(46),
        col(26),
        col(18),
      );
      add(m, null, { fade: { delay: 0, dur: 1.2 }, tintBy: SLAB_TINT });
    }

    /* ground grid (lines that fade out toward the edges) */
    {
      const G = HL_GRID;
      const z = -HL_SLAB.thick;
      const seg = 48; // finer lines so the waves bend them smoothly
      const fade = (x: number, y: number) => {
        const dx = (x - G.cx) / G.rx;
        const dy = (y - G.cy) / G.ry;
        const d = Math.hypot(dx, dy);
        return smooth(1 - (d - G.inner) / (1 - G.inner));
      };
      const m = new MeshBuilder();
      const line = (x0: number, y0: number, x1: number, y1: number) => {
        for (let s = 0; s < seg; s++) {
          const ax = x0 + ((x1 - x0) * s) / seg;
          const ay = y0 + ((y1 - y0) * s) / seg;
          const bx = x0 + ((x1 - x0) * (s + 1)) / seg;
          const by = y0 + ((y1 - y0) * (s + 1)) / seg;
          m.vert([ax, ay, z], [0, 0], [1, 1, 1, fade(ax, ay)]);
          m.vert([bx, by, z], [0, 0], [1, 1, 1, fade(bx, by)]);
        }
      };
      for (let x = G.x0; x <= G.x1; x += G.step) line(x, G.y0, x, G.y1);
      for (let y = G.y0; y <= G.y1; y += G.step) line(G.x0, y, G.x1, y);
      add(
        m,
        null,
        {
          pass: 1,
          fade: { delay: 0.2, dur: 1.6 },
          alphaBy: { dark: 0.2, light: 0.16 },
          tintBy: LINE_TINT,
          wave: true,
        },
        gl.LINES,
      );
    }

    /* towers */
    HL_BARS.forEach((b, i) => {
      const [t, r, f] = b.tone;
      const rc = barRect(i);
      const zs = { delay: BAR_DELAY + i * BAR_STEP, dur: BAR_DUR };
      const wall = c.walls[i];

      const right = new MeshBuilder();
      right.quad(
        [
          [rc.x1, rc.yNear, b.h],
          [rc.x1, rc.yFar, b.h],
          [rc.x1, rc.yFar, 0],
          [rc.x1, rc.yNear, 0],
        ],
        UVS,
        col(255),
      );
      add(right, tex(wall.right), { zs, tintBy: WALL_TINT });

      const front = new MeshBuilder();
      front.quad(
        [
          [rc.x0, rc.yNear, b.h],
          [rc.x1, rc.yNear, b.h],
          [rc.x1, rc.yNear, 0],
          [rc.x0, rc.yNear, 0],
        ],
        UVS,
        col(255),
      );
      add(front, tex(wall.front), { zs, tintBy: WALL_TINT });

      const top = new MeshBuilder();
      const tile = 256;
      const gv = (n: number): RGBA => [n, n, n, 1]; // tile is mid-grey, so × (tone / 160)
      top.quad(
        [
          [rc.x0, rc.yFar, b.h],
          [rc.x1, rc.yFar, b.h],
          [rc.x1, rc.yNear, b.h],
          [rc.x0, rc.yNear, b.h],
        ],
        [
          [rc.x0 / tile, rc.yFar / tile],
          [rc.x1 / tile, rc.yFar / tile],
          [rc.x1 / tile, rc.yNear / tile],
          [rc.x0 / tile, rc.yNear / tile],
        ],
        gv(t / 160),
      );
      b.roof?.forEach((e) => {
        top.box(
          rc.x0 + e.x,
          rc.yFar + e.y,
          b.h,
          e.w,
          e.d,
          e.h,
          gv((t + 16) / 160),
          gv((r * 1.9 + 10) / 160),
          gv((f * 1.9 + 10) / 160),
        );
      });
      add(top, T.top, { zs, tintBy: WALL_TINT });
    });

    /* soft shadows under every tower */
    {
      const m = new MeshBuilder();
      HL_BARS.forEach((_, i) => {
        const rc = barRect(i);
        m.flat(
          rc.x0 - 50,
          rc.yFar - 50,
          rc.x1 + 70,
          rc.yNear + 70,
          1,
          [0, 0, 0, 0.9],
        );
      });
      add(m, T.ao, {
        pass: 1,
        alphaBy: { dark: 1, light: 0.22 },
        fade: { delay: 0.4, dur: 1.6 },
      });
    }

    /* the arrow: a ribbon that draws itself piece by piece, then the head */
    {
      const a = HL_ARROW;
      const path = buildArrowPath();
      const ribbon = new MeshBuilder();
      const hw = a.width / 2;
      const n = path.length - 1;
      for (let i = 0; i < n; i++) {
        const p = path[i];
        const q = path[i + 1];
        const c0: RGBA = [1, 1, 1, 0.12 + (0.83 * i) / n];
        const c1: RGBA = [1, 1, 1, 0.12 + (0.83 * (i + 1)) / n];
        ribbon.quad(
          [
            [p[0] - hw, p[1], p[2]],
            [p[0] + hw, p[1], p[2]],
            [q[0] + hw, q[1], q[2]],
            [q[0] - hw, q[1], q[2]],
          ],
          UVS,
          [c0, c0, c1, c1],
        );
      }
      add(ribbon, null, {
        pass: 1,
        partial: { delay: ARROW_DELAY, dur: ARROW_DUR },
        alphaBy: { dark: 1, light: 1 },
        tintBy: ARROW_TINT,
      });

      const tip = path[path.length - 1];
      const prev = path[path.length - 4];
      let dx = tip[0] - prev[0];
      let dy = tip[1] - prev[1];
      let dz = tip[2] - prev[2];
      const len = Math.hypot(dx, dy, dz) || 1;
      dx /= len;
      dy /= len;
      dz /= len;
      const bx = tip[0] - dx * a.headLen;
      const by = tip[1] - dy * a.headLen;
      const bz = tip[2] - dz * a.headLen;
      const head = new MeshBuilder();
      const white4: RGBA = [1, 1, 1, 0.97];
      head.tri(
        [
          [tip[0], tip[1], tip[2]],
          [bx - a.headHalf, by, bz],
          [bx + a.headHalf, by, bz],
        ],
        [
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        [white4, white4, white4],
      );
      add(head, null, {
        pass: 1,
        fade: { delay: ARROW_DELAY + ARROW_DUR - 0.2, dur: 0.6 },
        tintBy: ARROW_TINT,
      });
    }
  }

  /* ── drawing ──────────────────────────────────────────────────────────── */
  function draw(now: number) {
    if (!program || !items.length) return;
    const t = t0 < 0 ? -1 : (now - t0) / 1000;

    cur.mx += (input.current.mx - cur.mx) * 0.06;
    cur.my += (input.current.my - cur.my) * 0.06;

    const model: Mat4 = mul(
      scaleUniform(view.k),
      mul(rotateX(view.tilt + cur.my * -1.4), rotateZ(view.yaw + cur.mx * 2.2)),
    );

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* keep the dot background in sync with the land (camera, parallax, fade-in) */
    {
      const zc = -HL_SLAB.thick;
      hole.a[0] = model[0];
      hole.a[1] = model[1];
      hole.a[2] = model[4];
      hole.a[3] = model[5];
      hole.b[0] = model[8] * zc + model[12];
      hole.b[1] = model[9] * zc + model[13];
      hole.c[0] = model[2];
      hole.c[1] = model[6];
      hole.e = model[10] * zc + model[14];
      hole.persp = view.persp;
      hole.ax = view.ax;
      hole.ay = view.ay;
      hole.strength = t < 0 ? 0 : clamp01((t - 0.2) / 1.6); // same fade as the grid lines
    }

    if (opts.onFrame) {
      for (let i = 0; i < ANCHORS.length; i++) {
        const p = project(model, ANCHORS[i], view.persp, view.ax, view.ay);
        xy[i * 2] = p[0];
        xy[i * 2 + 1] = p[1];
      }
      opts.onFrame(xy, t);
    }
    if (t < 0) return;

    /* ── land waves: cursor → point on the ground, a soft well that follows it,
       and ripples dropped while it moves / when you click ── */
    const nowS = now / 1000;
    const dtW = Math.min(0.1, Math.max(0, nowS - wv.lastNow));
    wv.lastNow = nowS;
    const inp = input.current;
    if (!reduced && inp.hover && inp.px !== undefined && inp.py !== undefined) {
      const g = unproject(
        model,
        view.persp,
        view.ax,
        view.ay,
        inp.px,
        inp.py,
        -HL_SLAB.thick,
      );
      const gx = clampW(g[0]);
      const gy = clampW(g[1]);
      if (!wv.has || wv.amt < 0.05) {
        wv.x = wv.lx = gx;
        wv.y = wv.ly = gy;
        wv.has = true;
      }
      const f = 1 - Math.exp(-dtW * WAVE_GLIDE);
      wv.x += (gx - wv.x) * f;
      wv.y += (gy - wv.y) * f;
      wv.amt += (1 - wv.amt) * (1 - Math.exp(-dtW * 4));
      const moved = Math.hypot(wv.x - wv.lx, wv.y - wv.ly);
      if (moved > 110 && nowS - wv.lastEmit > 0.26) {
        emitRipple(wv.x, wv.y, 0.22 + Math.min(0.3, moved / 1200), nowS);
        wv.lx = wv.x;
        wv.ly = wv.y;
        wv.lastEmit = nowS;
      }
    } else {
      wv.amt *= Math.exp(-dtW * 2.5);
      if (wv.amt < 0.004) wv.amt = 0;
    }
    if (inp.kicks && inp.kicks.length) {
      const list = inp.kicks.splice(0, 3);
      if (!reduced) {
        for (const k of list) {
          const g = unproject(
            model,
            view.persp,
            view.ax,
            view.ay,
            k.x,
            k.y,
            -HL_SLAB.thick,
          );
          emitRipple(clampW(g[0]), clampW(g[1]), 1, nowS);
        }
      }
    }
    let waveLive = wv.amt > 0;
    for (let i = 0; i < WAVE_RIPPLES; i++) {
      const r = rips[i];
      const age = nowS - r.born;
      const live = r.amp > 0 && age >= 0 && age < WAVE_LIFE;
      ripBuf[i * 4] = r.x;
      ripBuf[i * 4 + 1] = r.y;
      ripBuf[i * 4 + 2] = live ? age : 0;
      ripBuf[i * 4 + 3] = live ? r.amp : 0;
      if (live) waveLive = true;
    }

    gl.useProgram(program);
    gl.uniform1f(U.uSlide, WAVE_SLIDE);
    gl.uniform4f(U.uWell, wv.x, wv.y, WAVE_DEPTH * wv.amt, WAVE_SIGMA);
    gl.uniform4fv(U.uRip, ripBuf);
    gl.uniformMatrix4fv(U.uModel, false, model);
    gl.uniform3f(U.uCam, view.persp, view.ax, view.ay);
    gl.uniform2f(U.uView, W, H);
    gl.uniform1i(U.uTex, 0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied alpha

    for (let pass = 0; pass < 2; pass++) {
      gl.depthMask(pass === 0);
      for (const it of items) {
        if (it.pass !== pass) continue;
        let zs = 1;
        let f = 1;
        let n = it.count;
        let alpha = it.alphaBy ? it.alphaBy[theme] : 1;

        if (it.zs) {
          const p = (t - it.zs.delay) / it.zs.dur;
          if (p <= 0) continue;
          zs = 0.02 + 0.98 * ease(p);
        }
        if (it.fade) {
          const p = (t - it.fade.delay) / it.fade.dur;
          if (p <= 0) continue;
          f = clamp01(p);
        }
        if (it.partial) {
          const p = (t - it.partial.delay) / it.partial.dur;
          if (p <= 0) continue;
          n = Math.floor((it.count / 6) * smooth(p)) * 6;
          if (n <= 0) continue;
        }
        alpha *= f;
        if (alpha <= 0.001) continue;

        const tint = it.tintBy ? it.tintBy[theme] : ([1, 1, 1] as V3);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, it.tex ?? white);
        gl.uniform1f(U.uUseTex, it.tex ? 1 : 0);
        gl.uniform1f(U.uZScale, zs);
        gl.uniform1f(U.uWave, it.wave && waveLive ? 1 : 0);
        gl.uniform1f(U.uAlpha, alpha);
        gl.uniform3f(U.uTint, tint[0], tint[1], tint[2]);
        gl.bindVertexArray(it.vao);
        gl.drawArrays(it.mode, 0, n);
      }
    }
    gl.bindVertexArray(null);
  }

  /* ── loop: only runs while the section is visible ─────────────────────── */
  const frame = (now: number) => {
    raf = 0;
    if (disposed || !visible) return;
    // phones / weak devices: ~30 fps is plenty for slow motion
    if (lite && t0 >= 0 && now - lastDraw < 30) {
      raf = requestAnimationFrame(frame);
      return;
    }
    lastDraw = now;
    draw(now);
    if (!reduced || t0 < 0) raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (!raf && visible && !disposed) raf = requestAnimationFrame(frame);
  };
  /** one more picture when the scene is static (reduced motion) or not running */
  const redraw = () => {
    if (reduced && program && t0 >= 0) draw(performance.now());
    start();
  };

  /* ── size ─────────────────────────────────────────────────────────────── */
  const resize = () => {
    const r = (canvas.parentElement ?? canvas).getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    let dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2);
    dpr = Math.min(dpr, Math.sqrt(3_200_000 / (W * H))); // never more than ~3 MP
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    view = computeView(W, H);
    if (program && t0 >= 0 && reduced) {
      draw(performance.now());
      announceHole();
    }
    start();
  };
  let rt = 0;
  const onResize = () => {
    window.clearTimeout(rt);
    rt = window.setTimeout(resize, 80);
  };
  const ro =
    typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
  ro?.observe(canvas.parentElement ?? canvas);
  resize();

  /* ── visibility: pause off-screen, start the reveal when it is in view ── */
  let started = false;
  function tryStart() {
    if (started || !canvases || !program || !inView || disposed) return;
    started = true;
    // wait two painted frames so nothing hitches when the animation begins
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (disposed) return;
        t0 = reduced ? performance.now() - 60_000 : performance.now();
        redraw();
        if (reduced) announceHole();
      }),
    );
  }
  const io =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(
          (entries) => {
            const e = entries[entries.length - 1];
            onScreen = e.isIntersecting;
            visible = onScreen && !document.hidden;
            if (e.intersectionRatio >= 0.2) inView = true;
            if (visible) start();
            tryStart();
          },
          { threshold: [0, 0.2, 0.4] },
        )
      : null;
  io?.observe(canvas);
  if (!io) {
    onScreen = true;
    visible = true;
    inView = true;
  }
  const onVis = () => {
    visible = onScreen && !document.hidden;
    if (visible) start();
  };
  document.addEventListener("visibilitychange", onVis);

  /* textures are only drawn when the visitor is close (nothing at page load) */
  let buildStarted = false;
  function beginBuild() {
    if (buildStarted || disposed) return;
    buildStarted = true;
    buildHighlightCanvases(lite)
      .then((c) => {
        if (disposed) return;
        canvases = c;
        try {
          build(c);
        } catch {
          return; // a GPU problem: leave the stage empty rather than crash the page
        }
        tryStart();
      })
      .catch(() => undefined);
  }
  const nearIo =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              beginBuild();
              nearIo?.disconnect();
            }
          },
          { rootMargin: "900px 0px 900px 0px" },
        )
      : null;
  nearIo?.observe(canvas);
  if (!nearIo) beginBuild();

  /* if the GPU resets the context (rare), rebuild everything */
  const onLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const onRestored = () => {
    release();
    if (canvases) {
      try {
        build(canvases);
      } catch {
        return;
      }
    }
    start();
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  /* ── theme (dark / light) ─────────────────────────────────────────────── */
  const onThemeEvent = (e: Event) => {
    const d = (e as CustomEvent<string>).detail;
    theme = d === "dark" || d === "light" ? d : readTheme();
    redraw();
  };
  window.addEventListener(THEME_EVENT, onThemeEvent);
  const mo =
    typeof MutationObserver !== "undefined"
      ? new MutationObserver(() => {
          theme = readTheme();
          redraw();
        })
      : null;
  const moOpts = { attributes: true, attributeFilter: ["data-theme", "class"] };
  mo?.observe(document.documentElement, moOpts);
  if (document.body) mo?.observe(document.body, moOpts);

  function release() {
    textures.forEach((x) => gl.deleteTexture(x));
    buffers.forEach((x) => gl.deleteBuffer(x));
    vaos.forEach((x) => gl.deleteVertexArray(x));
    if (program) gl.deleteProgram(program);
    textures = [];
    buffers = [];
    vaos = [];
    items = [];
    program = null;
    white = null;
  }

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(rt);
      ro?.disconnect();
      io?.disconnect();
      nearIo?.disconnect();
      mo?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener(THEME_EVENT, onThemeEvent);
      setLandHole(null);
      announceHole();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      release();
    },
  };
}
