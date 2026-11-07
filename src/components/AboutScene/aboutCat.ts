/* ────────────────────────────────────────────────────────────────────────────
 * ABOUT CAT — a realistic, lying cat (round-faced British Shorthair type, like the
 * reference photo): body in profile, head raised and turned to the viewer, front
 * paws stretched out, hind paws tucked, thick tail curled around in front.
 *
 * How it is made (no model files, no libraries):
 *   1. the cat is described as smooth blended shapes (a "signed distance field"):
 *      torso, chest, haunches, thighs, legs, round paws with toes, a big round head
 *      with full cheeks, two puffy whisker pads, a nose, small ears, and the tail.
 *   2. a little fur noise is added to the surface (strands run head -> tail).
 *   3. the field is turned into a smooth mesh (surface nets) at a fine grid.
 *   4. the light is baked into the vertex colours: soft key light, rim light,
 *      fur sheen, strand-by-strand fur variation and ambient occlusion
 *      (darker in the creases and where the cat touches the ground).
 * It is built ONCE, in small steps while the browser is idle (the same way the
 * textures are), and shared if the scene is rebuilt.
 *
 * Local axes: x → toward the head, y → up, z → toward the viewer (the flank you see).
 * Feet / belly touch y = 0. Same animation hooks as before: head (turns), eyes (blink),
 * tail (sways), each with its own pivot.
 * The face details (plain white eyes, nose, "w" mouth, tongue) are small shapes that
 * lie on the skin of the head, see faceMeshes() and FACE below.
 * ──────────────────────────────────────────────────────────────────────────── */

import { MeshBuilder, RGBA, V3 } from "./aboutGlUtils";

export interface CatGeo {
  body: MeshBuilder;
  head: MeshBuilder;
  eyes: MeshBuilder;
  tail: MeshBuilder;
  headPivot: V3;
  tailPivot: V3;
  eyesPivot: V3;
}

/* ── tweak freely ───────────────────────────────────────────────────────── */
/** the coat. Black cat by default. For a grey / "British blue" cat like the photo, multiply
 *  ambient / diffuse / rim / sheen by about 3.5 and raise cap to 230. */
const COAT_BLACK = {
  ambient: 10,
  diffuse: 52,
  rim: 44,
  sheen: 30,
  cap: 155,
  furContrast: 0.3, // strand-by-strand brightness variation
};
/** light grey "British blue" like the reference photo */
export const COAT_GRAY = {
  ambient: 38,
  diffuse: 150,
  rim: 70,
  sheen: 40,
  cap: 235,
  furContrast: 0.22,
};
/** which coat is used: COAT_BLACK (your black cat) or COAT_GRAY (the grey one in the photo) */
export const COAT = COAT_BLACK;
/** overall size of the model (the scene scales it again with CAT.scale) */
const FIT = 0.78;
/** size of one voxel of the mesh grid (metres, before FIT). Smaller = finer fur, more triangles */
const VOXEL = 0.03;
const VOXEL_LITE = 0.045;

/** the face (offsets from the head centre H, in model metres) */
const FACE = {
  eyeX: 0.13, // eye centre: sideways from the middle of the face
  eyeY: 0.04, // eye centre: up from the head centre
  eyeRX: 0.058, // eye half width
  eyeRY: 0.046, // eye half height
  eyeTilt: 0.09, // outer corners a touch higher (radians)
  eyeBulge: 0.024, // how far the white eye domes out of the skin
  noseY: -0.026, // nose centre: up from the head centre
  tongue: true, // the little tongue (like the reference); false hides it
};

/* ── small maths ────────────────────────────────────────────────────────── */
type SDF = (x: number, y: number, z: number) => number;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** smooth union (blends two shapes into one skin) */
const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
const ell =
  (
    cx: number,
    cy: number,
    cz: number,
    rx: number,
    ry: number,
    rz: number,
  ): SDF =>
  (x, y, z) => {
    const px = (x - cx) / rx;
    const py = (y - cy) / ry;
    const pz = (z - cz) / rz;
    const k0 = Math.hypot(px, py, pz);
    const k1 = Math.hypot(px / rx, py / ry, pz / rz);
    return k1 < 1e-9 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
  };

/** squash a shape flat along z (thin, pointed ears) */
const flatZ =
  (f: SDF, k: number, zc: number): SDF =>
  (x, y, z) =>
    f(x, y, (z - zc) * k);

