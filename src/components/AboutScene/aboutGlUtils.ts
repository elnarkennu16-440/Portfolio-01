/* ────────────────────────────────────────────────────────────────────────────
 * ABOUT SCENE — small WebGL helpers (no libraries): matrices + camera, a mesh
 * builder, low-poly "blobs" (for the cat), polygon triangulation (for the
 * rounded comment sign) and shader compiling.
 * World: x → right, y → up, z → toward the viewer. 1 unit ≈ 1 metre.
 * ──────────────────────────────────────────────────────────────────────────── */

export type Mat4 = Float32Array;
export type V3 = [number, number, number];
export type V2 = [number, number];
export type RGBA = [number, number, number, number];

/* ── matrices (column-major) ────────────────────────────────────────────── */
export const identity = (): Mat4 =>
  new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

/** a × b  (b is applied first) */
export function mul(a: Mat4, b: Mat4): Mat4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  }
  return o;
}
export const translate = (x: number, y: number, z: number): Mat4 => {
  const m = identity();
  m[12] = x;
  m[13] = y;
  m[14] = z;
  return m;
};
export const scale3 = (x: number, y: number, z: number): Mat4 => {
  const m = identity();
  m[0] = x;
  m[5] = y;
  m[10] = z;
  return m;
};
const rad = (d: number) => (d * Math.PI) / 180;
export const rotateY = (deg: number): Mat4 => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  const m = identity();
  m[0] = c;
  m[2] = -s;
  m[8] = s;
  m[10] = c;
  return m;
};
export const rotateX = (deg: number): Mat4 => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  const m = identity();
  m[5] = c;
  m[6] = s;
  m[9] = -s;
  m[10] = c;
  return m;
};
export const rotateZ = (deg: number): Mat4 => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  const m = identity();
  m[0] = c;
  m[1] = s;
  m[4] = -s;
  m[5] = c;
  return m;
};
/** rotate / scale around a pivot point */
export const around = (pivot: V3, m: Mat4): Mat4 =>
  mul(
    translate(pivot[0], pivot[1], pivot[2]),
    mul(m, translate(-pivot[0], -pivot[1], -pivot[2])),
  );

export function perspective(
  fovyDeg: number,
  aspect: number,
  near: number,
  far: number,
): Mat4 {
  const f = 1 / Math.tan(rad(fovyDeg) / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) / (near - far);
  m[11] = -1;
  m[14] = (2 * far * near) / (near - far);
  return m;
}

