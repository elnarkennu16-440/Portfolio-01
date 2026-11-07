/* ────────────────────────────────────────────────────────────────────────────
 * ABOUT SCENE PARTS — the geometry of every object (each function returns a
 * MeshBuilder). Colours are "baked" light (no lighting maths while drawing).
 * ──────────────────────────────────────────────────────────────────────────── */

import { MeshBuilder, RGBA, V2, V3, rng, triangulate } from "./aboutGlUtils";
import {
  BILLBOARD,
  BUILDINGS,
  Block,
  CAT,
  DUST,
  LAMP,
  LAND,
  SIGN,
  STREET,
} from "./aboutSceneConfig";

export { ABOUT_TEXT } from "./aboutSceneConfig";

export const gray = (n: number, a = 1): RGBA => [n / 255, n / 255, n / 255, a];
const UV4: V2[] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

/* ── ground ─────────────────────────────────────────────────────────────── */
/** the textured street (sidewalks, road, crossing) */
export function buildGround(): MeshBuilder {
  // the far sidewalk + the road, up to where the land starts (never moves)
  const m = new MeshBuilder();
  const v1 = (LAND.split - STREET.z0) / (STREET.z1 - STREET.z0);
  m.quad(
    [
      [STREET.x0, 0, STREET.z0],
      [STREET.x1, 0, STREET.z0],
      [STREET.x1, 0, LAND.split],
      [STREET.x0, 0, LAND.split],
    ],
    [
      [0, 0],
      [1, 0],
      [1, v1],
      [0, v1],
    ],
    gray(255),
  );
  return m;
}

/** the LAND: the near sidewalk in front of the road, cut into small pieces so the
 *  gravity waves can bend it. Same texture as the street (continues exactly where
 *  buildGround() stops), so with no waves it looks like one flat street. */
export function buildLand(lite: boolean): MeshBuilder {
  const m = new MeshBuilder();
  const cell = lite ? LAND.cellLite : LAND.cell;
  const nx = Math.ceil((STREET.x1 - STREET.x0) / cell);
  const nz = Math.ceil((STREET.z1 - LAND.split) / cell);
  const v0 = (LAND.split - STREET.z0) / (STREET.z1 - STREET.z0);
  for (let j = 0; j < nz; j++) {
    const za = LAND.split + ((STREET.z1 - LAND.split) * j) / nz;
    const zb = LAND.split + ((STREET.z1 - LAND.split) * (j + 1)) / nz;
    const va = v0 + (1 - v0) * (j / nz);
    const vb = v0 + (1 - v0) * ((j + 1) / nz);
    for (let i = 0; i < nx; i++) {
      const xa = STREET.x0 + ((STREET.x1 - STREET.x0) * i) / nx;
      const xb = STREET.x0 + ((STREET.x1 - STREET.x0) * (i + 1)) / nx;
      m.quad(
        [
          [xa, 0, za],
          [xb, 0, za],
          [xb, 0, zb],
          [xa, 0, zb],
        ],
        [
          [i / nx, va],
          [(i + 1) / nx, va],
          [(i + 1) / nx, vb],
          [i / nx, vb],
        ],
        gray(255),
      );
    }
  }
  return m;
}

/** plain dark floor around the textured part, so the high start camera never sees an edge */
export function buildFloor(): MeshBuilder {
  const m = new MeshBuilder();
  m.ground(-260, -260, 260, 80, -0.03, gray(14));
  return m;
}