/** capsule between two points, thick at a, thinner at b (legs, tail) */
const seg = (a: V3, b: V3, ra: number, rb: number): SDF => {
  const bax = b[0] - a[0];
  const bay = b[1] - a[1];
  const baz = b[2] - a[2];
  const bb = bax * bax + bay * bay + baz * baz || 1;
  return (x, y, z) => {
    const pax = x - a[0];
    const pay = y - a[1];
    const paz = z - a[2];
    const h = clamp((pax * bax + pay * bay + paz * baz) / bb, 0, 1);
    return (
      Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) -
      (ra + (rb - ra) * h)
    );
  };
};

const blend =
  (k: number, ...fs: SDF[]): SDF =>
  (x, y, z) => {
    let d = fs[0](x, y, z);
    for (let i = 1; i < fs.length; i++) d = smin(d, fs[i](x, y, z), k);
    return d;
  };

/* value noise (for the fur) */
const hash = (i: number, j: number, k: number) => {
  let n =
    (Math.imul(i, 374761393) +
      Math.imul(j, 668265263) +
      Math.imul(k, 1274126177)) |
    0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
const noise3 = (x: number, y: number, z: number) => {
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
      l(hash(xi, yi, zi), hash(xi + 1, yi, zi), u),
      l(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u),
      v,
    ),
    l(
      l(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u),
      l(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u),
      v,
    ),
    w,
  );
};

/* ── the cat, as shapes ─────────────────────────────────────────────────── */
/** head centre (the head is raised and looks at the viewer, +z) */
const H = { x: 0.64, y: 0.72, z: 0.2 };

/** things that touch the ground are cut flat there (the cat lies on the land) */
const onGround =
  (f: SDF): SDF =>
  (x, y, z) =>
    Math.max(f(x, y, z), -y);

function bodyShape(): SDF {
  const torso = ell(-0.05, 0.37, 0.0, 0.62, 0.36, 0.39);
  const chest = ell(0.45, 0.4, 0.04, 0.36, 0.4, 0.37);
  const ruff = ell(0.56, 0.42, 0.14, 0.26, 0.3, 0.26); // thick fur ruff under the chin
  const rump = ell(-0.5, 0.34, 0.03, 0.34, 0.33, 0.34);
  const thighNear = ell(-0.36, 0.27, 0.25, 0.3, 0.26, 0.17);
  const thighFar = ell(-0.36, 0.27, -0.22, 0.3, 0.26, 0.15);

  // front legs stretched forward, thick and round like a shorthair's
  const foreNear = seg([0.42, 0.24, 0.22], [0.8, 0.085, 0.34], 0.15, 0.108);
  const foreFar = seg([0.46, 0.2, -0.1], [0.8, 0.085, 0.0], 0.14, 0.1);
  const pawNear = ell(0.88, 0.07, 0.35, 0.145, 0.074, 0.11);
  const pawFar = ell(0.86, 0.07, 0.0, 0.14, 0.07, 0.1);
  const toesNear = blend(
    0.03,
    ell(0.985, 0.052, 0.29, 0.04, 0.042, 0.042),
    ell(1.003, 0.052, 0.352, 0.04, 0.042, 0.044),
    ell(0.985, 0.052, 0.414, 0.04, 0.042, 0.042),
  );
  const toesFar = blend(
    0.03,
    ell(0.96, 0.05, -0.065, 0.038, 0.04, 0.04),
    ell(0.976, 0.05, -0.002, 0.038, 0.04, 0.042),
    ell(0.96, 0.05, 0.06, 0.038, 0.04, 0.04),
  );

  // hind paws tucked in front of the haunch, toes toward the viewer
  const hindA = ell(-0.17, 0.078, 0.5, 0.105, 0.072, 0.15);
  const hindB = ell(0.0, 0.078, 0.5, 0.105, 0.072, 0.15);
  const hindToes = blend(
    0.025,
    ell(-0.22, 0.055, 0.64, 0.032, 0.036, 0.034),
    ell(-0.165, 0.055, 0.655, 0.034, 0.036, 0.036),
    ell(-0.11, 0.055, 0.64, 0.032, 0.036, 0.034),
    ell(-0.05, 0.055, 0.64, 0.032, 0.036, 0.034),
    ell(0.005, 0.055, 0.655, 0.034, 0.036, 0.036),
    ell(0.06, 0.055, 0.64, 0.032, 0.036, 0.034),
  );

  const core = blend(0.16, torso, chest, ruff, rump, thighNear, thighFar);
  const limbs = blend(
    0.07,
    foreNear,
    foreFar,
    pawNear,
    pawFar,
    toesNear,
    toesFar,
    hindA,
    hindB,
    hindToes,
  );
  const whole = blend(0.1, core, limbs);
  const flat = onGround(whole);
  return (x, y, z) => {
    let d = flat(x, y, z);
    if (Math.abs(d) < 0.07) {
      // fur: soft clumps that run along the body (head -> tail)
      d +=
        (noise3(x * 6, y * 9, z * 9) - 0.5) * 0.014 +
        (noise3(x * 11, y * 18, z * 18) - 0.5) * 0.006;
    }
    return d;
  };
}

