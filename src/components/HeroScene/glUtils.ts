/* Small WebGL helpers (no libraries): matrices, a mesh builder, a polygon
   triangulator for the letters, and shader compiling. */

export type Mat4 = Float32Array;
export type V3 = [number, number, number];
export type V2 = [number, number];
export type RGBA = [number, number, number, number];

/* ── matrices (column-major, same maths as CSS transforms) ──────────────── */
export const identity = (): Mat4 =>
  new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

/** a × b  (apply b first, then a — like writing CSS transforms left to right) */
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
export const scaleUniform = (s: number): Mat4 => {
  const m = identity();
  m[0] = m[5] = m[10] = s;
  return m;
};
const rad = (d: number) => (d * Math.PI) / 180;
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

/* ── mesh builder ───────────────────────────────────────────────────────── */
/** per vertex: x y z · u v · r g b a · kind u2   (11 floats) */
export const STRIDE = 11;

export class MeshBuilder {
  data: number[] = [];

  vert(p: V3, uv: V2, c: RGBA, kind = 0, u2 = 0) {
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
      u2,
    );
  }

  tri(p: V3[], uv: V2[], c: RGBA[], kind = 0, u2: number[] = [0, 0, 0]) {
    for (let i = 0; i < 3; i++) this.vert(p[i], uv[i], c[i], kind, u2[i]);
  }

  /** quad with corners in order around the shape; colour per corner (or one colour) */
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

  /** a flat horizontal rectangle at height z (uv = 0..1 across it, top-left = far-left) */
  flat(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    z: number,
    c: RGBA,
    uvScale?: V2,
  ) {
    const [su, sv] = uvScale ?? [1, 1];
    this.quad(
      [
        [x0, y0, z],
        [x1, y0, z],
        [x1, y1, z],
        [x0, y1, z],
      ],
      [
        [0, 0],
        [su, 0],
        [su, sv],
        [0, sv],
      ],
      c,
    );
  }

  /** the 3 faces of a block you can see: top, right (+x) and front (+y), with plain colours */
  box(
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    top: RGBA,
    right: RGBA,
    front: RGBA,
    tile = 256,
  ) {
    const z1 = z + h;
    const t = (px: number, py: number): V2 => [px / tile, py / tile];
    this.quad(
      [
        [x, y, z1],
        [x + w, y, z1],
        [x + w, y + d, z1],
        [x, y + d, z1],
      ],
      [t(x, y), t(x + w, y), t(x + w, y + d), t(x, y + d)],
      top,
    );
    this.quad(
      [
        [x + w, y + d, z1],
        [x + w, y, z1],
        [x + w, y, z],
        [x + w, y + d, z],
      ],
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      right,
    );
    this.quad(
      [
        [x, y + d, z1],
        [x + w, y + d, z1],
        [x + w, y + d, z],
        [x, y + d, z],
      ],
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      front,
    );
  }
}

/* ── polygon → triangles (ear clipping) for the letter outlines ─────────── */
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
  while (idx.length > 3 && guard++ < 500) {
    let clipped = false;
    for (let i = 0; i < idx.length; i++) {
      const a = idx[(i + idx.length - 1) % idx.length];
      const b = idx[i];
      const c = idx[(i + 1) % idx.length];
      if (cross(pts[a], pts[b], pts[c]) <= 1e-9) continue; // reflex / flat corner
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
