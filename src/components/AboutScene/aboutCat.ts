/* ────────────────────────────────────────────────────────────────────────────
 * ABOUT CAT — the cat on the near sidewalk, in its own file.
 *
 * A chubby black British Shorthair LYING down, built like a 3D-sculpt figure
 * (not a few low-poly blobs): the shape is a signed-distance model — soft,
 * blended ellipsoids + round cones (rump, back, shoulders, big round head with
 * full cheeks, small ears, muzzle, chin, nose, stretched front legs with toes,
 * two tucked hind paws with toe beans + pad, thick curled tail). That model is
 * turned into a smooth mesh ONCE (surface nets, ~25k triangles) and lit with
 * baked light: soft key + fill + rim + ambient occlusion + a little fur bump.
 * White eyes sit in soft sockets.
 *
 * Public contract (the same as the previous aboutCat.ts, so aboutGl.ts is unchanged):
 *   buildCat(lite: boolean): Promise<CatGeo>
 *   CatGeo = { body, head, eyes, tail, headPivot, tailPivot, eyesPivot }
 * The head turns around headPivot, the eyes blink around eyesPivot, the tail
 * sways around tailPivot. Position / size come from CAT in aboutSceneConfig.ts
 * (local coords: feet at y = 0, the head looks toward +z = the viewer).
 *
 * The mesh is generated in small time slices (never one long block), started a
 * moment after load while the browser is idle; buildCat() joins that same job
 * (and speeds it up) if the scene asks for the cat earlier. Built once, shared.
 *
 * TAIL WIGGLE (section 6): every tail vertex carries a "bone weight" (how far along the
 * tail it is) and CatGeo.tailPose(t) returns the bone matrices for time t. The engine
 * (aboutGl.ts) bends the tail with them in the vertex shader: slow, soft, side to side.
 * ──────────────────────────────────────────────────────────────────────────── */

import { MeshBuilder, RGBA, V2, V3 } from "./aboutGlUtils";

/** the coat. Black by default (same two names as before: COAT / COAT_GRAY).
 *  gain = overall brightness of the fur, cap = the brightest the fur can get (0-255). */
const COAT_BLACK = { gain: 1, cap: 124 };
/** light grey "British blue" like the reference photo */
export const COAT_GRAY = { gain: 3.4, cap: 235 };
/** which coat is used: COAT_BLACK (your black cat) or COAT_GRAY (the grey one in the photo) */
export const COAT = COAT_BLACK;

export interface CatGeo {
  body: MeshBuilder;
  head: MeshBuilder;
  eyes: MeshBuilder;
  tail: MeshBuilder;
  headPivot: V3;
  tailPivot: V3;
  eyesPivot: V3;
  /** bone matrices (TAIL_BONES × mat4, column-major) that bend the tail at time t (seconds
   *  since the reveal). The same array is reused on every call: upload it right away. */
  tailPose: (t: number) => Float32Array;
}

/* ════════════════════════════════════════════════════════════════════════════
 * 1 · SHAPE — signed-distance primitives
 * ════════════════════════════════════════════════════════════════════════════ */

const BIG = 1;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const now = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

/** soft union / soft subtraction (polynomial smooth-min) */
const smin = (a: number, b: number, k: number) => {
  if (k <= 0) return a < b ? a : b;
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);

interface Op {
  t: 0 | 1 | 2; // 0 ellipsoid · 1 round cone · 2 tube (polyline with radii)
  add: boolean; // false = carve away
  k: number; // blend size with what came before
  cx: number; // bounding sphere
  cy: number;
  cz: number;
  R: number;
  // ellipsoid
  rx: number;
  ry: number;
  rz: number;
  m: number[]; // world → local rotation (3×3, row major)
  // round cone
  ax: number;
  ay: number;
  az: number;
  bax: number;
  bay: number;
  baz: number;
  l2: number;
  rr: number;
  a2: number;
  il2: number;
  r1: number;
  r2: number;
  fz: number; // flatten along z (ears)
  // tube
  tp: number[];
  tr: number[];
}

const blank = (t: Op["t"], add: boolean, k: number): Op => ({
  t,
  add,
  k,
  cx: 0,
  cy: 0,
  cz: 0,
  R: 0,
  rx: 1,
  ry: 1,
  rz: 1,
  m: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  ax: 0,
  ay: 0,
  az: 0,
  bax: 0,
  bay: 0,
  baz: 0,
  l2: 1,
  rr: 0,
  a2: 1,
  il2: 1,
  r1: 0,
  r2: 0,
  fz: 1,
  tp: [],
  tr: [],
});

const mm = (a: number[], b: number[]): number[] => {
  const o = new Array<number>(9).fill(0);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      for (let k = 0; k < 3; k++) o[r * 3 + c] += a[r * 3 + k] * b[k * 3 + c];
  return o;
};
/** world → local for an ellipsoid turned by (x, y, z) degrees */
const rotInv = (ex: number, ey: number, ez: number): number[] => {
  const d = Math.PI / 180;
  const [cx, sx] = [Math.cos(ex * d), Math.sin(ex * d)];
  const [cy, sy] = [Math.cos(ey * d), Math.sin(ey * d)];
  const [cz, sz] = [Math.cos(ez * d), Math.sin(ez * d)];
  const Rx = [1, 0, 0, 0, cx, -sx, 0, sx, cx];
  const Ry = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
  const Rz = [cz, -sz, 0, sz, cz, 0, 0, 0, 1];
  const R = mm(Rz, mm(Ry, Rx));
  return [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]];
};

/** soft ellipsoid: centre, radii, blend, tilt (deg) */
const E = (c: V3, r: V3, k = 0.05, rot: V3 = [0, 0, 0], add = true): Op => {
  const o = blank(0, add, k);
  [o.cx, o.cy, o.cz] = c;
  [o.rx, o.ry, o.rz] = r;
  o.R = Math.max(r[0], r[1], r[2]);
  o.m = rotInv(rot[0], rot[1], rot[2]);
  return o;
};