function headShape(withFur: boolean): SDF {
  const { x: hx, y: hy, z: hz } = H;
  const cranium = ell(hx, hy, hz, 0.33, 0.29, 0.29);
  const cheekL = ell(hx - 0.2, hy - 0.08, hz + 0.08, 0.19, 0.16, 0.17);
  const cheekR = ell(hx + 0.2, hy - 0.08, hz + 0.08, 0.19, 0.16, 0.17);
  const bridge = ell(hx, hy + 0.0, hz + 0.16, 0.13, 0.14, 0.12);
  const chin = ell(hx, hy - 0.175, hz + 0.14, 0.085, 0.05, 0.07);
  const earL = flatZ(
    seg([hx - 0.19, hy + 0.2, 0], [hx - 0.262, hy + 0.43, 0], 0.108, 0.02),
    2.3,
    hz - 0.03,
  );
  const earR = flatZ(
    seg([hx + 0.19, hy + 0.2, 0], [hx + 0.262, hy + 0.43, 0], 0.108, 0.02),
    2.3,
    hz - 0.03,
  );
  const neck = ell(hx - 0.1, hy - 0.23, hz - 0.12, 0.3, 0.3, 0.26);

  // the face (like the reference): two round, puffy whisker pads with a groove
  // between them, and a small raised nose above the groove
  const padL = ell(hx - 0.108, hy - 0.108, hz + 0.242, 0.104, 0.064, 0.095);
  const padR = ell(hx + 0.108, hy - 0.108, hz + 0.242, 0.104, 0.064, 0.095);
  const pads = blend(0.02, padL, padR);
  const nose = ell(hx, hy + FACE.noseY, hz + 0.296, 0.044, 0.033, 0.034);

  const skull = blend(0.08, cranium, cheekL, cheekR, bridge, chin, neck);
  const face = blend(0.03, skull, pads, nose);
  const withEars = blend(0.05, face, blend(0.04, earL, earR));
  return (x, y, z) => {
    let d = withEars(x, y, z);
    if (withFur && Math.abs(d) < 0.06) {
      d += (noise3(x * 5, y * 13, z * 13) - 0.5) * 0.009;
    }
    return d;
  };
}

function tailShape(): SDF {
  /* thick at the rump, curling around the hind paws on the viewer's side, tapering to a rounded tip */
  const P: [V3, number][] = [
    [[-0.74, 0.2, -0.06], 0.108],
    [[-0.92, 0.16, 0.04], 0.1],
    [[-0.99, 0.12, 0.22], 0.096],
    [[-0.93, 0.1, 0.42], 0.09],
    [[-0.79, 0.092, 0.6], 0.085],
    [[-0.59, 0.088, 0.71], 0.078],
    [[-0.37, 0.082, 0.75], 0.068],
    [[-0.22, 0.074, 0.78], 0.052],
  ];
  const parts: SDF[] = [];
  for (let i = 0; i < P.length - 1; i++)
    parts.push(seg(P[i][0], P[i + 1][0], P[i][1], P[i + 1][1]));
  const whole = onGround(blend(0.05, ...parts));
  return (x, y, z) => {
    let d = whole(x, y, z);
    if (Math.abs(d) < 0.06) d += (noise3(x * 4, y * 14, z * 14) - 0.5) * 0.01;
    return d;
  };
}

/* ── mesh from the field (surface nets) ─────────────────────────────────── */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

interface Meshed {
  pos: number[]; // x y z per vertex
  nrm: number[]; // outward normal per vertex
  tris: number[]; // vertex indices
}