export function lookAt(eye: V3, target: V3, up: V3 = [0, 1, 0]): Mat4 {
  let zx = eye[0] - target[0];
  let zy = eye[1] - target[1];
  let zz = eye[2] - target[2];
  let l = Math.hypot(zx, zy, zz) || 1;
  zx /= l;
  zy /= l;
  zz /= l;
  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  l = Math.hypot(xx, xy, xz) || 1;
  xx /= l;
  xy /= l;
  xz /= l;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  const m = new Float32Array(16);
  m[0] = xx;
  m[1] = yx;
  m[2] = zx;
  m[4] = xy;
  m[5] = yy;
  m[6] = zy;
  m[8] = xz;
  m[9] = yz;
  m[10] = zz;
  m[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  m[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  m[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  m[15] = 1;
  return m;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
export const easeOut = (p: number) => 1 - Math.pow(1 - clamp01(p), 4);
/** small overshoot (for the comment sign "pop") */
export const easeOutBack = (p: number) => {
  const x = clamp01(p) - 1;
  return 1 + 2.2 * x * x * x + 1.2 * x * x;
};

/* ── mesh builder ───────────────────────────────────────────────────────── */
/** per vertex: x y z · u v · r g b a · kind extra   (11 floats) */
export const STRIDE = 11;

export class MeshBuilder {
  data: number[] = [];

  vert(p: V3, uv: V2, c: RGBA, kind = 0, extra = 0) {
    this.data.push(
      p[0],
      p[1],
      p[2],
      uv[0],
      uv[1],
      c[0],
      c[1],
      c[2],
      c[3],
      kind,
      extra,
    );
  }

  tri(p: V3[], uv: V2[], c: RGBA[], kind = 0) {
    for (let i = 0; i < 3; i++) this.vert(p[i], uv[i], c[i], kind);
  }

  /** quad: corners in order around the shape; one colour or one per corner */
  quad(p: V3[], uv: V2[], c: RGBA | RGBA[], kind = 0) {
    const cc = (Array.isArray(c[0]) ? c : [c, c, c, c]) as RGBA[];
    this.tri(
      [p[0], p[1], p[2]],
      [uv[0], uv[1], uv[2]],
      [cc[0], cc[1], cc[2]],
      kind,
    );
    this.tri(
      [p[0], p[2], p[3]],
      [uv[0], uv[2], uv[3]],
      [cc[0], cc[2], cc[3]],
      kind,
    );
  }

  /** flat rectangle on the ground (y = height). uv top-left = far-left (x0, z0) */
  ground(x0: number, z0: number, x1: number, z1: number, y: number, c: RGBA) {
    this.quad(
      [
        [x0, y, z0],
        [x1, y, z0],
        [x1, y, z1],
        [x0, y, z1],
      ],
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      c,
    );
  }

  /** a block seen from the front: top, front (+z), left (-x) and right (+x) faces, plain colours */
  box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    top: RGBA,
    front: RGBA,
    side: RGBA,
  ) {
    const x1 = x + w;
    const y1 = y + h;
    const z0 = z - d;
    const uv: V2[] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    this.quad(
      [
        [x, y1, z0],
        [x1, y1, z0],
        [x1, y1, z],
        [x, y1, z],
      ],
      uv,
      top,
    );
    this.quad(
      [
        [x, y1, z],
        [x1, y1, z],
        [x1, y, z],
        [x, y, z],
      ],
      uv,
      front,
    );
    this.quad(
      [
        [x1, y1, z],
        [x1, y1, z0],
        [x1, y, z0],
        [x1, y, z],
      ],
      uv,
      side,
    );
    this.quad(
      [
        [x, y1, z0],
        [x, y1, z],
        [x, y, z],
        [x, y, z0],
      ],
      uv,
      side,
    );
  }
}

/** small deterministic random generator (the scene looks the same on every load) */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── low-poly blob (flat-shaded ellipsoid) — used for the cat ───────────── */
const T = (1 + Math.sqrt(5)) / 2;
const ICO: V3[] = [
  [-1, T, 0],
  [1, T, 0],
  [-1, -T, 0],
  [1, -T, 0],
  [0, -1, T],
  [0, 1, T],
  [0, -1, -T],
  [0, 1, -T],
  [T, 0, -1],
  [T, 0, 1],
  [-T, 0, -1],
  [-T, 0, 1],
];
const ICO_F: [number, number, number][] = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
];
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const mid = (a: V3, b: V3): V3 =>
  norm([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]);

export type Shader = (n: V3, p: V3) => RGBA;

/** flat-shaded low-poly ellipsoid. `shade` turns a face normal into a colour (baked light). */
export function blob(
  mb: MeshBuilder,
  center: V3,
  radii: V3,
  shade: Shader,
  opts: {
    seed?: number;
    jitter?: number;
    rotY?: number;
    rotX?: number;
    rotZ?: number;
  } = {},
) {
  const r = rng(opts.seed ?? 1);
  const jit = opts.jitter ?? 0.06;
  const base = ICO.map(norm);
  const faces: [V3, V3, V3][] = [];
  for (const [a, b, c] of ICO_F) {
    const A = base[a],
      B = base[b],
      C = base[c];
    const ab = mid(A, B),
      bc = mid(B, C),
      ca = mid(C, A);
    faces.push([A, ab, ca], [B, bc, ab], [C, ca, bc], [ab, bc, ca]);
  }
  // one jitter per unique direction so neighbouring faces stay joined
  const cache = new Map<string, number>();
  const j = (v: V3) => {
    const k = v.map((n) => n.toFixed(3)).join(",");
    if (!cache.has(k)) cache.set(k, 1 + (r() - 0.5) * 2 * jit);
    return cache.get(k)!;
  };
  const m = mul(
    rotateY(opts.rotY ?? 0),
    mul(rotateX(opts.rotX ?? 0), rotateZ(opts.rotZ ?? 0)),
  );
  const place = (v: V3): V3 => {
    const k = j(v);
    const x = v[0] * radii[0] * k;
    const y = v[1] * radii[1] * k;
    const z = v[2] * radii[2] * k;
    return [
      m[0] * x + m[4] * y + m[8] * z + center[0],
      m[1] * x + m[5] * y + m[9] * z + center[1],
      m[2] * x + m[6] * y + m[10] * z + center[2],
    ];
  };
  for (const f of faces) {
    const p = f.map(place) as V3[];
    const e1: V3 = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]];
    const e2: V3 = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]];
    let n = norm([
      e1[1] * e2[2] - e1[2] * e2[1],
      e1[2] * e2[0] - e1[0] * e2[2],
      e1[0] * e2[1] - e1[1] * e2[0],
    ]);
    // make the normal point away from the centre
    const cx = (p[0][0] + p[1][0] + p[2][0]) / 3 - center[0];
    const cy = (p[0][1] + p[1][1] + p[2][1]) / 3 - center[1];
    const cz = (p[0][2] + p[1][2] + p[2][2]) / 3 - center[2];
    if (n[0] * cx + n[1] * cy + n[2] * cz < 0) n = [-n[0], -n[1], -n[2]];
    const c = shade(n, [cx + center[0], cy + center[1], cz + center[2]]);
    mb.tri(
      p,
      [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      [c, c, c],
    );
  }
}