/** round cone from a to b (radius r1 → r2); fz < 1 flattens it along z */
const C = (
  a: V3,
  b: V3,
  r1: number,
  r2: number,
  k = 0.05,
  fz = 1,
  add = true,
): Op => {
  const o = blank(1, add, k);
  [o.ax, o.ay, o.az] = a;
  o.bax = b[0] - a[0];
  o.bay = b[1] - a[1];
  o.baz = b[2] - a[2];
  o.l2 = o.bax * o.bax + o.bay * o.bay + o.baz * o.baz;
  o.rr = r1 - r2;
  o.a2 = o.l2 - o.rr * o.rr;
  o.il2 = 1 / o.l2;
  o.r1 = r1;
  o.r2 = r2;
  o.fz = fz;
  o.cx = (a[0] + b[0]) / 2;
  o.cy = (a[1] + b[1]) / 2;
  o.cz = (a[2] + b[2]) / 2;
  o.R = 0.5 * Math.sqrt(o.l2) + Math.max(r1, r2);
  return o;
};

/** tube along a polyline, radius per point (tail) */
const Tb = (pts: V3[], radii: number[], k = 0.05): Op => {
  const o = blank(2, true, k);
  o.tr = radii;
  let lo: V3 = [1e9, 1e9, 1e9];
  let hi: V3 = [-1e9, -1e9, -1e9];
  for (const p of pts) {
    o.tp.push(p[0], p[1], p[2]);
    lo = [Math.min(lo[0], p[0]), Math.min(lo[1], p[1]), Math.min(lo[2], p[2])];
    hi = [Math.max(hi[0], p[0]), Math.max(hi[1], p[1]), Math.max(hi[2], p[2])];
  }
  o.cx = (lo[0] + hi[0]) / 2;
  o.cy = (lo[1] + hi[1]) / 2;
  o.cz = (lo[2] + hi[2]) / 2;
  o.R =
    0.5 * Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) +
    Math.max(...radii);
  return o;
};

function shape(o: Op, x: number, y: number, z: number): number {
  if (o.t === 0) {
    const dx = x - o.cx;
    const dy = y - o.cy;
    const dz = z - o.cz;
    const m = o.m;
    const lx = m[0] * dx + m[1] * dy + m[2] * dz;
    const ly = m[3] * dx + m[4] * dy + m[5] * dz;
    const lz = m[6] * dx + m[7] * dy + m[8] * dz;
    const ax = lx / o.rx;
    const ay = ly / o.ry;
    const az = lz / o.rz;
    const k0 = Math.sqrt(ax * ax + ay * ay + az * az);
    const bx = ax / o.rx;
    const by = ay / o.ry;
    const bz = az / o.rz;
    const k1 = Math.sqrt(bx * bx + by * by + bz * bz);
    return k1 < 1e-9 ? -Math.min(o.rx, o.ry, o.rz) : (k0 * (k0 - 1)) / k1;
  }
  if (o.t === 1) {
    // round cone (iq), optionally flattened along z
    const zz0 = o.fz === 1 ? z : o.cz + (z - o.cz) / o.fz;
    const pax = x - o.ax;
    const pay = y - o.ay;
    const paz = zz0 - o.az;
    const yy = pax * o.bax + pay * o.bay + paz * o.baz;
    const zz = yy - o.l2;
    const qx = pax * o.l2 - o.bax * yy;
    const qy = pay * o.l2 - o.bay * yy;
    const qz = paz * o.l2 - o.baz * yy;
    const x2 = qx * qx + qy * qy + qz * qz;
    const y2 = yy * yy * o.l2;
    const z2 = zz * zz * o.l2;
    const kk = Math.sign(o.rr) * o.rr * o.rr * x2;
    let d: number;
    if (Math.sign(zz) * o.a2 * z2 > kk) d = Math.sqrt(x2 + z2) * o.il2 - o.r2;
    else if (Math.sign(yy) * o.a2 * y2 < kk)
      d = Math.sqrt(x2 + y2) * o.il2 - o.r1;
    else d = (Math.sqrt(x2 * o.a2 * o.il2) + yy * o.rr) * o.il2 - o.r1;
    return d * o.fz;
  }
  // tube
  let best = 1e9;
  const tp = o.tp;
  const tr = o.tr;
  for (let i = 0; i + 1 < tr.length; i++) {
    const ax = tp[i * 3];
    const ay = tp[i * 3 + 1];
    const az = tp[i * 3 + 2];
    const bx = tp[i * 3 + 3] - ax;
    const by = tp[i * 3 + 4] - ay;
    const bz = tp[i * 3 + 5] - az;
    const px = x - ax;
    const py = y - ay;
    const pz = z - az;
    const h = clamp01(
      (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz),
    );
    const ex = px - bx * h;
    const ey = py - by * h;
    const ez = pz - bz * h;
    const d =
      Math.sqrt(ex * ex + ey * ey + ez * ez) -
      (tr[i] + (tr[i + 1] - tr[i]) * h);
    if (d < best) best = d;
  }
  return best;
}

/* ── a part (one mesh) = ordered list of ops, evaluated with a spatial index ── */
interface Part {
  ops: Op[];
  floor: boolean; // cut flat just under the ground (it is hidden by the street)
}

function evalList(
  part: Part,
  list: ArrayLike<number>,
  x: number,
  y: number,
  z: number,
) {
  let d = BIG;
  for (let n = 0; n < list.length; n++) {
    const o = part.ops[list[n]];
    const s = shape(o, x, y, z);
    d = o.add ? smin(d, s, o.k) : smax(d, -s, o.k);
  }
  if (part.floor) d = Math.max(d, -(y + 0.012));
  return d;
}

/** brute-force evaluation (only used for a handful of one-off queries) */
function evalSlow(part: Part, x: number, y: number, z: number) {
  const all = part.ops.map((_, i) => i);
  return evalList(part, all, x, y, z);
}

const BLOCK = 8; // cells per block

interface Field {
  part: Part;
  x0: number;
  y0: number;
  z0: number;
  h: number;
  nx: number;
  ny: number;
  nz: number;
  bnx: number;
  bny: number;
  bnz: number;
  lists: number[][];
  vals: Float32Array;
}