async function meshOf(f: SDF, min: V3, max: V3, h: number): Promise<Meshed> {
  const nx = Math.ceil((max[0] - min[0]) / h);
  const ny = Math.ceil((max[1] - min[1]) / h);
  const nz = Math.ceil((max[2] - min[2]) / h);
  const sx = nx + 1;
  const sy = ny + 1;
  const val = new Float32Array(sx * sy * (nz + 1));
  const at = (i: number, j: number, k: number) => (k * sy + j) * sx + i;

  for (let k = 0; k <= nz; k++) {
    for (let j = 0; j <= ny; j++) {
      for (let i = 0; i <= nx; i++) {
        val[at(i, j, k)] = f(min[0] + i * h, min[1] + j * h, min[2] + k * h);
      }
    }
    if (k % 6 === 5) await tick(); // let the browser breathe
  }

  const vid = new Int32Array(nx * ny * nz).fill(-1);
  const cell = (i: number, j: number, k: number) => (k * ny + j) * nx + i;
  const pos: number[] = [];
  const nrm: number[] = [];
  const EDGES: [number, number][] = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  const cv = new Float32Array(8);

  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        let neg = 0;
        for (let c = 0; c < 8; c++) {
          const v =
            val[at(i + (c & 1), j + ((c >> 1) & 1), k + ((c >> 2) & 1))];
          cv[c] = v;
          if (v < 0) neg++;
        }
        if (neg === 0 || neg === 8) continue;
        let px = 0;
        let py = 0;
        let pz = 0;
        let n = 0;
        for (const [a, b] of EDGES) {
          const va = cv[a];
          const vb = cv[b];
          if (va < 0 === vb < 0) continue;
          const t = va / (va - vb);
          px += i + (a & 1) + ((b & 1) - (a & 1)) * t;
          py += j + ((a >> 1) & 1) + (((b >> 1) & 1) - ((a >> 1) & 1)) * t;
          pz += k + ((a >> 2) & 1) + (((b >> 2) & 1) - ((a >> 2) & 1)) * t;
          n++;
        }
        vid[cell(i, j, k)] = pos.length / 3;
        pos.push(
          min[0] + (px / n) * h,
          min[1] + (py / n) * h,
          min[2] + (pz / n) * h,
        );
        // outward normal = gradient of the field across the cell
        let gx = 0;
        let gy = 0;
        let gz = 0;
        for (let c = 0; c < 8; c++) {
          gx += (c & 1 ? 1 : -1) * cv[c];
          gy += (c & 2 ? 1 : -1) * cv[c];
          gz += (c & 4 ? 1 : -1) * cv[c];
        }
        const gl = Math.hypot(gx, gy, gz) || 1;
        nrm.push(gx / gl, gy / gl, gz / gl);
      }
    }
    if (k % 8 === 7) await tick();
  }

  const tris: number[] = [];
  const quad = (a: number, b: number, c: number, d: number) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    // face the same way as the field gradient (outward)
    const ux = pos[b * 3] - pos[a * 3];
    const uy = pos[b * 3 + 1] - pos[a * 3 + 1];
    const uz = pos[b * 3 + 2] - pos[a * 3 + 2];
    const vx = pos[c * 3] - pos[a * 3];
    const vy = pos[c * 3 + 1] - pos[a * 3 + 1];
    const vz = pos[c * 3 + 2] - pos[a * 3 + 2];
    const fx = uy * vz - uz * vy;
    const fy = uz * vx - ux * vz;
    const fz = ux * vy - uy * vx;
    const dot =
      fx * (nrm[a * 3] + nrm[c * 3]) +
      fy * (nrm[a * 3 + 1] + nrm[c * 3 + 1]) +
      fz * (nrm[a * 3 + 2] + nrm[c * 3 + 2]);
    if (dot >= 0) tris.push(a, b, c, a, c, d);
    else tris.push(a, c, b, a, d, c);
  };
  for (let k = 1; k < nz; k++) {
    for (let j = 1; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const a = val[at(i, j, k)];
        const b = val[at(i + 1, j, k)];
        if (a < 0 !== b < 0)
          quad(
            vid[cell(i, j - 1, k - 1)],
            vid[cell(i, j, k - 1)],
            vid[cell(i, j, k)],
            vid[cell(i, j - 1, k)],
          );
      }
    }
  }
  for (let k = 1; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 1; i < nx; i++) {
        const a = val[at(i, j, k)];
        const b = val[at(i, j + 1, k)];
        if (a < 0 !== b < 0)
          quad(
            vid[cell(i - 1, j, k - 1)],
            vid[cell(i, j, k - 1)],
            vid[cell(i, j, k)],
            vid[cell(i - 1, j, k)],
          );
      }
    }
  }
  for (let k = 0; k < nz; k++) {
    for (let j = 1; j < ny; j++) {
      for (let i = 1; i < nx; i++) {
        const a = val[at(i, j, k)];
        const b = val[at(i, j, k + 1)];
        if (a < 0 !== b < 0)
          quad(
            vid[cell(i - 1, j - 1, k)],
            vid[cell(i, j - 1, k)],
            vid[cell(i, j, k)],
            vid[cell(i - 1, j, k)],
          );
      }
    }
  }
  return { pos, nrm, tris };
}