/* ── buildings ──────────────────────────────────────────────────────────── */
export function buildBuilding(b: Block): {
  front: MeshBuilder;
  side: MeshBuilder;
  top: MeshBuilder;
} {
  const x1 = b.x + b.w;
  const zB = b.zFront - b.d;
  const front = new MeshBuilder();
  front.quad(
    [
      [b.x, b.h, b.zFront],
      [x1, b.h, b.zFront],
      [x1, 0, b.zFront],
      [b.x, 0, b.zFront],
    ],
    UV4,
    gray(255),
  );

  const side = new MeshBuilder();
  // wall facing +x (seen from the left of it) and wall facing -x (seen from the right of it)
  side.quad(
    [
      [x1, b.h, b.zFront],
      [x1, b.h, zB],
      [x1, 0, zB],
      [x1, 0, b.zFront],
    ],
    UV4,
    gray(255),
  );
  side.quad(
    [
      [b.x, b.h, zB],
      [b.x, b.h, b.zFront],
      [b.x, 0, b.zFront],
      [b.x, 0, zB],
    ],
    UV4,
    gray(255),
  );

  const top = new MeshBuilder();
  top.quad(
    [
      [b.x, b.h, zB],
      [x1, b.h, zB],
      [x1, b.h, b.zFront],
      [b.x, b.h, b.zFront],
    ],
    UV4,
    gray(b.base * 0.7),
  );
  // a rooftop box or two
  const r = rng(b.seed);
  for (let i = 0; i < 2; i++) {
    const w = 1.6 + r() * 2.4;
    const d = 1.4 + r() * 2;
    const h = 0.8 + r() * 1.4;
    top.box(
      b.x + 1 + r() * (b.w - w - 2),
      b.h,
      b.zFront - 1 - r() * (b.d - d - 2) + 0,
      w,
      h,
      d,
      gray(b.base * 0.95),
      gray(b.base * 0.55),
      gray(b.base * 0.4),
    );
  }
  return { front, side, top };
}

export const lastBuildingIndex = BUILDINGS.length - 1;