/** a pointed 4-sided cone (cat ears) */
export function cone(
  mb: MeshBuilder,
  base: V3,
  height: number,
  radius: number,
  tilt: V3,
  shade: Shader,
) {
  const pts: V3[] = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    pts.push([
      base[0] + Math.cos(a) * radius,
      base[1],
      base[2] + Math.sin(a) * radius * 0.7,
    ]);
  }
  const tip: V3 = [base[0] + tilt[0], base[1] + height, base[2] + tilt[2]];
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const e1: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const e2: V3 = [tip[0] - a[0], tip[1] - a[1], tip[2] - a[2]];
    let n = norm([
      e1[1] * e2[2] - e1[2] * e2[1],
      e1[2] * e2[0] - e1[0] * e2[2],
      e1[0] * e2[1] - e1[1] * e2[0],
    ]);
    const mx = (a[0] + b[0]) / 2 - base[0];
    const mz = (a[2] + b[2]) / 2 - base[2];
    if (n[0] * mx + n[2] * mz < 0) n = [-n[0], -n[1], -n[2]];
    const c = shade(n, tip);
    mb.tri(
      [a, b, tip],
      [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      [c, c, c],
    );
  }
}

/* ── polygon → triangles (ear clipping) ─────────────────────────────────── */
export function triangulate(pts: V2[]): [number, number, number][] {
  const n = pts.length;
  const idx = Array.from({ length: n }, (_, i) => i);
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }
  if (area < 0) idx.reverse();
  const cross = (a: V2, b: V2, c: V2) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const inside = (p: V2, a: V2, b: V2, c: V2) =>
    cross(a, b, p) > 1e-9 && cross(b, c, p) > 1e-9 && cross(c, a, p) > 1e-9;
  const out: [number, number, number][] = [];
  let guard = 0;
  while (idx.length > 3 && guard++ < 2000) {
    let clipped = false;
    for (let i = 0; i < idx.length; i++) {
      const a = idx[(i + idx.length - 1) % idx.length];
      const b = idx[i];
      const c = idx[(i + 1) % idx.length];
      if (cross(pts[a], pts[b], pts[c]) <= 1e-9) continue;
      let ok = true;
      for (const j of idx) {
        if (j === a || j === b || j === c) continue;
        if (inside(pts[j], pts[a], pts[b], pts[c])) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      out.push([a, b, c]);
      idx.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) break;
  }
  if (idx.length === 3) out.push([idx[0], idx[1], idx[2]]);
  return out;
}

/* ── shaders ────────────────────────────────────────────────────────────── */
export function makeProgram(
  gl: WebGL2RenderingContext,
  vs: string,
  fs: string,
): WebGLProgram {
  const mk = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(s) || "shader error");
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(p) || "link error");
  return p;
}