/* ── baked light + fur ──────────────────────────────────────────────────── */
const unit = (x: number, y: number, z: number): V3 => {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
};
const KEY = unit(-0.38, 0.8, 0.5); // key light: above, front-left
const VIEW = unit(0, 0.2, 1); // roughly where the camera is
const HALF = unit(KEY[0] + VIEW[0], KEY[1] + VIEW[1], KEY[2] + VIEW[2]);
const gray = (n: number, a = 1): RGBA => [n / 255, n / 255, n / 255, a];

function colourOf(f: SDF, p: V3, n: V3, nose: boolean): RGBA {
  const ndl = n[0] * KEY[0] + n[1] * KEY[1] + n[2] * KEY[2];
  const soft = Math.pow(0.5 + 0.5 * ndl, 2); // half-lambert: soft, fur-like
  const ndv = Math.max(0, n[0] * VIEW[0] + n[1] * VIEW[1] + n[2] * VIEW[2]);
  const rim = Math.pow(1 - ndv, 2.2) * (0.35 + 0.65 * clamp(n[1] + 0.25, 0, 1));
  const sheen = Math.pow(
    Math.max(0, n[0] * HALF[0] + n[1] * HALF[1] + n[2] * HALF[2]),
    18,
  );
  // ambient occlusion: how open is the space just above this point? (creases + the ground contact are darker)
  const open = clamp(
    f(p[0] + n[0] * 0.09, p[1] + n[1] * 0.09, p[2] + n[2] * 0.09) / 0.09,
    0,
    1,
  );
  const ao = 0.35 + 0.65 * Math.pow(open, 1.4);
  // strand-by-strand fur variation (finer than the mesh grid)
  const fur =
    noise3(p[0] * 9, p[1] * 46, p[2] * 46) * 0.65 +
    noise3(p[0] * 20, p[1] * 90, p[2] * 90) * 0.35;
  const furM = 1 + (fur - 0.5) * COAT.furContrast * 2;
  const ground = 0.55 + 0.45 * clamp(p[1] / 0.12, 0, 1); // where it touches the land
  let v =
    (COAT.ambient + COAT.diffuse * soft + COAT.rim * rim + COAT.sheen * sheen) *
    ao *
    furM *
    ground;
  if (nose) v = Math.max(v, 46); // the nose is a touch lighter
  return gray(Math.min(COAT.cap, v));
}

function toMesh(
  m: Meshed,
  f: SDF,
  noseAt: V3 | null,
  tint?: (p: V3) => number,
): MeshBuilder {
  const mb = new MeshBuilder();
  const nv = m.pos.length / 3;
  const col: RGBA[] = new Array(nv);
  for (let i = 0; i < nv; i++) {
    const p: V3 = [m.pos[i * 3], m.pos[i * 3 + 1], m.pos[i * 3 + 2]];
    const n: V3 = [m.nrm[i * 3], m.nrm[i * 3 + 1], m.nrm[i * 3 + 2]];
    const nose =
      !!noseAt &&
      Math.hypot(p[0] - noseAt[0], p[1] - noseAt[1], p[2] - noseAt[2]) < 0.045;
    const c = colourOf(f, p, n, nose);
    const k = tint ? 1 + tint(p) : 1;
    col[i] = k === 1 ? c : ([c[0] * k, c[1] * k, c[2] * k, c[3]] as RGBA);
  }
  const uv: [number, number][] = [
    [0, 0],
    [0, 0],
    [0, 0],
  ];
  for (let t = 0; t < m.tris.length; t += 3) {
    const a = m.tris[t];
    const b = m.tris[t + 1];
    const c = m.tris[t + 2];
    const P = [a, b, c].map(
      (i) =>
        [
          m.pos[i * 3] * FIT,
          m.pos[i * 3 + 1] * FIT,
          m.pos[i * 3 + 2] * FIT,
        ] as V3,
    );
    mb.tri(P, uv, [col[a], col[b], col[c]]);
  }
  return mb;
}

/* ── the face: two plain white eyes, a nose, a "w" mouth and a little tongue ──
 * The head mesh is too coarse for fine details, so these are small separate
 * shapes that lie on the skin of the head (they ride on the head: same turn /
 * tilt). The eyes are pure flat white (no pupil, no shading) and are the only
 * thing that blinks. Positions are offsets from the head centre H
 * (x = sideways, y = up). The numbers live in FACE (top of this file).     */