function makeField(part: Part, h: number): Field {
  let lo: V3 = [1e9, 1e9, 1e9];
  let hi: V3 = [-1e9, -1e9, -1e9];
  for (const o of part.ops) {
    if (!o.add) continue;
    const r = o.R + 0.03;
    lo = [
      Math.min(lo[0], o.cx - r),
      Math.min(lo[1], o.cy - r),
      Math.min(lo[2], o.cz - r),
    ];
    hi = [
      Math.max(hi[0], o.cx + r),
      Math.max(hi[1], o.cy + r),
      Math.max(hi[2], o.cz + r),
    ];
  }
  if (part.floor) lo[1] = Math.max(lo[1], -0.03);
  const nx = Math.ceil((hi[0] - lo[0]) / h);
  const ny = Math.ceil((hi[1] - lo[1]) / h);
  const nz = Math.ceil((hi[2] - lo[2]) / h);
  const bnx = Math.ceil(nx / BLOCK);
  const bny = Math.ceil(ny / BLOCK);
  const bnz = Math.ceil(nz / BLOCK);
  const lists: number[][] = [];
  const bs = BLOCK * h;
  const br = bs * 0.8661; // half the block diagonal
  for (let bk = 0; bk < bnz; bk++)
    for (let bj = 0; bj < bny; bj++)
      for (let bi = 0; bi < bnx; bi++) {
        const cx = lo[0] + (bi + 0.5) * bs;
        const cy = lo[1] + (bj + 0.5) * bs;
        const cz = lo[2] + (bk + 0.5) * bs;
        const list: number[] = [];
        part.ops.forEach((o, n) => {
          const reach = o.R + o.k + 0.05 + br;
          const dx = cx - o.cx;
          const dy = cy - o.cy;
          const dz = cz - o.cz;
          if (dx * dx + dy * dy + dz * dz <= reach * reach) list.push(n);
        });
        lists.push(list);
      }
  const vals = new Float32Array((nx + 1) * (ny + 1) * (nz + 1)).fill(BIG);
  return {
    part,
    x0: lo[0],
    y0: lo[1],
    z0: lo[2],
    h,
    nx,
    ny,
    nz,
    bnx,
    bny,
    bnz,
    lists,
    vals,
  };
}

/** distance at any point (uses the block's short op list) */
function sdf(f: Field, x: number, y: number, z: number) {
  const bs = BLOCK * f.h;
  let bi = Math.floor((x - f.x0) / bs);
  let bj = Math.floor((y - f.y0) / bs);
  let bk = Math.floor((z - f.z0) / bs);
  bi = bi < 0 ? 0 : bi >= f.bnx ? f.bnx - 1 : bi;
  bj = bj < 0 ? 0 : bj >= f.bny ? f.bny - 1 : bj;
  bk = bk < 0 ? 0 : bk >= f.bnz ? f.bnz - 1 : bk;
  return evalList(f.part, f.lists[(bk * f.bny + bj) * f.bnx + bi], x, y, z);
}

/* ════════════════════════════════════════════════════════════════════════════
 * 2 · THE CAT — every number below is a piece of the sculpt
 *     (local coords: feet y = 0, nose toward +z, body runs along x, head at +x)
 * ════════════════════════════════════════════════════════════════════════════ */

const HX = 0.48; // head centre x
const HY = 0.64; // head centre y
const HZ = 0.11; // head centre z
const EYE_Y = 0.662;
const EYE_DX = 0.094;

/** places that get a lighter "pad" tone (nose, sole pads) and the inner ears */
interface Tone {
  c: V3;
  r: V3;
  kind: "pad" | "ear";
}

interface Model {
  body: Part;
  head: Part;
  tail: Part;
  tones: Tone[];
  eyeZ: [number, number]; // where the face surface is at each eye (before the sockets)
  tailPts: V3[]; // centre line of the tail (the bones are placed along it)
}

function hindPaw(
  x: number,
  y: number,
  z: number,
  from: V3,
  tones: Tone[],
): Op[] {
  // sole toward the viewer: four toe beans on top, one big pad below
  const toe = (dx: number, dy: number, dz: number) =>
    E([x + dx, y + dy, z + dz], [0.022, 0.026, 0.02], 0.008);
  tones.push({
    c: [x, y - 0.012, z + 0.04],
    r: [0.04, 0.032, 0.03],
    kind: "pad",
  });
  return [
    C(from, [x, y + 0.012, z - 0.03], 0.085, 0.07, 0.05),
    E([x, y, z], [0.07, 0.074, 0.05], 0.03),
    toe(-0.047, 0.056, 0.028),
    toe(-0.016, 0.07, 0.034),
    toe(0.016, 0.07, 0.034),
    toe(0.047, 0.056, 0.028),
    E([x, y - 0.012, z + 0.04], [0.036, 0.028, 0.016], 0.01),
  ];
}

function frontPaw(from: V3, wrist: V3, paw: V3, toes: V3[], r1: number): Op[] {
  return [
    C(from, wrist, r1, 0.074, 0.06),
    E(paw, [0.088, 0.054, 0.07], 0.03),
    ...toes.map((t) => E(t, [0.032, 0.03, 0.028], 0.01)),
  ];
}

function tailPath(): { pts: V3[]; radii: number[] } {
  const pts: V3[] = [];
  const radii: number[] = [];
  const N = 24;
  const cx = -0.62; // centre of the curl
  const cz = 0.3;
  const R = 0.275;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = ((-90 - 188 * t) * Math.PI) / 180;
    const r = 0.108 - 0.04 * Math.pow(t, 1.2); // thick root, rounded tip
    const rest = r + 0.004; // lies on the ground
    const y = 0.17 + (rest - 0.17) * smoothstep(0, 0.32, t);
    pts.push([cx + R * Math.cos(a), y, cz + R * Math.sin(a)]);
    radii.push(r);
  }
  return { pts, radii };
}

function surfaceZ(part: Part, x: number, y: number): number {
  // walk from the front toward the head until we are inside, then bisect
  let zo = 0.75;
  let zi = HZ;
  for (let z = 0.75; z > HZ; z -= 0.01) {
    if (evalSlow(part, x, y, z) < 0) {
      zi = z;
      break;
    }
    zo = z;
  }
  for (let i = 0; i < 24; i++) {
    const zm = (zo + zi) / 2;
    if (evalSlow(part, x, y, zm) < 0) zi = zm;
    else zo = zm;
  }
  return (zo + zi) / 2;
}

