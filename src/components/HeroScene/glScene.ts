/* ────────────────────────────────────────────────────────────────────────────
 * HERO SCENE ENGINE (WebGL2, no libraries)
 *
 * The same street / KENNU / billboard as before, but drawn on ONE <canvas>
 * by the GPU, with a real depth buffer. The page itself only has to show a
 * single flat image, so scrolling and the rest of your UI stay smooth.
 *
 * The camera maths is identical to the old CSS version (same yaw / tilt /
 * perspective), so the angle you liked is unchanged.
 *
 * ATMOSPHERE: the old white smoke layers are gone. The air now holds a few
 * small white dots floating/falling slowly (like light snow), real 3D points
 * drawn by their own tiny shader (see SNOW below).
 *
 * THEME: the scene follows the site theme (ThemeToggle fires "kennu:themechange"
 * and sets data-theme). Dark = original night scene. Light = white world, black
 * KENNU, buildings / billboard stay grey-black.
 * ──────────────────────────────────────────────────────────────────────────── */

import {
  BILLBOARD,
  BUILDINGS,
  GLYPHS,
  LAMPS,
  ROAD,
  STREAKS,
  WORD,
  computeCamera,
} from "./sceneConfig";
import {
  GROUND,
  STREET,
  STREET_SPLIT,
  SceneCanvases,
  SceneTheme,
  ThemeCanvases,
  buildCanvases,
  buildThemeCanvases,
  rng,
} from "./textures";
import {
  Mat4,
  MeshBuilder,
  RGBA,
  STRIDE,
  V2,
  V3,
  makeProgram,
  mul,
  rotateX,
  rotateZ,
  scaleUniform,
  translate,
  triangulate,
} from "./glUtils";

export interface SceneInput {
  /** pointer position, -1…1 (set by Hero.tsx) */
  mx: number;
  my: number;
  /** scroll progress of the hero, 0…1 */
  sc: number;
}

export interface SceneController {
  setReady(ready: boolean): void;
  dispose(): void;
}

/** background / far-fog colour per theme (light = literal white) */
const BG: Record<SceneTheme, V3> = {
  dark: [9 / 255, 9 / 255, 10 / 255],
  light: [1, 1, 1],
};
const bgCss = (th: SceneTheme) => (th === "light" ? "#ffffff" : "#09090a");

/** same event name ThemeToggle dispatches (keep in sync with THEME_CHANGE_EVENT there) */
const THEME_EVENT = "kennu:themechange";

/** which theme the page is in right now (ThemeToggle's CSS uses [data-theme="dark"]) */
function readTheme(): SceneTheme {
  const el = document.documentElement;
  const v =
    el.getAttribute("data-theme") ?? document.body?.getAttribute("data-theme");
  if (v === "dark" || v === "light") return v;
  if (el.classList.contains("dark")) return "dark";
  return "light"; // no attribute = the CSS default, which is the light state
}

/** brightness multiplier per theme (light mode lifts the dark concrete a little so the
 *  black KENNU stays readable in front of it; lamps / posts get darker on white) */
const WALL_GAIN: Record<SceneTheme, number> = { dark: 1, light: 1.65 };
const LAMP_GAIN: Record<SceneTheme, number> = { dark: 1, light: 0.55 };
const BOARD_GAIN: Record<SceneTheme, number> = { dark: 1, light: 0.85 };

/* ── shaders ────────────────────────────────────────────────────────────── */
const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aUV;
layout(location=2) in vec4 aCol;
layout(location=3) in vec2 aExtra;
uniform mat4 uModel;
uniform vec3 uOffset;
uniform float uZScale;
uniform vec3 uCam;   // perspective distance, anchor x, anchor y (css px)
uniform vec2 uView;  // stage size (css px)
uniform vec2 uUV;    // slow texture drift (used by the fog)
out vec2 vUV;
out vec4 vCol;
out float vW;
out vec2 vExtra;
void main() {
  vec3 p = aPos;
  p.z *= uZScale;
  p += uOffset;
  vec3 q = (uModel * vec4(p, 1.0)).xyz;
  float w = 1.0 - q.z / uCam.x;
  vec2 s = vec2(uCam.y, uCam.z) + q.xy / w;
  vec2 ndc = vec2(s.x / uView.x * 2.0 - 1.0, 1.0 - s.y / uView.y * 2.0);
  gl_Position = vec4(ndc * w, w - 0.1, w);
  vUV = aUV + uUV;
  vCol = aCol;
  vW = w;
  vExtra = aExtra;
}`;

const FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform float uUseTex;
uniform float uAlpha;
uniform float uFade;
uniform vec3 uBg;
uniform vec2 uFog;
uniform float uWipe;
uniform float uGain;
in vec2 vUV;
in vec4 vCol;
in float vW;
in vec2 vExtra;
out vec4 outColor;
void main() {
  vec4 c = vCol;
  if (uUseTex > 0.5) c *= texture(uTex, vUV);
  c.rgb *= uGain;
  // billboard text wipes in left → right, line after line
  if (uWipe < 1.5) {
    float th = uWipe * 1.45 - vUV.y * 0.3;
    c.a *= smoothstep(th, th - 0.05, vUV.x);
  }
  float fog = smoothstep(uFog.x, uFog.y, vW) * 0.85;
  vec3 rgb = mix(c.rgb, uBg, fog);
  rgb = mix(uBg, rgb, uFade);
  outColor = vec4(rgb, c.a * uAlpha);
}`;