const cross3 = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm3 = (v: V3): V3 => unit(v[0], v[1], v[2]);

/** z of the front of the face at (x, y) (the skin of the head field) */
function frontZ(f: SDF, x: number, y: number): number {
  let lo = H.z - 0.1; // inside
  let hi = H.z + 0.5; // outside
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2;
    if (f(x, y, mid) < 0) lo = mid;
    else hi = mid;
  }
  return hi;
}

/** outward normal of the skin at a point */
function normalAt(f: SDF, p: V3): V3 {
  const e = 0.004;
  return unit(
    f(p[0] + e, p[1], p[2]) - f(p[0] - e, p[1], p[2]),
    f(p[0], p[1] + e, p[2]) - f(p[0], p[1] - e, p[2]),
    f(p[0], p[1], p[2] + e) - f(p[0], p[1], p[2] - e),
  );
}

interface Frame3 {
  p: V3; // point on the skin
  n: V3; // out of the skin
  u: V3; // sideways along the skin
  v: V3; // up along the skin
}

/** a frame lying on the skin at (x, y); `roll` turns u / v around n (tilted eyes) */
function skinFrame(f: SDF, x: number, y: number, roll = 0): Frame3 {
  const p: V3 = [x, y, frontZ(f, x, y)];
  const n = normalAt(f, p);
  const u0 = norm3([1 - n[0] * n[0], -n[1] * n[0], -n[2] * n[0]]);
  const v0 = cross3(n, u0);
  const c = Math.cos(roll);
  const s = Math.sin(roll);
  const u: V3 = [
    u0[0] * c + v0[0] * s,
    u0[1] * c + v0[1] * s,
    u0[2] * c + v0[2] * s,
  ];
  const v: V3 = [
    v0[0] * c - u0[0] * s,
    v0[1] * c - u0[1] * s,
    v0[2] * c - u0[2] * s,
  ];
  return { p, n, u, v };
}

/** the same soft key light as the fur, for the little face pieces */
const lit = (n: V3, base: number): RGBA => {
  const ndl = n[0] * KEY[0] + n[1] * KEY[1] + n[2] * KEY[2];
  const soft = Math.pow(0.5 + 0.5 * ndl, 2);
  return gray(base * (0.55 + 0.45 * soft));
};

const UV0: [number, number][] = [
  [0, 0],
  [0, 0],
  [0, 0],
];

/** a smooth flattened ellipsoid lying on the skin. c = its centre, r = radii along (u, v, n).
 *  `widen(ly)` can make it wider / narrower up the shape (the nose is a rounded triangle). */
function dome(
  mb: MeshBuilder,
  c: V3,
  fr: Frame3,
  r: V3,
  colour: (n: V3) => RGBA,
  widen?: (ly: number) => number,
) {
  const NU = 18;
  const NV = 10;
  const rows: { p: V3; col: RGBA }[][] = [];
  for (let i = 0; i <= NV; i++) {
    const ph = -Math.PI / 2 + (i / NV) * Math.PI;
    const cp = Math.cos(ph);
    const sp = Math.sin(ph);
    const row: { p: V3; col: RGBA }[] = [];
    for (let j = 0; j <= NU; j++) {
      const th = (j / NU) * Math.PI * 2;
      const lx = cp * Math.cos(th);
      const ly = cp * Math.sin(th);
      const wx = widen ? widen(ly) : 1;
      const p: V3 = [0, 0, 0];
      const nr: V3 = [0, 0, 0];
      for (let k = 0; k < 3; k++) {
        p[k] =
          c[k] +
          fr.u[k] * lx * r[0] * wx +
          fr.v[k] * ly * r[1] +
          fr.n[k] * sp * r[2];
        nr[k] =
          (fr.u[k] * lx) / r[0] +
          (fr.v[k] * ly) / r[1] +
          (fr.n[k] * sp) / r[2];
      }
      row.push({
        p: [p[0] * FIT, p[1] * FIT, p[2] * FIT],
        col: colour(norm3(nr)),
      });
    }
    rows.push(row);
  }
  for (let i = 0; i < NV; i++) {
    for (let j = 0; j < NU; j++) {
      const a = rows[i][j];
      const b = rows[i][j + 1];
      const d = rows[i + 1][j];
      const e = rows[i + 1][j + 1];
      mb.tri([a.p, b.p, e.p], UV0, [a.col, b.col, e.col]);
      mb.tri([a.p, e.p, d.p], UV0, [a.col, e.col, d.col]);
    }
  }
}