/* ── GitHub billboard (local coords: centred on x = 0, z = 0) ───────────── */
export function buildBillboard(lift = 0): {
  panel: MeshBuilder;
  frame: MeshBuilder;
  beams: MeshBuilder;
} {
  const B = BILLBOARD;
  const hw = B.w / 2;
  const y0 = B.yBottom + lift; // lift = taller posts (used on phones)
  const y1 = B.yBottom + lift + B.h;
  const zf = 0.16; // front of the panel

  const panel = new MeshBuilder();
  panel.quad(
    [
      [-hw, y1, zf],
      [hw, y1, zf],
      [hw, y0, zf],
      [-hw, y0, zf],
    ],
    UV4,
    gray(255),
  );

  const frame = new MeshBuilder();
  const t = 0.14;
  const top = gray(78),
    front = gray(30),
    side = gray(18);
  // frame bars around the panel
  frame.box(-hw - t, y1, zf + 0.04, B.w + 2 * t, t, 0.34, top, front, side);
  frame.box(-hw - t, y0 - t, zf + 0.04, B.w + 2 * t, t, 0.34, top, front, side);
  frame.box(-hw - t, y0, zf + 0.04, t, B.h, 0.34, top, front, side);
  frame.box(hw, y0, zf + 0.04, t, B.h, 0.34, top, front, side);
  // back of the board (so it has thickness)
  frame.box(-hw, y0, zf - 0.02, B.w, B.h, 0.22, gray(26), gray(12), gray(12));
  // two posts + a wide base slab
  for (const px of [-hw * 0.52, hw * 0.52])
    frame.box(
      px - 0.14,
      0,
      0.0,
      0.28,
      y0 + 0.2,
      0.28,
      gray(60),
      gray(24),
      gray(14),
    );
  frame.box(
    -hw * 0.7,
    0,
    0.55,
    B.w * 0.7,
    0.24,
    1.1,
    gray(52),
    gray(20),
    gray(12),
  );
  // lamp bar above the board + 3 lamps
  frame.box(
    -hw * 0.9,
    y1 + 0.62,
    0.62,
    B.w * 0.9,
    0.1,
    0.1,
    gray(100),
    gray(48),
    gray(30),
  );
  for (const lx of [-hw * 0.5, 0, hw * 0.5]) {
    frame.box(
      lx - 0.08,
      y1 + 0.2,
      0.62,
      0.16,
      0.08,
      0.1,
      gray(90),
      gray(40),
      gray(30),
    ); // arm
    frame.box(
      lx - 0.3,
      y1 + 0.54,
      0.7,
      0.6,
      0.08,
      0.24,
      gray(255),
      gray(255),
      gray(255),
    ); // lamp
  }

  // light cones from the lamps onto the board
  const beams = new MeshBuilder();
  for (const lx of [-hw * 0.5, 0, hw * 0.5]) {
    const apex: V3 = [lx, y1 + 0.52, 0.8];
    const l: V3 = [lx - 1.5, y0 + 0.3, zf + 0.06];
    const r: V3 = [lx + 1.5, y0 + 0.3, zf + 0.06];
    beams.tri(
      [apex, l, r],
      [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      [gray(255, 0.2), gray(255, 0), gray(255, 0)],
    );
  }
  return { panel, frame, beams };
}

/* ── comment sign (local coords: centred on x = 0, y = 0; tail points down) ── */
export interface SignGeo {
  body: MeshBuilder;
  text: MeshBuilder;
  tip: V3; // the tail tip (pivot for the pop animation)
  w: number;
  h: number;
}

export function buildCommentSign(
  w: number,
  h: number,
  tailX: number = SIGN.tailX,
): SignGeo {
  const r = SIGN.radius;
  const hw = w / 2;
  const hh = h / 2;
  const pts: V2[] = [];
  const arc = (cx: number, cy: number, a0: number, a1: number) => {
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  // clockwise outline, starting at the top-left corner
  arc(-hw + r, hh - r, 180, 90);
  arc(hw - r, hh - r, 90, 0);
  arc(hw - r, -hh + r, 0, -90);
  const tx = tailX;
  pts.push([tx + SIGN.tailW / 2, -hh]);
  pts.push([tx + 0.28, -hh - SIGN.tailLen]);
  pts.push([tx - SIGN.tailW / 2, -hh]);
  arc(-hw + r, -hh + r, -90, -180);

  const tris = triangulate(pts);
  const d = SIGN.depth;
  const body = new MeshBuilder();
  const shade = (y: number): RGBA => gray(58 - ((hh - y) / h) * 10);
  for (const [a, b, c] of tris) {
    const ids = [a, b, c];
    body.tri(
      ids.map((i) => [pts[i][0], pts[i][1], d / 2] as V3),
      ids.map(() => [0, 0] as V2),
      ids.map((i) => shade(pts[i][1])),
    );
  }
  // side walls: lit from above (clockwise outline → outward normal = (-dy, dx))
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = -(y2 - y1) / len;
    const ny = (x2 - x1) / len;
    const lum = 24 + 70 * Math.max(0, nx * -0.3 + ny * 0.95);
    body.quad(
      [
        [x1, y1, d / 2],
        [x2, y2, d / 2],
        [x2, y2, -d / 2],
        [x1, y1, -d / 2],
      ],
      UV4,
      gray(lum),
    );
  }

  const text = new MeshBuilder();
  const zt = d / 2 + 0.008;
  text.quad(
    [
      [-hw, hh, zt],
      [hw, hh, zt],
      [hw, -hh, zt],
      [-hw, -hh, zt],
    ],
    UV4,
    gray(255),
  );

  // two posts behind the sign + a small base
  return { body, text, tip: [tx + 0.28, -hh - SIGN.tailLen, 0], w, h };
}

/** posts + slab under the sign, in WORLD coordinates */
export function buildSignPosts(
  cx: number,
  bottomY: number,
  z: number,
  w: number,
): MeshBuilder {
  const m = new MeshBuilder();
  for (const px of [cx - w * 0.3, cx + w * 0.3])
    m.box(
      px - 0.11,
      0,
      z - 0.3,
      0.22,
      bottomY + 0.4,
      0.22,
      gray(44),
      gray(16),
      gray(10),
    );
  m.box(
    cx - w * 0.42,
    0,
    z + 0.3,
    w * 0.84,
    0.18,
    0.9,
    gray(40),
    gray(16),
    gray(10),
  );
  return m;
}

/* the cat now lives in aboutCat.ts (realistic lying cat) */

/* ── street lamp + the light it throws ──────────────────────────────────── */
export function buildLamp(): {
  pole: MeshBuilder;
  beam: MeshBuilder;
  pool: MeshBuilder;
  streak: MeshBuilder;
} {
  const pole = new MeshBuilder();
  const { x, z, h } = LAMP;
  pole.box(x - 0.1, 0, z + 0.1, 0.2, h, 0.2, gray(120), gray(52), gray(30));
  pole.box(
    x - 0.1,
    h - 0.1,
    z + 0.1,
    0.2,
    0.2,
    0.2,
    gray(120),
    gray(52),
    gray(30),
  );
  pole.box(
    x - 0.08,
    h - 0.04,
    z + 0.08,
    0.16,
    0.12,
    3.0,
    gray(120),
    gray(52),
    gray(30),
  ); // arm over the road
  pole.box(
    x - 0.45,
    h - 0.2,
    z + 3.1,
    0.9,
    0.14,
    0.5,
    gray(255),
    gray(255),
    gray(255),
  ); // lamp head

  // light cone (additive)
  const beam = new MeshBuilder();
  const apex: V3 = [x, h - 0.2, z + 2.85];
  beam.tri(
    [apex, [x - 3.4, 0.02, z + 1.4], [x + 3.4, 0.02, z + 4.6]],
    [
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [gray(255, 0.1), gray(255, 0.0), gray(255, 0.0)],
  );

  // pool of light on the road + the long wet reflection toward the viewer
  const pool = new MeshBuilder();
  pool.ground(x - 5, z + 0.2, x + 5, z + 6.6, 0.02, gray(255, 0.3));

  const streak = new MeshBuilder();
  // trapezoid: narrow far away, wide near the viewer
  streak.quad(
    [
      [x - 0.9, 0.035, z + 1.2],
      [x + 0.9, 0.035, z + 1.2],
      [x + 3.2, 0.035, z + 8.4],
      [x - 3.2, 0.035, z + 8.4],
    ],
    UV4,
    gray(255, 0.5),
  );
  return { pole, beam, pool, streak };
}

/* ── cars (local coords: front at +x, ground at y = 0, centred on z = 0) ── */
export function buildCar(
  len: number,
  tone: number,
): { body: MeshBuilder; lights: MeshBuilder } {
  const body = new MeshBuilder();
  const hl = len / 2;
  body.box(
    -hl,
    0.35,
    0.9,
    len,
    0.75,
    1.8,
    gray(tone + 22),
    gray(tone + 8),
    gray(tone + 4),
  );
  body.box(
    -hl * 0.45,
    1.1,
    0.8,
    len * 0.5,
    0.62,
    1.6,
    gray(tone + 28),
    gray(tone + 10),
    gray(tone + 6),
  );
  body.box(-hl + 0.3, 0.12, 0.8, 0.7, 0.28, 1.6, gray(2), gray(2), gray(2)); // wheels (rough)
  body.box(hl - 1.0, 0.12, 0.8, 0.7, 0.28, 1.6, gray(2), gray(2), gray(2));
  const lights = new MeshBuilder();
  for (const zz of [-0.62, 0.62]) {
    lights.box(
      hl - 0.04,
      0.62,
      zz + 0.22,
      0.06,
      0.2,
      0.44,
      gray(255),
      gray(255),
      gray(255),
    );
    lights.box(
      -hl - 0.02,
      0.62,
      zz + 0.22,
      0.06,
      0.18,
      0.4,
      gray(255),
      gray(170),
      gray(170),
    );
  }
  return { body, lights };
}

/* ── dust / stars ───────────────────────────────────────────────────────── */
export function buildDust(count: number): MeshBuilder {
  const m = new MeshBuilder();
  const r = rng(99);
  for (let i = 0; i < count; i++) {
    const p: V3 = [-28 + r() * 56, 2.2 + r() * 15, -14 + r() * 24];
    m.vert(p, [0, 0], gray(255, 0.25 + r() * 0.55), 0, 0);
  }
  return m;
}

export { CAT, DUST };