/* ── SNOW: a few small dots floating in the air ────────────────────────────
 * Real 3D points: they share the scene camera (same model matrix / perspective),
 * so they sit in the street's depth, hide behind buildings and move with the
 * pointer / scroll. Fall + sway is computed on the GPU (no JS per frame).
 *  count      → how many flakes (keep it LOW: it should feel like light snow)
 *  size       → dot size range in world px (before camera scale)
 *  fall       → slow fall speed range (world px / second)
 * ──────────────────────────────────────────────────────────────────────── */
const SNOW = {
  count: 170,
  countLite: 70,
  x0: -1000,
  x1: 1000,
  y0: -2450,
  y1: 650,
  z0: 8, // lowest height a flake reaches
  z1: 640, // highest
  sizeMin: 3,
  sizeMax: 8,
  fallMin: 6,
  fallMax: 16,
};
/** dot colour per theme: white on the night scene, soft grey on the white scene */
const SNOW_COLOR: Record<SceneTheme, V3> = {
  dark: [1, 1, 1],
  light: [0.42, 0.42, 0.47],
};

const SNOW_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aBase;
layout(location=1) in vec4 aPar;   // size, alpha, phase, fall speed
uniform mat4 uModel;
uniform vec3 uCam;   // perspective distance, anchor x, anchor y (css px)
uniform vec2 uView;  // stage size (css px)
uniform float uK;    // camera scale
uniform float uPx;   // device pixels per css px
uniform float uT;    // seconds (0 when reduced motion)
uniform vec2 uZ;     // lowest / highest flake height
out float vA;
void main() {
  float ph = aPar.z;
  float zr = uZ.y - uZ.x;
  float zz = mod(aBase.z - uZ.x - aPar.w * uT, zr);   // slow fall, wraps around
  vec3 p = aBase;
  p.z = uZ.x + zz;
  float fq = 0.25 + fract(ph * 7.31) * 0.3;
  p.x += sin(uT * fq + ph * 6.2831) * 26.0;           // gentle sway
  p.y += cos(uT * fq * 0.8 + ph * 9.0) * 18.0;
  // fade near the top / bottom of the air column so the wrap is never seen
  float edge = smoothstep(0.0, 70.0, zz) * (1.0 - smoothstep(zr - 70.0, zr, zz));
  vec3 q = (uModel * vec4(p, 1.0)).xyz;
  float w = 1.0 - q.z / uCam.x;
  vec2 s = vec2(uCam.y, uCam.z) + q.xy / w;
  vec2 ndc = vec2(s.x / uView.x * 2.0 - 1.0, 1.0 - s.y / uView.y * 2.0);
  gl_Position = vec4(ndc * w, w - 0.1, w);
  gl_PointSize = max(aPar.x * uK / w * uPx, 1.5 * uPx);
  float tw = 0.78 + 0.22 * sin(uT * 1.3 + ph * 40.0);
  float far = 1.0 - smoothstep(2.0, 3.2, w);          // dots thin out far up the road
  vA = aPar.y * edge * tw * far;
}`;

const SNOW_FS = `#version 300 es
precision highp float;
uniform vec3 uColor;
uniform float uAlpha;
in float vA;
out vec4 outColor;
void main() {
  float r = length(gl_PointCoord * 2.0 - 1.0);
  float a = smoothstep(1.0, 0.35, r);                 // small soft round dot
  outColor = vec4(uColor, a * vA * uAlpha);
}`;

/* ── helpers ────────────────────────────────────────────────────────────── */
const col = (n: number, a = 1): RGBA => [n / 255, n / 255, n / 255, a];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (p: number) => 1 - Math.pow(1 - clamp01(p), 4.5);
const prog = (t: number, a?: { delay: number; dur: number }) =>
  a ? (t - a.delay) / a.dur : 1;

interface Anim {
  delay: number;
  dur: number;
}
/** GPU textures that exist once per theme */
interface ThemeTex {
  ground: WebGLTexture;
  near: WebGLTexture;
  far: WebGLTexture;
  roadText: WebGLTexture;
}
interface Item {
  mesh: { vao: WebGLVertexArrayObject; count: number };
  tex: WebGLTexture | null;
  pass: 0 | 1 | 2; // 0 = solid, 1 = see-through, 2 = additive glow
  rise?: Anim & { sink: number };
  fade?: Anim;
  zs?: Anim;
  wipe?: Anim;
  alpha?: number;
  /** texture drift in uv units per second (fog) */
  drift?: [number, number];
  /** own distance-fog range (the white mist must not be swallowed by the dark far fog) */
  fog?: [number, number];
  streak?: { x: number; dir: 1 | -1; dur: number; delay: number };
  /** only drawn while this theme is showing */
  theme?: SceneTheme;
  /** ground / street / road paint: the texture is picked per theme at draw time */
  themed?: keyof ThemeTex;
  /** opacity per theme (overrides `alpha`) */
  alphaBy?: Record<SceneTheme, number>;
  /** brightness multiplier per theme */
  gain?: Record<SceneTheme, number>;
}

/* ── controller ─────────────────────────────────────────────────────────── */
export function createScene(
  canvas: HTMLCanvasElement,
  opts: { lite: boolean; input: { current: SceneInput }; onStart?: () => void },
): SceneController | null {
  const gl = canvas.getContext("webgl2", {
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;
  const { lite, input } = opts;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let disposed = false;
  let ready = false;
  let canvases: SceneCanvases | null = null;
  let t0 = -1;
  let visible = true;
  let raf = 0;
  let lastDraw = 0;
  let W = 1;
  let H = 1;
  const cur = { mx: 0, my: 0 };

  let program: WebGLProgram | null = null;
  let snow: {
    program: WebGLProgram;
    vao: WebGLVertexArrayObject;
    count: number;
  } | null = null;
  const SU: Record<string, WebGLUniformLocation | null> = {};
  /* theme: `theme` = what the page wants, `shown` = what is on screen (its
     textures are ready). They only differ for a moment, the first time the
     visitor switches theme and the other set of textures is still being drawn. */
  let theme: SceneTheme = readTheme();
  let shown: SceneTheme = theme;
  let sets: Partial<Record<SceneTheme, ThemeTex>> = {};
  let loadingTheme: SceneTheme | null = null;
  let items: Item[] = [];
  let textures: WebGLTexture[] = [];
  let buffers: WebGLBuffer[] = [];
  let vaos: WebGLVertexArrayObject[] = [];
  let white: WebGLTexture | null = null;
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

  /* ── build the whole scene ────────────────────────────────────────────── */
  function build(c: SceneCanvases) {
    program = makeProgram(gl!, VS, FS);
    for (const n of [
      "uModel",
      "uOffset",
      "uZScale",
      "uCam",
      "uView",
      "uTex",
      "uUseTex",
      "uAlpha",
      "uFade",
      "uBg",
      "uFog",
      "uUV",
      "uWipe",
      "uGain",
    ]) {
      U[n] = gl!.getUniformLocation(program, n);
    }
    const wc = document.createElement("canvas");
    wc.width = wc.height = 2;
    const wg = wc.getContext("2d")!;
    wg.fillStyle = "#fff";
    wg.fillRect(0, 0, 2, 2);
    white = tex(wc);

    shown = c.theme;
    uploadTheme(c.theme, c);
    paintHost(shown);

    const T = {
      top: tex(c.top, true),
      ao: tex(c.ao),
      glow: tex(c.glow),
      sIn: tex(c.streakIn),
      sOut: tex(c.streakOut),
      board: tex(c.board),
      boardText: tex(c.boardText),
    };
    items = [];
    const add = (
      mb: MeshBuilder,
      texture: WebGLTexture | null,
      extra: Partial<Item> = {},
    ) => items.push({ mesh: mesh(mb), tex: texture, pass: 0, ...extra });

    /* ground + street */
    {
      const m = new MeshBuilder();
      m.flat(GROUND.x0, GROUND.y0, GROUND.x1, GROUND.y1, 0, col(255));
      add(m, null, { themed: "ground", fade: { delay: 0.05, dur: 1.5 } });

      const n = new MeshBuilder();
      n.flat(STREET.x0, STREET_SPLIT, STREET.x1, ROAD.yNear, 1.5, col(255));
      add(n, null, { themed: "near", fade: { delay: 0.05, dur: 1.5 } });

      const f = new MeshBuilder();
      f.flat(STREET.x0, ROAD.yFar, STREET.x1, STREET_SPLIT + 4, 1.5, col(255));
      add(f, null, { themed: "far", fade: { delay: 0.05, dur: 1.5 } });
    }

    /* buildings */
    const blds = BUILDINGS.filter((b) => !(lite && b.skipOnLite));
    blds.forEach((b, i) => {
      const [t, r, f] = b.tone;
      const rise = { delay: b.delay, dur: 1.4, sink: 160 };
      const wall = c.walls[i];

      const right = new MeshBuilder();
      const xr = b.x + b.w;
      right.quad(
        [
          [xr, b.y + b.d, b.h],
          [xr, b.y, b.h],
          [xr, b.y, 0],
          [xr, b.y + b.d, 0],
        ],
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
        col(255),
      );
      add(right, tex(wall.right), { rise, gain: WALL_GAIN });

      const front = new MeshBuilder();
      const yf = b.y + b.d;
      front.quad(
        [
          [b.x, yf, b.h],
          [b.x + b.w, yf, b.h],
          [b.x + b.w, yf, 0],
          [b.x, yf, 0],
        ],
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
        col(255),
      );
      add(front, tex(wall.front), { rise, gain: WALL_GAIN });

      const top = new MeshBuilder();
      const tile = 256;
      const gv = (n: number): RGBA => [n, n, n, 1]; // tile is mid-grey (0.63), so ×(tone/160)
      top.quad(
        [
          [b.x, b.y, b.h],
          [xr, b.y, b.h],
          [xr, yf, b.h],
          [b.x, yf, b.h],
        ],
        [
          [b.x / tile, b.y / tile],
          [xr / tile, b.y / tile],
          [xr / tile, yf / tile],
          [b.x / tile, yf / tile],
        ],
        gv(t / 160),
      );
      b.roof?.forEach((e) => {
        top.box(
          b.x + e.x,
          b.y + e.y,
          b.h,
          e.w,
          e.d,
          e.h,
          gv((t + 16) / 160),
          gv((r * 1.9 + 10) / 160),
          gv((f * 1.9 + 10) / 160),
        );
      });
      add(top, T.top, { rise, gain: WALL_GAIN });
    });

    /* lamps */
    const lamps = lite ? LAMPS.ys.filter((_, i) => i % 2 === 0) : LAMPS.ys;
    lamps.forEach((y, i) => {
      const m = new MeshBuilder();
      m.box(LAMPS.x - 3, y - 3, 0, 6, 6, LAMPS.h, col(150), col(78), col(44));
      m.box(
        LAMPS.x - 58,
        y - 3.5,
        LAMPS.h,
        64,
        7,
        6,
        col(170),
        col(95),
        col(60),
      );
      m.box(
        LAMPS.x - 58,
        y - 3.5,
        LAMPS.h + 6,
        30,
        7,
        2,
        col(255),
        col(255),
        col(255),
      );
      add(m, null, {
        rise: { delay: 1.5 + i * 0.1, dur: 1.2, sink: 60 },
        gain: LAMP_GAIN,
      });
    });

    /* KENNU */
    const Uu = WORD.cap / 140;
    let off = 0;
    const glyphRuns: { left: number; width: number }[] = [];
    WORD.text.split("").forEach((ch, gi) => {
      const g = GLYPHS[ch];
      const left = off * Uu;
      /* one mesh per theme (white letters in dark mode, black in light mode) */
      (["dark", "light"] as SceneTheme[]).forEach((th) => {
        const m = new MeshBuilder();
        glyphMesh(m, g.pts, left, Uu, th);
        add(m, null, { theme: th, zs: { delay: 1.05 + gi * 0.14, dur: 1.2 } });
      });
      glyphRuns.push({ left, width: g.w * Uu });
      off += g.w + WORD.gap;
    });
    const wordLen =
      glyphRuns[glyphRuns.length - 1].left +
      glyphRuns[glyphRuns.length - 1].width;

    /* billboard */
    const bb = BILLBOARD;
    {
      const rise = { delay: 1.9, dur: 1.4, sink: 120 };
      const solid = new MeshBuilder();
      bb.posts.forEach((py) =>
        solid.box(
          bb.x + 4,
          py - 6,
          0,
          12,
          12,
          bb.z + 40,
          col(150),
          col(70),
          col(40),
        ),
      );
      // board: top + front end (the face with text is its own mesh below)
      solid.box(
        bb.x,
        bb.y,
        bb.z,
        bb.thick,
        bb.len,
        bb.h,
        col(66),
        col(11),
        col(30),
      );
      // lamp rail + 4 lamps
      solid.box(
        bb.x + bb.thick,
        bb.y + 20,
        bb.z + bb.h,
        34,
        bb.len - 40,
        6,
        col(120),
        col(70),
        col(50),
      );
      [0.14, 0.38, 0.62, 0.86].forEach((p) => {
        solid.box(
          bb.x + bb.thick + 22,
          bb.y + bb.len * p - 14,
          bb.z + bb.h + 6,
          18,
          28,
          12,
          col(255),
          col(255),
          col(255),
        );
      });
      add(solid, null, { rise, gain: BOARD_GAIN });

      const face = new MeshBuilder();
      const xf = bb.x + bb.thick;
      const quadFace = (dx: number) =>
        [
          [xf + dx, bb.y + bb.len, bb.z + bb.h],
          [xf + dx, bb.y, bb.z + bb.h],
          [xf + dx, bb.y, bb.z],
          [xf + dx, bb.y + bb.len, bb.z],
        ] as V3[];
      const uvs: V2[] = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ];
      face.quad(quadFace(0.2), uvs, col(255));
      add(face, T.board, { rise });

      const text = new MeshBuilder();
      text.quad(quadFace(1.0), uvs, col(255));
      add(text, T.boardText, { pass: 1, rise, wipe: { delay: 2.7, dur: 1.5 } });
    }

    /* soft shadows under solid things */
    {
      const m = new MeshBuilder();
      const shade = (x0: number, y0: number, x1: number, y1: number) =>
        m.flat(x0, y0, x1, y1, 3, [0, 0, 0, 0.92]);
      blds.forEach((b) =>
        shade(b.x - 60, b.y - 60, b.x + b.w + 90, b.y + b.d + 90),
      );
      shade(
        WORD.x - WORD.depth - 70,
        WORD.yStart - wordLen - 60,
        WORD.x + 60,
        WORD.yStart + 60,
      );
      shade(bb.x - 90, bb.y - 60, bb.x + 130, bb.y + bb.len + 60);
      add(m, T.ao, {
        pass: 1,
        // heavy black patches in the night scene, only a soft grey shadow on white
        alphaBy: { dark: 1, light: 0.22 },
        fade: { delay: 0.5, dur: 1.6 },
      });
    }

    /* light pools: under the street lamps and on the billboard lamps */
    {
      const m = new MeshBuilder();
      if (!lite)
        lamps.forEach((y) =>
          m.flat(
            LAMPS.x - 230,
            y - 230,
            LAMPS.x + 230,
            y + 230,
            3.5,
            [1, 1, 1, 0.2],
          ),
        );
      [0.14, 0.38, 0.62, 0.86].forEach((p) => {
        const cx = bb.x + bb.thick + 31;
        const cy = bb.y + bb.len * p;
        m.flat(
          cx - 60,
          cy - 60,
          cx + 60,
          cy + 60,
          bb.z + bb.h + 14,
          [1, 1, 1, 0.55],
        );
      });
      // additive light: invisible on white, so it is skipped in light mode
      add(m, T.glow, {
        pass: 2,
        alphaBy: { dark: 1, light: 0 },
        fade: { delay: 2.2, dur: 1.8 },
      });
    }

    /* "ELNAR" painted on the road */
    {
      /* road paint: "SOFTWARE" / "DEVELOPER" (see roadTextCanvas in textures.ts) */
      const m = new MeshBuilder();
      const y1 = 130;
      const len = 780;
      const x0 = -130;
      const x1 = 130;
      m.quad(
        [
          [x0, y1, 3],
          [x0, y1 - len, 3],
          [x1, y1 - len, 3],
          [x1, y1, 3],
        ],
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
        col(255),
      );
      add(m, null, {
        themed: "roadText",
        pass: 1,
        fade: { delay: 2.3, dur: 1.4 },
      });
    }

    /* traffic light-streaks */
    const streaks = lite ? STREAKS.filter((_, i) => i % 2 === 0) : STREAKS;
    streaks.forEach((s) => {
      /* dark mode: glowing white streaks (additive) · light mode: soft dark streaks */
      (["dark", "light"] as SceneTheme[]).forEach((th) => {
        const m = new MeshBuilder();
        m.quad(
          [
            [s.x - 11, 0, 4],
            [s.x + 11, 0, 4],
            [s.x + 11, s.len, 4],
            [s.x - 11, s.len, 4],
          ],
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
          th === "dark" ? col(255) : col(28),
        );
        add(m, s.dir === 1 ? T.sIn : T.sOut, {
          theme: th,
          pass: th === "dark" ? 2 : 1,
          alpha: th === "dark" ? 1 : 0.55,
          streak: { x: s.x, dir: s.dir, dur: s.dur, delay: s.delay },
        });
      });
    });

    /* floating snow dots (replaces the old white mist) */
    buildSnow();

    /* make sure the theme the page wants is the one on screen */
    applyTheme(theme);
  }

  /** the snow: one small point cloud, positions are random but fixed (seeded) */
  function buildSnow() {
    const g = gl!;
    const n = lite ? SNOW.countLite : SNOW.count;
    const r = rng(913);
    const data = new Float32Array(n * 7);
    for (let i = 0; i < n; i++) {
      const o = i * 7;
      data[o] = SNOW.x0 + r() * (SNOW.x1 - SNOW.x0);
      data[o + 1] = SNOW.y0 + r() * (SNOW.y1 - SNOW.y0);
      data[o + 2] = SNOW.z0 + r() * (SNOW.z1 - SNOW.z0);
      data[o + 3] =
        SNOW.sizeMin + Math.pow(r(), 2) * (SNOW.sizeMax - SNOW.sizeMin);
      data[o + 4] = 0.45 + r() * 0.5; // opacity
      data[o + 5] = r(); // phase
      data[o + 6] = SNOW.fallMin + r() * (SNOW.fallMax - SNOW.fallMin);
    }
    const prog = makeProgram(g, SNOW_VS, SNOW_FS);
    for (const nm of [
      "uModel",
      "uCam",
      "uView",
      "uK",
      "uPx",
      "uT",
      "uZ",
      "uColor",
      "uAlpha",
    ]) {
      SU[nm] = g.getUniformLocation(prog, nm);
    }
    const buf = g.createBuffer()!;
    g.bindBuffer(g.ARRAY_BUFFER, buf);
    g.bufferData(g.ARRAY_BUFFER, data, g.STATIC_DRAW);
    const vao = g.createVertexArray()!;
    g.bindVertexArray(vao);
    const f = 4;
    g.enableVertexAttribArray(0);
    g.vertexAttribPointer(0, 3, g.FLOAT, false, 7 * f, 0);
    g.enableVertexAttribArray(1);
    g.vertexAttribPointer(1, 4, g.FLOAT, false, 7 * f, 3 * f);
    g.bindVertexArray(null);
    buffers.push(buf);
    vaos.push(vao);
    snow = { program: prog, vao, count: n };
  }

  /** one letter: front face (triangulated outline) + a lit side wall for every edge */
  function glyphMesh(
    m: MeshBuilder,
    pts: [number, number][],
    left: number,
    Uu: number,
    th: SceneTheme,
  ) {
    const light = th === "light";
    const P = pts.map(([x, y]) => [left + x * Uu, y * Uu] as V2); // [u along word, v down]
    const world = (u: number, v: number, w: number): V3 => [
      WORD.x + w,
      WORD.yStart - u,
      WORD.cap - v,
    ];
    const faceCol = (v: number): RGBA => {
      const t = v / WORD.cap; // 0 at the top of the letter, 1 at the bottom
      if (light) return col(40 - 22 * t); // black letters (a touch lighter on top)
      const n =
        t < 0.45
          ? 246 + (230 - 246) * (t / 0.45)
          : 230 + (196 - 230) * ((t - 0.45) / 0.55);
      return col(n);
    };
    // front
    const tris = triangulate(pts.map(([x, y]) => [x * Uu, y * Uu] as V2));
    for (const [a, b, c] of tris) {
      const ids = [a, b, c];
      m.tri(
        ids.map((i) => world(P[i][0], P[i][1], 0)),
        ids.map(() => [0, 0] as V2),
        ids.map((i) => faceCol(P[i][1])),
        1,
        ids.map((i) => P[i][0]),
      );
    }
    // sides
    let area = 0;
    for (let i = 0; i < P.length; i++) {
      const [x1, y1] = P[i];
      const [x2, y2] = P[(i + 1) % P.length];
      area += x1 * y2 - x2 * y1;
    }
    for (let i = 0; i < P.length; i++) {
      const [u1, v1] = P[i];
      const [u2, v2] = P[(i + 1) % P.length];
      const dx = u2 - u1;
      const dy = v2 - v1;
      const len = Math.hypot(dx, dy);
      if (len < 0.5) continue;
      const nx = (area > 0 ? dy : -dy) / len;
      const ny = (area > 0 ? -dx : dx) / len;
      if (!(nx <= 0.25 || ny <= -0.25)) continue; // walls that face away are never seen
      const diffuse = Math.max(0, nx * -0.34 + ny * -0.94);
      const lum = light ? 20 + 105 * diffuse : 30 + 150 * diffuse;
      m.quad(
        [
          world(u1, v1, 0),
          world(u2, v2, 0),
          world(u2, v2, -WORD.depth),
          world(u1, v1, -WORD.depth),
        ],
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ],
        [col(lum), col(lum), col(lum * 0.5), col(lum * 0.5)],
      );
    }
  }

  /* ── drawing ──────────────────────────────────────────────────────────── */
  function draw(now: number) {
    if (!program || !items.length) return;
    const g = gl!;
    const t = t0 < 0 ? -1 : (now - t0) / 1000;

    // smooth pointer
    cur.mx += (input.current.mx - cur.mx) * 0.07;
    cur.my += (input.current.my - cur.my) * 0.07;

    const cam = computeCamera(W, H);
    const model: Mat4 = mul(
      translate(0, input.current.sc * -90, 0),
      mul(
        scaleUniform(cam.k),
        mul(rotateX(cam.tilt + cur.my * -1.6), rotateZ(cam.yaw + cur.mx * 2.4)),
      ),
    );

    g.viewport(0, 0, canvas.width, canvas.height);
    const bg = BG[shown];
    g.clearColor(bg[0], bg[1], bg[2], 1);
    g.clear(g.COLOR_BUFFER_BIT | g.DEPTH_BUFFER_BIT);
    if (t < 0) return;

    g.useProgram(program);
    g.uniformMatrix4fv(U.uModel, false, model);
    g.uniform3f(U.uCam, cam.persp, cam.ax, cam.ay);
    g.uniform2f(U.uView, W, H);
    g.uniform3f(U.uBg, bg[0], bg[1], bg[2]);
    g.uniform2f(U.uFog, 1.0, 1.75);
    g.uniform1i(U.uTex, 0);
    g.enable(g.DEPTH_TEST);
    g.depthFunc(g.LEQUAL);
    g.disable(g.CULL_FACE);

    for (let pass = 0; pass < 3; pass++) {
      if (pass === 0) {
        g.disable(g.BLEND);
        g.depthMask(true);
      } else {
        g.enable(g.BLEND);
        g.depthMask(false);
        if (pass === 1) g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA);
        else g.blendFunc(g.SRC_ALPHA, g.ONE);
      }
      for (const it of items) {
        if (it.pass !== pass) continue;
        if (it.theme && it.theme !== shown) continue;
        let offZ = 0;
        let offY = 0;
        let zs = 1;
        let f = 1;
        let wipe = 2;
        let alpha = it.alphaBy ? it.alphaBy[shown] : (it.alpha ?? 1);

        if (it.rise) {
          const p = prog(t, it.rise);
          if (p <= 0) continue;
          offZ = -it.rise.sink * (1 - ease(p));
          f = clamp01(p * 2.2);
        }
        if (it.zs) {
          const p = prog(t, it.zs);
          if (p <= 0) continue;
          zs = 0.04 + 0.96 * ease(p);
        }
        if (it.fade) {
          const p = prog(t, it.fade);
          if (p <= 0) continue;
          f = clamp01(p);
        }
        if (it.wipe) wipe = prog(t, it.wipe);
        if (it.streak) {
          if (reduced) continue;
          const s = it.streak;
          const ph = ((((t + s.delay) / s.dur) % 1) + 1) % 1;
          offY = s.dir === 1 ? -2400 + ph * 3100 : 700 - ph * 3100;
          const edge = Math.min(1, ph / 0.1, (1 - ph) / 0.1);
          alpha = clamp01(edge) * clamp01((t - 2.6) / 1.0) * (it.alpha ?? 1);
          if (alpha <= 0.001) continue;
        }

        if (pass > 0 && alpha * f <= 0.001) continue;
        const tx = it.themed ? (sets[shown]?.[it.themed] ?? null) : it.tex;
        const useTex = tx ? 1 : 0;
        g.uniform2f(
          U.uFog,
          it.fog ? it.fog[0] : 1.0,
          it.fog ? it.fog[1] : 1.75,
        );
        g.activeTexture(g.TEXTURE0);
        g.bindTexture(g.TEXTURE_2D, tx ?? white);
        g.uniform1f(U.uGain, it.gain ? it.gain[shown] : 1);
        g.uniform1f(U.uUseTex, useTex);
        g.uniform3f(U.uOffset, 0, offY, offZ);
        g.uniform1f(U.uZScale, zs);
        g.uniform1f(U.uWipe, wipe);
        // fog: the texture slides very slowly (wrapped, so the numbers stay small)
        const dr = it.drift && !reduced ? it.drift : null;
        g.uniform2f(U.uUV, dr ? (dr[0] * t) % 1 : 0, dr ? (dr[1] * t) % 1 : 0);
        if (pass === 0) {
          g.uniform1f(U.uFade, f);
          g.uniform1f(U.uAlpha, 1);
        } else {
          g.uniform1f(U.uFade, 1);
          g.uniform1f(U.uAlpha, alpha * f);
        }
        g.bindVertexArray(it.mesh.vao);
        g.drawArrays(g.TRIANGLES, 0, it.mesh.count);
      }
    }
    /* snow: drawn last, behind nothing, hidden only by solid buildings / letters */
    if (snow) {
      const sIn = reduced ? 1 : clamp01((t - 2.2) / 2.6);
      if (sIn > 0.001) {
        const sc = SNOW_COLOR[shown];
        g.useProgram(snow.program);
        g.uniformMatrix4fv(SU.uModel, false, model);
        g.uniform3f(SU.uCam, cam.persp, cam.ax, cam.ay);
        g.uniform2f(SU.uView, W, H);
        g.uniform1f(SU.uK, cam.k);
        g.uniform1f(SU.uPx, canvas.width / W);
        g.uniform1f(SU.uT, reduced ? 0 : t);
        g.uniform2f(SU.uZ, SNOW.z0, SNOW.z1);
        g.uniform3f(SU.uColor, sc[0], sc[1], sc[2]);
        g.uniform1f(SU.uAlpha, sIn);
        g.enable(g.BLEND);
        g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA);
        g.depthMask(false);
        g.bindVertexArray(snow.vao);
        g.drawArrays(g.POINTS, 0, snow.count);
      }
    }
    g.bindVertexArray(null);
  }

  /* ── loop: only runs while the hero is visible ────────────────────────── */
  const frame = (now: number) => {
    raf = 0;
    if (disposed || !visible) return;
    // phones / weak devices: 30 fps is plenty for slow ambient motion
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

  /* ── size ─────────────────────────────────────────────────────────────── */
  const resize = () => {
    const r = (canvas.parentElement ?? canvas).getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    let dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2);
    dpr = Math.min(dpr, Math.sqrt(4_200_000 / (W * H))); // never more than ~4 MP
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    if (reduced || t0 < 0) draw(performance.now());
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

  const io =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([e]) => {
          visible = e.isIntersecting && !document.hidden;
          if (visible) start();
        })
      : null;
  io?.observe(canvas);
  const onVis = () => {
    visible = !document.hidden;
    if (visible) start();
  };
  document.addEventListener("visibilitychange", onVis);

  /* if the GPU resets the context (rare), rebuild everything */
  const onLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const onRestored = () => {
    release();
    if (canvases) build(canvases);
    start();
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  /* ── theme (dark / light) ─────────────────────────────────────────────── */
  const host = canvas.parentElement;
  /** the hero stage gets the theme colour too, so nothing dark flashes before the first frame */
  function paintHost(th: SceneTheme) {
    if (host) host.style.background = bgCss(th);
  }
  paintHost(theme);

  function uploadTheme(th: SceneTheme, c: ThemeCanvases) {
    sets[th] = {
      ground: tex(c.ground),
      near: tex(c.streetNear),
      far: tex(c.streetFar),
      roadText: tex(c.roadText),
    };
  }

  function redraw() {
    if (reduced) draw(performance.now()); // static scene: no loop running
    start();
  }

  /** switch the scene to `next` (draws the other theme's textures the first time only) */
  function applyTheme(next: SceneTheme) {
    theme = next;
    if (!program) return; // not built yet: build() calls this again at its end
    if (sets[next]) {
      if (shown !== next) {
        shown = next;
        paintHost(shown);
        redraw();
      }
      return;
    }
    if (loadingTheme === next) return;
    loadingTheme = next;
    buildThemeCanvases(lite, next)
      .then((c) => {
        if (loadingTheme === next) loadingTheme = null;
        if (disposed || !program) return;
        if (!sets[next]) uploadTheme(next, c);
        if (theme === next) {
          shown = next;
          paintHost(shown);
          redraw();
        }
      })
      .catch(() => {
        if (loadingTheme === next) loadingTheme = null;
      });
  }

  const onThemeEvent = (e: Event) => {
    const d = (e as CustomEvent<string>).detail;
    applyTheme(d === "dark" || d === "light" ? d : readTheme());
  };
  window.addEventListener(THEME_EVENT, onThemeEvent);
  /* also watch the attribute itself: it changes a moment before the event,
     which keeps the canvas in step with the page during the theme transition */
  const mo =
    typeof MutationObserver !== "undefined"
      ? new MutationObserver(() => applyTheme(readTheme()))
      : null;
  const moOpts = { attributes: true, attributeFilter: ["data-theme", "class"] };
  mo?.observe(document.documentElement, moOpts);
  if (document.body) mo?.observe(document.body, moOpts);

  function release() {
    textures.forEach((x) => gl!.deleteTexture(x));
    buffers.forEach((x) => gl!.deleteBuffer(x));
    vaos.forEach((x) => gl!.deleteVertexArray(x));
    if (program) gl!.deleteProgram(program);
    if (snow) gl!.deleteProgram(snow.program);
    snow = null;
    sets = {};
    loadingTheme = null;
    textures = [];
    buffers = [];
    vaos = [];
    items = [];
    program = null;
  }

  /* textures are drawn during the loader; the reveal waits for them */
  buildCanvases(lite, BILLBOARD.len, BILLBOARD.h, () => theme)
    .then((c) => {
      if (disposed) return;
      canvases = c;
      build(c);
      tryStart();
    })
    .catch(() => undefined);

  let started = false;
  function tryStart() {
    if (started || !ready || !canvases) return;
    started = true;
    // wait two painted frames so nothing hitches when the animation begins
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        t0 = reduced ? performance.now() - 60_000 : performance.now();
        opts.onStart?.();
        start();
      }),
    );
  }

  return {
    setReady(r) {
      ready = r;
      tryStart();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(rt);
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener(THEME_EVENT, onThemeEvent);
      mo?.disconnect();
      if (host) host.style.background = "";
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      release();
    },
  };
}