function buildModel(): Model {
  const tones: Tone[] = [];

  /* ── body: rump, back, shoulders, chest, belly, haunch, hind paws, front legs ── */
  const body: Op[] = [
    E([-0.45, 0.235, 0.0], [0.27, 0.235, 0.285], 0.1, [0, 0, -3]), // rump (lower than the back)
    E([-0.13, 0.29, 0.0], [0.37, 0.285, 0.29], 0.11, [0, 0, 3]), // long back
    E([0.22, 0.305, 0.06], [0.27, 0.29, 0.27], 0.11), // shoulders
    E([0.4, 0.28, 0.12], [0.2, 0.27, 0.22], 0.08), // chest, under the chin
    E([-0.1, 0.1, 0.04], [0.52, 0.115, 0.31], 0.07), // belly resting on the floor
    E([-0.31, 0.215, 0.19], [0.19, 0.185, 0.14], 0.07), // near haunch
    ...hindPaw(-0.337, 0.075, 0.335, [-0.33, 0.19, 0.2], tones),
    ...hindPaw(-0.169, 0.088, 0.345, [-0.17, 0.2, 0.2], tones),
    // near front leg: bent, paw right under the chin
    ...frontPaw(
      [0.33, 0.2, 0.25],
      [0.46, 0.06, 0.33],
      [0.5, 0.052, 0.335],
      [
        [0.552, 0.045, 0.372],
        [0.578, 0.045, 0.338],
        [0.578, 0.045, 0.3],
      ],
      0.112,
    ),
    // far front leg: stretched out forward, paw to the right of the chin
    ...frontPaw(
      [0.36, 0.2, 0.05],
      [0.7, 0.065, 0.1],
      [0.78, 0.058, 0.105],
      [
        [0.858, 0.05, 0.065],
        [0.866, 0.05, 0.105],
        [0.858, 0.05, 0.145],
      ],
      0.112,
    ),
  ];

  /* ── head: round skull, full cheeks, muzzle, chin, small ears, nose ── */
  const headBase: Op[] = [
    E([HX, HY, HZ], [0.272, 0.232, 0.25], 0), // skull
    E([HX - 0.165, 0.572, 0.2], [0.136, 0.114, 0.128], 0.06), // cheek L
    E([HX + 0.165, 0.572, 0.2], [0.136, 0.114, 0.128], 0.06), // cheek R
    E([HX, 0.545, 0.312], [0.105, 0.068, 0.064], 0.04), // muzzle
    E([HX - 0.048, 0.543, 0.32], [0.057, 0.047, 0.046], 0.02), // whisker pad L
    E([HX + 0.048, 0.543, 0.32], [0.057, 0.047, 0.046], 0.02), // whisker pad R
    E([HX, 0.462, 0.29], [0.07, 0.048, 0.05], 0.04), // chin
    E([HX - 0.015, 0.42, 0.09], [0.19, 0.16, 0.17], 0.07), // neck (hidden in the chest)
    C(
      [HX - 0.178, 0.8, 0.075],
      [HX - 0.205, 0.905, 0.078],
      0.072,
      0.013,
      0.035,
      0.42,
    ), // ear L
    C(
      [HX + 0.178, 0.8, 0.075],
      [HX + 0.205, 0.905, 0.078],
      0.072,
      0.013,
      0.035,
      0.42,
    ), // ear R
    E([HX, 0.6, 0.354], [0.033, 0.022, 0.02], 0.012), // nose
  ];
  tones.push({ c: [HX, 0.6, 0.354], r: [0.037, 0.027, 0.03], kind: "pad" });
  // inner ears: a soft dent on the front of each ear
  for (const s of [-1, 1]) {
    headBase.push(
      E(
        [HX + s * 0.186, 0.845, 0.108],
        [0.036, 0.052, 0.026],
        0.02,
        [0, 0, -s * 8],
        false,
      ),
    );
    tones.push({
      c: [HX + s * 0.186, 0.845, 0.1],
      r: [0.038, 0.054, 0.03],
      kind: "ear",
    });
  }

  // eye sockets: dented into the face where the eyes will sit
  const preCarve: Part = { ops: headBase.slice(), floor: false };
  const eyeZ: [number, number] = [
    surfaceZ(preCarve, HX - EYE_DX, EYE_Y),
    surfaceZ(preCarve, HX + EYE_DX, EYE_Y),
  ];
  const sockets = [-1, 1].map((s, i) =>
    E(
      [HX + s * EYE_DX, EYE_Y, eyeZ[i] + 0.024],
      [0.054, 0.042, 0.04],
      0.02,
      [0, 0, 0],
      false,
    ),
  );

  /* ── tail: thick, tapering, curls round the rump toward the front ── */
  const tp = tailPath();

  return {
    body: { ops: body, floor: true },
    head: { ops: [...headBase, ...sockets], floor: false },
    tail: { ops: [Tb(tp.pts, tp.radii, 0)], floor: true },
    tones,
    eyeZ,
    tailPts: tp.pts,
  };
}

/* ════════════════════════════════════════════════════════════════════════════
 * 3 · MESH — surface nets over the distance field (done in small time slices)
 * ════════════════════════════════════════════════════════════════════════════ */

interface Pace {
  last: number;
  due(): boolean;
  reset(): void;
}
const makePace = (ms: number): Pace => {
  const p: Pace = {
    last: now(),
    due: () => now() - p.last > ms,
    reset: () => {
      p.last = now();
    },
  };
  return p;
};

function* fillField(f: Field, pace: Pace): Generator<void, void, void> {
  const { nx, ny, nz, h } = f;
  const nxp = nx + 1;
  const nyp = ny + 1;
  for (let bk = 0; bk < f.bnz; bk++)
    for (let bj = 0; bj < f.bny; bj++)
      for (let bi = 0; bi < f.bnx; bi++) {
        const list = f.lists[(bk * f.bny + bj) * f.bnx + bi];
        if (!list.length) continue;
        const i1 = Math.min((bi + 1) * BLOCK, nx);
        const j1 = Math.min((bj + 1) * BLOCK, ny);
        const k1 = Math.min((bk + 1) * BLOCK, nz);
        for (let k = bk * BLOCK; k <= k1; k++)
          for (let j = bj * BLOCK; j <= j1; j++)
            for (let i = bi * BLOCK; i <= i1; i++)
              f.vals[(k * nyp + j) * nxp + i] = evalList(
                f.part,
                list,
                f.x0 + i * h,
                f.y0 + j * h,
                f.z0 + k * h,
              );
        if (pace.due()) {
          yield;
          pace.reset();
        }
      }
}

interface Mesh {
  pos: number[]; // xyz per vertex
  nrm: number[]; // unit normal per vertex
  idx: number[]; // triangles
}