/** a thin round cord laid along a path on the skin (the mouth lines) */
function cord(
  mb: MeshBuilder,
  path: { p: V3; n: V3 }[],
  radAt: (t: number) => number, // radius along the path, t = 0 → 1
  colour: (n: V3) => RGBA,
) {
  const SIDES = 7;
  const rings: { p: V3; col: RGBA }[][] = [];
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)].p;
    const b = path[Math.min(path.length - 1, i + 1)].p;
    const t = norm3([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
    const e1 = norm3(cross3(t, path[i].n));
    const e2 = cross3(e1, t);
    const rad = radAt(i / (path.length - 1));
    const ring: { p: V3; col: RGBA }[] = [];
    for (let k = 0; k < SIDES; k++) {
      const an = (k / SIDES) * Math.PI * 2;
      const dir: V3 = [0, 0, 0];
      for (let m = 0; m < 3; m++) {
        dir[m] = e1[m] * Math.cos(an) + e2[m] * Math.sin(an);
      }
      ring.push({
        p: [
          (path[i].p[0] + dir[0] * rad) * FIT,
          (path[i].p[1] + dir[1] * rad) * FIT,
          (path[i].p[2] + dir[2] * rad) * FIT,
        ],
        col: colour(dir),
      });
    }
    rings.push(ring);
  }
  for (let i = 0; i < rings.length - 1; i++) {
    for (let k = 0; k < SIDES; k++) {
      const a = rings[i][k];
      const b = rings[i][(k + 1) % SIDES];
      const d = rings[i + 1][k];
      const e = rings[i + 1][(k + 1) % SIDES];
      mb.tri([a.p, b.p, e.p], UV0, [a.col, b.col, e.col]);
      mb.tri([a.p, e.p, d.p], UV0, [a.col, e.col, d.col]);
    }
  }
  // close both ends
  const ends: [number, number][] = [
    [0, 0],
    [rings.length - 1, path.length - 1],
  ];
  for (const [ri, pi] of ends) {
    const mid = path[pi].p;
    const cm: V3 = [mid[0] * FIT, mid[1] * FIT, mid[2] * FIT];
    for (let k = 0; k < SIDES; k++) {
      const a = rings[ri][k];
      const b = rings[ri][(k + 1) % SIDES];
      mb.tri([cm, a.p, b.p], UV0, [a.col, a.col, b.col]);
    }
  }
}