function* meshField(f: Field, pace: Pace): Generator<void, Mesh, void> {
  const { nx, ny, nz, h, vals } = f;
  const nxp = nx + 1;
  const nyp = ny + 1;
  const sy = nxp;
  const sz = nxp * nyp;
  const off = [0, 1, sy, 1 + sy, sz, 1 + sz, sy + sz, 1 + sy + sz];
  const edges: [number, number][] = [];
  for (let c = 0; c < 8; c++)
    for (const b of [1, 2, 4]) if (!(c & b)) edges.push([c, c | b]);

  const cellVert = new Int32Array(nx * ny * nz).fill(-1);
  const cid = (i: number, j: number, k: number) => (k * ny + j) * nx + i;
  const pos: number[] = [];
  const nrm: number[] = [];
  const idx: number[] = [];
  const v = new Float32Array(8);
  const eps = h * 0.4;

  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const base = k * sz + j * sy + i;
        let neg = 0;
        for (let c = 0; c < 8; c++) {
          v[c] = vals[base + off[c]];
          if (v[c] < 0) neg++;
        }
        if (neg === 0 || neg === 8) continue;
        let ax = 0;
        let ay = 0;
        let az = 0;
        let cnt = 0;
        for (const [a, b] of edges) {
          if (v[a] < 0 === v[b] < 0) continue;
          const t = v[a] / (v[a] - v[b]);
          ax += (a & 1) + ((b & 1) - (a & 1)) * t;
          ay += ((a >> 1) & 1) + (((b >> 1) & 1) - ((a >> 1) & 1)) * t;
          az += ((a >> 2) & 1) + (((b >> 2) & 1) - ((a >> 2) & 1)) * t;
          cnt++;
        }
        let px = f.x0 + (i + ax / cnt) * h;
        let py = f.y0 + (j + ay / cnt) * h;
        let pz = f.z0 + (k + az / cnt) * h;
        // one Newton step onto the true surface (keeps toes / ears crisp)
        const d = sdf(f, px, py, pz);
        const gx =
          (sdf(f, px + eps, py, pz) - sdf(f, px - eps, py, pz)) / (2 * eps);
        const gy =
          (sdf(f, px, py + eps, pz) - sdf(f, px, py - eps, pz)) / (2 * eps);
        const gz =
          (sdf(f, px, py, pz + eps) - sdf(f, px, py, pz - eps)) / (2 * eps);
        const g2 = gx * gx + gy * gy + gz * gz;
        if (g2 > 1e-8) {
          let sx = (d * gx) / g2;
          let sy2 = (d * gy) / g2;
          let sz2 = (d * gz) / g2;
          const sl = Math.sqrt(sx * sx + sy2 * sy2 + sz2 * sz2);
          const lim = h * 0.6;
          if (sl > lim) {
            sx *= lim / sl;
            sy2 *= lim / sl;
            sz2 *= lim / sl;
          }
          px -= sx;
          py -= sy2;
          pz -= sz2;
        }
        const gl = Math.sqrt(g2) || 1;
        cellVert[cid(i, j, k)] = pos.length / 3;
        pos.push(px, py, pz);
        nrm.push(gx / gl, gy / gl, gz / gl);
      }
    if (pace.due()) {
      yield;
      pace.reset();
    }
  }

  // one quad around every grid edge that crosses the surface
  const quad = (a: number, b: number, c: number, d: number) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    idx.push(a, b, c, a, c, d);
  };
  for (let k = 0; k <= nz; k++)
    for (let j = 0; j <= ny; j++)
      for (let i = 0; i <= nx; i++) {
        const here = vals[k * sz + j * sy + i] < 0;
        if (
          i < nx &&
          j >= 1 &&
          k >= 1 &&
          j < ny + 0 &&
          k < nz &&
          here !== vals[k * sz + j * sy + i + 1] < 0
        )
          quad(
            cellVert[cid(i, j - 1, k - 1)],
            cellVert[cid(i, j, k - 1)],
            cellVert[cid(i, j, k)],
            cellVert[cid(i, j - 1, k)],
          );
        if (
          j < ny &&
          i >= 1 &&
          k >= 1 &&
          i < nx &&
          k < nz &&
          here !== vals[k * sz + (j + 1) * sy + i] < 0
        )
          quad(
            cellVert[cid(i - 1, j, k - 1)],
            cellVert[cid(i, j, k - 1)],
            cellVert[cid(i, j, k)],
            cellVert[cid(i - 1, j, k)],
          );
        if (
          k < nz &&
          i >= 1 &&
          j >= 1 &&
          i < nx &&
          j < ny &&
          here !== vals[(k + 1) * sz + j * sy + i] < 0
        )
          quad(
            cellVert[cid(i - 1, j - 1, k)],
            cellVert[cid(i, j - 1, k)],
            cellVert[cid(i, j, k)],
            cellVert[cid(i - 1, j, k)],
          );
      }
  return { pos, nrm, idx };
}

/* ════════════════════════════════════════════════════════════════════════════
 * 4 · LIGHT — baked per vertex (soft key + fill + rim + AO + fur bump)
 * ════════════════════════════════════════════════════════════════════════════ */

const unit3 = (x: number, y: number, z: number): V3 => {
  const l = Math.sqrt(x * x + y * y + z * z) || 1;
  return [x / l, y / l, z / l];
};
const KEY = unit3(-0.42, 0.74, 0.52); // front-left, above (like the street lamp side)
const FILL = unit3(0.75, 0.25, 0.6);
const VIEW = unit3(0, 0.18, 0.98); // roughly where the camera is, seen from the cat
const HALF = unit3(KEY[0] + VIEW[0], KEY[1] + VIEW[1], KEY[2] + VIEW[2]);
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const hash3 = (x: number, y: number, z: number) => {
  let h =
    Math.imul(x, 374761393) ^
    Math.imul(y, 668265263) ^
    Math.imul(z, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const vnoise = (x: number, y: number, z: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const fx = x - xi;
  const fy = y - yi;
  const fz = z - zi;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const w = fz * fz * (3 - 2 * fz);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return l(
    l(
      l(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u),
      l(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u),
      v,
    ),
    l(
      l(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u),
      l(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u),
      v,
    ),
    w,
  );
};

/** fur: small streaks along the body + a few soft wrinkles, as a normal wobble */
function furNormal(n: V3, x: number, y: number, z: number, amt: number): V3 {
  const q = (sx: number, sy: number, sz: number): V3 => {
    const X = x * sx;
    const Y = y * sy;
    const Z = z * sz;
    const e = 0.6;
    return [
      vnoise(X + e, Y, Z) - vnoise(X - e, Y, Z),
      vnoise(X, Y + e, Z) - vnoise(X, Y - e, Z),
      vnoise(X, Y, Z + e) - vnoise(X, Y, Z - e),
    ];
  };
  const a = q(30, 46, 46);
  const b = q(6, 8, 8);
  let gx = a[0] * 0.42 * amt + b[0] * 0.2 * amt;
  let gy = a[1] * 0.42 * amt + b[1] * 0.2 * amt;
  let gz = a[2] * 0.42 * amt + b[2] * 0.2 * amt;
  const dn = gx * n[0] + gy * n[1] + gz * n[2];
  gx -= n[0] * dn;
  gy -= n[1] * dn;
  gz -= n[2] * dn;
  return unit3(n[0] - gx, n[1] - gy, n[2] - gz);
}

/* mouth: a soft darker "ω" on the muzzle, painted into the light */
const MOUTH: [V2, V2][] = [
  [
    [HX, 0.585],
    [HX, 0.553],
  ],
  [
    [HX, 0.553],
    [HX - 0.026, 0.537],
  ],
  [
    [HX - 0.026, 0.537],
    [HX - 0.052, 0.545],
  ],
  [
    [HX, 0.553],
    [HX + 0.026, 0.537],
  ],
  [
    [HX + 0.026, 0.537],
    [HX + 0.052, 0.545],
  ],
];
const segDist = (px: number, py: number, a: V2, b: V2) => {
  const bx = b[0] - a[0];
  const by = b[1] - a[1];
  const h = clamp01(
    ((px - a[0]) * bx + (py - a[1]) * by) / (bx * bx + by * by),
  );
  return Math.hypot(px - a[0] - bx * h, py - a[1] - by * h);
};

function* shadeMesh(
  m: Mesh,
  all: (x: number, y: number, z: number) => number,
  tones: Tone[],
  fur: number,
  pace: Pace,
): Generator<void, Float32Array, void> {
  const n = m.pos.length / 3;
  const out = new Float32Array(n);
  const AO_H = [0.02, 0.05, 0.09, 0.14];
  for (let i = 0; i < n; i++) {
    const x = m.pos[i * 3];
    const y = m.pos[i * 3 + 1];
    const z = m.pos[i * 3 + 2];
    let nn: V3 = [m.nrm[i * 3], m.nrm[i * 3 + 1], m.nrm[i * 3 + 2]];

    // which special place is this vertex in?
    let padK = 0;
    let earK = 0;
    for (const t of tones) {
      const dx = (x - t.c[0]) / t.r[0];
      const dy = (y - t.c[1]) / t.r[1];
      const dz = (z - t.c[2]) / t.r[2];
      const q = 1 - (dx * dx + dy * dy + dz * dz);
      if (q > 0) {
        if (t.kind === "pad") padK = Math.max(padK, Math.min(1, q * 2));
        else earK = Math.max(earK, Math.min(1, q * 2));
      }
    }
    if (!padK) nn = furNormal(nn, x, y, z, fur);

    // ambient occlusion from the whole cat
    let occ = 0;
    let w = 1;
    for (const hh of AO_H) {
      occ += (hh - all(x + nn[0] * hh, y + nn[1] * hh, z + nn[2] * hh)) * w;
      w *= 0.62;
    }
    let ao = clamp01(1 - occ * 5.2);
    ao = 0.12 + 0.88 * ao;
    ao *= 0.6 + 0.4 * smoothstep(0, 0.075, y); // darker where it touches the ground

    const diff = Math.pow(clamp01(dot3(nn, KEY) * 0.5 + 0.5), 2);
    const fill = Math.max(0, dot3(nn, FILL));
    const sky = nn[1] * 0.5 + 0.5;
    const ndv = clamp01(dot3(nn, VIEW));
    const rim =
      Math.pow(1 - ndv, 2.4) *
      (0.35 + 0.65 * clamp01(0.55 * nn[1] + 0.45 - 0.25 * nn[0]));
    const spec = Math.pow(clamp01(dot3(nn, HALF)), 20);

    let lum =
      4 +
      ao * (33 * diff + 6 * fill + 5 * sky) +
      30 * rim * (0.35 + 0.65 * ao) +
      15 * spec * ao;
    if (earK) lum = lum * (1 + 0.35 * earK) + 5 * earK;
    if (padK) lum = lum + 14 * padK + 9 * padK * diff;

    // mouth line (front of the muzzle only)
    if (z > 0.27 && y < 0.6 && y > 0.5) {
      let dm = 1;
      for (const s of MOUTH) dm = Math.min(dm, segDist(x, y, s[0], s[1]));
      lum *= 1 - 0.55 * Math.exp(-((dm / 0.009) * (dm / 0.009)));
    }
    out[i] = Math.min(COAT.cap, lum * COAT.gain) / 255;

    if ((i & 255) === 255 && pace.due()) {
      yield;
      pace.reset();
    }
  }
  return out;
}

/* ════════════════════════════════════════════════════════════════════════════
 * 5 · PUT IT TOGETHER
 * ════════════════════════════════════════════════════════════════════════════ */

const UV0: V2 = [0, 0];

function toBuilder(
  m: Mesh,
  lum: Float32Array,
  weight?: Float32Array,
): MeshBuilder {
  const mb = new MeshBuilder();
  for (let t = 0; t < m.idx.length; t++) {
    const vi = m.idx[t];
    const g = lum[vi];
    const c: RGBA = [g, g, g, 1];
    mb.vert(
      [m.pos[vi * 3], m.pos[vi * 3 + 1], m.pos[vi * 3 + 2]],
      UV0,
      c,
      0,
      weight ? weight[vi] : 0,
    );
  }
  return mb;
}

/** the two white eyes: soft domes that follow the face (so they sit in the sockets) */
function buildEyes(head: Field): MeshBuilder {
  const mb = new MeshBuilder();
  const hw = 0.046;
  const hh = 0.03;
  const SEG = 20;
  const lift = (x: number, y: number) => {
    // find the face surface here (walk in from the front, then bisect)
    let zo = 0.75;
    let zi = HZ;
    for (let z = 0.75; z > HZ; z -= 0.01) {
      if (sdf(head, x, y, z) < 0) {
        zi = z;
        break;
      }
      zo = z;
    }
    for (let i = 0; i < 22; i++) {
      const zm = (zo + zi) / 2;
      if (sdf(head, x, y, zm) < 0) zi = zm;
      else zo = zm;
    }
    return (zo + zi) / 2;
  };
  for (const s of [-1, 1]) {
    const cx = HX + s * EYE_DX;
    const th = -s * 0.12; // inner corner a touch higher
    const ring = (k: number, dome: number): { p: V3; g: number }[] => {
      const pts: { p: V3; g: number }[] = [];
      for (let i = 0; i < SEG; i++) {
        const a = (i / SEG) * Math.PI * 2;
        const lx = Math.cos(a) * hw * k;
        const ly = Math.sin(a) * hh * k;
        const x = cx + lx * Math.cos(th) - ly * Math.sin(th);
        const y = EYE_Y + lx * Math.sin(th) + ly * Math.cos(th);
        pts.push({
          p: [x, y, lift(x, y) + 0.0045 + 0.006 * dome],
          g: 1 - 0.1 * k * k,
        });
      }
      return pts;
    };
    const c0: V3 = [cx, EYE_Y, lift(cx, EYE_Y) + 0.0105];
    const r1 = ring(0.55, 0.7);
    const r2 = ring(1, 0);
    const tri = (a: V3, ga: number, b: V3, gb: number, c: V3, gc: number) => {
      mb.vert(a, UV0, [ga, ga, ga, 1], 1);
      mb.vert(b, UV0, [gb, gb, gb, 1], 1);
      mb.vert(c, UV0, [gc, gc, gc, 1], 1);
    };
    for (let i = 0; i < SEG; i++) {
      const j = (i + 1) % SEG;
      tri(c0, 1, r1[i].p, r1[i].g, r1[j].p, r1[j].g);
      tri(r1[i].p, r1[i].g, r2[i].p, r2[i].g, r2[j].p, r2[j].g);
      tri(r1[i].p, r1[i].g, r2[j].p, r2[j].g, r1[j].p, r1[j].g);
    }
  }
  return mb;
}

/* ════════════════════════════════════════════════════════════════════════════
 * 6 · TAIL WIGGLE — the tail bends along a chain of bones
 *
 * Every tail vertex carries `s` (0 = root … 1 = tip, measured along the tail). The engine
 * blends the two neighbouring bone matrices by `s` in the vertex shader, so the tail bends
 * smoothly (no seams, no cracks). tailPose(t) gives the bone matrices.
 *
 * What it does (slow and soft, like a relaxed cat lying down):
 *   · "swish"  – the whole tail drifts lazily from side to side
 *   · "wiggle" – only the tip waves, a little behind the base (a travelling wave)
 *   · the two fade in and out by themselves (never suddenly), so sometimes the whole tail
 *     moves, sometimes only the tip, sometimes both, sometimes it just rests.
 * ════════════════════════════════════════════════════════════════════════════ */

/** bones along the tail (aboutGl.ts uses the same number in the vertex shader) */
export const TAIL_BONES = 7;
/** inside the rump: the whole tail swings around this point */
const TAIL_PIVOT: V3 = [-0.5, 0.12, 0.0];

/** motion settings (degrees and seconds) — tweak freely. Arrays go root → tip (one value per bone). */
const WIGGLE = {
  /** how much of the base sway stays while only the tip is moving (0 = none, 1 = all) */
  baseRest: 0.3,
  /** whole-tail swish: bend per joint, speeds (rad/s), delay from joint to joint (s) */
  swishAmp: [0, 2.2, 2.2, 2.4, 2.6, 2.8, 3.0],
  swishSpeed: [0.95, 0.37],
  swishLag: 0.25,
  /** tip wiggle: bend per joint (mostly the last ones), speed (waves per second), lag per joint (rad) */
  tipAmp: [0, 0, 0.8, 2.2, 4.2, 6.5, 8.5],
  tipHz: 0.8,
  tipLag: 0.5,
};

/** a slow on / off "weather" 0…1: mostly smooth hills and valleys, so things start and stop gently */
const calm = (
  t: number,
  a: number,
  b: number,
  pa: number,
  pb: number,
  lo: number,
  hi: number,
) =>
  smoothstep(
    lo,
    hi,
    0.5 + 0.5 * (0.6 * Math.sin(a * t + pa) + 0.4 * Math.sin(b * t + pb)),
  );

/** bend angle (degrees, around the vertical axis) of every joint at time t */
function tailAngles(t: number, out: number[]) {
  const W = WIGGLE;
  // the first tip wiggle starts a second or so after the cat has appeared
  const swish = calm(t, 0.41, 0.17, 3.2, 5.6, 0.52, 0.82);
  const tip = calm(t, 0.53, 0.23, 5.0, 5.6, 0.46, 0.76);
  // base of the tail: the slow sway it always had, calmer while only the tip is moving
  out[0] =
    (Math.sin(t * 1.1) * 6 + Math.sin(t * 0.43) * 3) *
    0.8 *
    (W.baseRest + (1 - W.baseRest) * swish);
  const size = 0.8 + 0.2 * Math.sin(t * 0.6); // every wave a little different
  for (let i = 1; i < TAIL_BONES; i++) {
    const ts = t - W.swishLag * i;
    const lazy =
      0.7 * Math.sin(W.swishSpeed[0] * ts) +
      0.3 * Math.sin(W.swishSpeed[1] * ts + 1.1);
    const ph = Math.PI * 2 * W.tipHz * t - W.tipLag * i;
    const wave = Math.sin(ph) + 0.22 * Math.sin(2 * ph + 0.8); // not a perfect sine: a bit more natural
    out[i] = swish * W.swishAmp[i] * lazy + tip * W.tipAmp[i] * size * wave;
  }
}

/** length-based position along the tail's centre line */
function tailLine(pts: V3[]) {
  const len: number[] = [0];
  for (let i = 1; i < pts.length; i++)
    len.push(
      len[i - 1] +
        Math.hypot(
          pts[i][0] - pts[i - 1][0],
          pts[i][1] - pts[i - 1][1],
          pts[i][2] - pts[i - 1][2],
        ),
    );
  const total = len[len.length - 1];
  /** the point at fraction f (0 … 1) of the length */
  const at = (f: number): V3 => {
    const d = clamp01(f) * total;
    let i = 1;
    while (i < len.length - 1 && len[i] < d) i++;
    const k = (d - len[i - 1]) / (len[i] - len[i - 1] || 1);
    return [
      pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k,
      pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k,
      pts[i - 1][2] + (pts[i][2] - pts[i - 1][2]) * k,
    ];
  };
  /** the fraction (0 … 1) of the nearest point on the line */
  const param = (x: number, y: number, z: number) => {
    let best = 1e9;
    let f = 0;
    for (let i = 1; i < pts.length; i++) {
      const ax = pts[i - 1][0];
      const ay = pts[i - 1][1];
      const az = pts[i - 1][2];
      const bx = pts[i][0] - ax;
      const by = pts[i][1] - ay;
      const bz = pts[i][2] - az;
      const h = clamp01(
        ((x - ax) * bx + (y - ay) * by + (z - az) * bz) /
          (bx * bx + by * by + bz * bz || 1),
      );
      const ex = x - ax - bx * h;
      const ey = y - ay - by * h;
      const ez = z - az - bz * h;
      const d = ex * ex + ey * ey + ez * ez;
      if (d < best) {
        best = d;
        f = (len[i - 1] + h * (len[i] - len[i - 1])) / total;
      }
    }
    return f;
  };
  return { at, param };
}

/** bone weight of every tail vertex = how far along the tail it is (0 root … 1 tip) */
function tailWeights(m: Mesh, pts: V3[]): Float32Array {
  const line = tailLine(pts);
  const n = m.pos.length / 3;
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++)
    w[i] = line.param(m.pos[i * 3], m.pos[i * 3 + 1], m.pos[i * 3 + 2]);
  return w;
}

/** the pose function: bone i = the bones before it, then a turn around its own joint.
 *  Everything turns around the vertical axis, so the maths stays in the ground plane. */
function makeTailPose(pts: V3[]): (t: number) => Float32Array {
  const line = tailLine(pts);
  const joints: V3[] = [TAIL_PIVOT];
  for (let i = 1; i < TAIL_BONES; i++)
    joints.push(line.at(i / (TAIL_BONES - 1)));
  const out = new Float32Array(16 * TAIL_BONES);
  const ang: number[] = new Array(TAIL_BONES).fill(0);
  const D = Math.PI / 180;
  return (t: number) => {
    tailAngles(t, ang);
    let th = 0; // turn of the bones before this one
    let tx = 0; // and their shift (x, z)
    let tz = 0;
    for (let i = 0; i < TAIL_BONES; i++) {
      const phi = ang[i] * D;
      const c = Math.cos(phi);
      const s = Math.sin(phi);
      const jx = joints[i][0];
      const jz = joints[i][2];
      // turn around the joint (x' = c·x + s·z, z' = −s·x + c·z, same as rotateY), then the parent's pose
      const dx = jx - (c * jx + s * jz);
      const dz = jz - (-s * jx + c * jz);
      const cp = Math.cos(th);
      const sp = Math.sin(th);
      tx += cp * dx + sp * dz;
      tz += -sp * dx + cp * dz;
      th += phi;
      const C = Math.cos(th);
      const S = Math.sin(th);
      const o = i * 16;
      out[o] = C;
      out[o + 2] = -S;
      out[o + 5] = 1;
      out[o + 8] = S;
      out[o + 10] = C;
      out[o + 12] = tx;
      out[o + 14] = tz;
      out[o + 15] = 1;
    }
    return out;
  };
}

function* buildCatGen(lite: boolean): Generator<void, CatGeo, void> {
  const pace = makePace(4);
  const h = lite ? 0.022 : 0.0165;
  const model = buildModel();
  yield;
  pace.reset();

  const body = makeField(model.body, h);
  const head = makeField(model.head, h);
  const tail = makeField(model.tail, h);
  const all = (x: number, y: number, z: number) =>
    Math.min(sdf(body, x, y, z), sdf(head, x, y, z), sdf(tail, x, y, z));

  for (const f of [body, head, tail]) yield* fillField(f, pace);
  const mb = yield* meshField(body, pace);
  const mh = yield* meshField(head, pace);
  const mt = yield* meshField(tail, pace);
  const lb = yield* shadeMesh(mb, all, model.tones, 0.9, pace);
  const lh = yield* shadeMesh(mh, all, model.tones, 0.75, pace);
  const lt = yield* shadeMesh(mt, all, model.tones, 0.9, pace);
  const tailW = tailWeights(mt, model.tailPts);

  const geo: CatGeo = {
    body: toBuilder(mb, lb),
    head: toBuilder(mh, lh),
    eyes: buildEyes(head),
    tail: toBuilder(mt, lt, tailW),
    headPivot: [HX - 0.015, 0.42, 0.1], // the neck: the head turns around here
    tailPivot: TAIL_PIVOT, // inside the rump (a long lever, so the sway reads)
    eyesPivot: [HX, EYE_Y, 0.4],
    tailPose: makeTailPose(model.tailPts),
  };
  return geo;
}

/* ── public: built once, in small steps, shared ───────────────────────────── */
/** same rule as AboutScene.tsx, so the cat matches the scene's "lite" mode (used for the early pre-build only) */
function isLite(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (
    window.innerWidth < 992 ||
    (nav.hardwareConcurrency ?? 8) <= 4 ||
    (nav.deviceMemory ?? 8) <= 4
  );
}

interface Job {
  gen: Generator<void, CatGeo, void>;
  promise: Promise<CatGeo>;
  urgent: boolean; // the scene is waiting for it → work faster
}
const cache = new Map<boolean, Job>();

function start(lite: boolean): Job {
  const gen = buildCatGen(lite);
  const job = { gen, urgent: false } as Job;
  job.promise = new Promise<CatGeo>((resolve, reject) => {
    const step = () => {
      try {
        // idle pre-build: ~3 ms of work every ~14 ms · scene is waiting: ~8 ms every tick
        const until = now() + (job.urgent ? 8 : 3);
        for (;;) {
          const r = gen.next();
          if (r.done) {
            resolve(r.value);
            return;
          }
          if (now() >= until) break;
        }
        setTimeout(step, job.urgent ? 0 : 14);
      } catch (e) {
        cache.delete(lite); // start clean next time instead of keeping a broken build
        reject(e);
      }
    };
    setTimeout(step, 0);
  });
  return job;
}

/** the lying black cat (built once, then reused — also when the scene rebuilds) */
export function buildCat(lite: boolean = isLite()): Promise<CatGeo> {
  let job = cache.get(lite);
  if (!job) {
    job = start(lite);
    cache.set(lite, job);
  }
  job.urgent = true;
  return job.promise;
}

/* start building a moment after load, a few milliseconds at a time, so it is
   usually ready before the About section scrolls into view */
if (typeof window !== "undefined") {
  window.setTimeout(() => {
    const lite = isLite();
    if (cache.has(lite)) return;
    const job = start(lite);
    cache.set(lite, job);
    job.promise.catch(() => undefined);
  }, 1500);
}