/** smooth curve through points (Catmull-Rom) */
function curve(pts: [number, number][], sub: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < sub; s++) {
      const t = s / sub;
      const t2 = t * t;
      const t3 = t2 * t;
      const at = (k: 0 | 1) =>
        0.5 *
        (2 * p1[k] +
          (-p0[k] + p2[k]) * t +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
          (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([at(0), at(1)]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** the mouth ("w"): from the groove under the nose each lip curves down and out
 *  under its whisker pad (right half; the left half is mirrored) */
const LIP: [number, number][] = [
  [0.0, -0.108],
  [0.012, -0.127],
  [0.03, -0.142],
  [0.056, -0.15],
  [0.084, -0.15],
  [0.111, -0.143],
  [0.134, -0.132],
  [0.148, -0.121],
];

/** the two whisker pads are a touch lighter, so the puffy cheeks still read on a black cat */
const padTint = (p: V3): number => {
  if (p[2] < H.z + 0.2) return 0; // only the front of the face
  let t = 0;
  for (const s of [-1, 1]) {
    const d = Math.hypot(
      (p[0] - (H.x + s * 0.108)) / 0.118,
      (p[1] - (H.y - 0.108)) / 0.072,
    );
    const e = clamp((d - 0.5) / 0.5, 0, 1);
    t = Math.max(t, 0.3 * (1 - e * e * (3 - 2 * e)));
  }
  return t;
};

function faceMeshes(
  f: SDF,
  h: number,
): { eyes: MeshBuilder; face: MeshBuilder; pivot: V3 } {
  const eyes = new MeshBuilder();
  const face = new MeshBuilder();
  const ey = H.y + FACE.eyeY;
  // the coarser the head mesh, the more it can drift from the ideal skin: sit a bit higher
  const air = Math.max(0, h - 0.03) * 0.5;

  /* eyes: plain white domes centred just under the skin, so the head can
     never poke through them */
  for (const side of [-1, 1]) {
    const fr = skinFrame(f, H.x + side * FACE.eyeX, ey, side * FACE.eyeTilt);
    const c: V3 = [
      fr.p[0] - fr.n[0] * 0.004,
      fr.p[1] - fr.n[1] * 0.004,
      fr.p[2] - fr.n[2] * 0.004,
    ];
    const r: V3 = [FACE.eyeRX, FACE.eyeRY, FACE.eyeBulge + 0.004 + air];
    dome(eyes, c, fr, r, () => gray(255));
  }

  /* nose: a small rounded triangle (wider at the top), lighter than the fur */
  {
    const fr = skinFrame(f, H.x, H.y + FACE.noseY + 0.004);
    const c: V3 = [
      fr.p[0] - fr.n[0] * 0.004,
      fr.p[1] - fr.n[1] * 0.004,
      fr.p[2] - fr.n[2] * 0.004,
    ];
    const r: V3 = [0.04, 0.03, 0.016 + 0.004 + air];
    dome(
      face,
      c,
      fr,
      r,
      (n) => lit(n, 150),
      (ly) => 1 + 0.3 * ly,
    );
  }

  /* mouth: the groove under the nose, then the two curved lips ("w") */
  const onSkin = (x: number, y: number) => {
    const fr = skinFrame(f, H.x + x, H.y + y);
    const lift = 0.003 + air;
    return {
      p: [
        fr.p[0] + fr.n[0] * lift,
        fr.p[1] + fr.n[1] * lift,
        fr.p[2] + fr.n[2] * lift,
      ] as V3,
      n: fr.n,
    };
  };
  const mouthCol = (n: V3) => lit(n, 112);
  const groove = curve(
    [
      [0, FACE.noseY - 0.04],
      [0, -0.075],
      LIP[0],
    ],
    3,
  );
  const lip = curve(LIP, 3);
  // thick at the groove, fading out toward the cheeks
  const lipRad = (t: number) => 0.0082 - 0.0038 * t;
  cord(
    face,
    groove.map(([x, y]) => onSkin(x, y)),
    () => 0.0075,
    mouthCol,
  );
  cord(
    face,
    lip.map(([x, y]) => onSkin(x, y)),
    lipRad,
    mouthCol,
  );
  cord(
    face,
    lip.map(([x, y]) => onSkin(-x, y)),
    lipRad,
    mouthCol,
  );

  /* tongue: a little tab sticking out under the mouth (FACE.tongue = false hides it) */
  if (FACE.tongue) {
    const fr = skinFrame(f, H.x, H.y - 0.168);
    const lift = 0.006 + air;
    const c: V3 = [
      fr.p[0] + fr.n[0] * lift,
      fr.p[1] + fr.n[1] * lift,
      fr.p[2] + fr.n[2] * lift,
    ];
    dome(face, c, fr, [0.054, 0.044, 0.02], (n) => lit(n, 150));
  }

  return {
    eyes,
    face,
    pivot: [H.x * FIT, ey * FIT, (frontZ(f, H.x, ey) + 0.006) * FIT],
  };
}

/* ── public: built once, in small steps ─────────────────────────────────── */
const cache = new Map<boolean, Promise<CatGeo>>();

export function buildCat(lite: boolean): Promise<CatGeo> {
  let p = cache.get(lite);
  if (!p) {
    p = (async () => {
      const h = lite ? VOXEL_LITE : VOXEL;

      const bodyF = bodyShape();
      const bodyM = await meshOf(
        bodyF,
        [-1.12, -0.06, -0.5],
        [1.2, 0.82, 0.86],
        h,
      );
      const body = toMesh(bodyM, bodyF, null);
      await tick();

      const headF = headShape(true);
      const headM = await meshOf(
        headF,
        [H.x - 0.5, H.y - 0.5, H.z - 0.42],
        [H.x + 0.5, H.y + 0.5, H.z + 0.48],
        h,
      );
      const head = toMesh(headM, headF, null, padTint);
      await tick();

      const tailF = tailShape();
      const tailM = await meshOf(
        tailF,
        [-1.14, -0.06, -0.22],
        [-0.1, 0.34, 0.92],
        h,
      );
      const tail = toMesh(tailM, tailF, null);
      await tick();

      // eyes (plain white) + nose, mouth and tongue (these ride on the head)
      const { eyes, face, pivot } = faceMeshes(headShape(false), h);
      for (const v of face.data) head.data.push(v);

      return {
        body,
        head,
        eyes,
        tail,
        headPivot: [(H.x - 0.1) * FIT, (H.y - 0.22) * FIT, (H.z - 0.1) * FIT],
        tailPivot: [-0.74 * FIT, 0.2 * FIT, -0.06 * FIT],
        eyesPivot: pivot,
      } as CatGeo;
    })();
    cache.set(lite, p);
  }
  return p;
}
