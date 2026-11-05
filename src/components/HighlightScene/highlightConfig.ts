/* ────────────────────────────────────────────────────────────────────────────
 * HIGHLIGHT SCENE — all the numbers in one place.
 *
 * Same world rules as the hero street (see HeroScene/sceneConfig.ts):
 *     x → right      y → toward YOU (negative y = far away)      z → up
 * Six towers stand in a row going away from you, each one taller than the last
 * (like a bar graph made of buildings). A thin arrow floats above them, rising
 * with the heights, like in the sketch. The camera looks down from above (TILT)
 * and is turned (YAW), so the row climbs from the bottom-left to the top-right.
 *
 * Nothing here touches the hero. This file only has numbers: tweak freely.
 * ──────────────────────────────────────────────────────────────────────────── */

export type V3 = [number, number, number];

/* ── CAMERA ─────────────────────────────────────────────────────────────── */
export interface HLCameraPreset {
  /** turn of the row (deg). Smaller = row runs more upward on screen, bigger = flatter */
  yaw: number;
  /** how much we look down (deg). 90 = straight down, 0 = street level */
  tilt: number;
  /** perspective distance (px, before the fit scale). Smaller = stronger 3D */
  perspective: number;
  /** free space (css px) kept around the scene: left / right / top (for the floating
   *  notes) / bottom. The scene is scaled to fit inside the rest. */
  pad: { l: number; r: number; t: number; b: number };
  /** left padding used when the stage is about 1005 px or wider (page ≥ 1100 px): the scene moves right
   *  to leave room for the list of notes on the left */
  wideLeft?: number;
}

export const HL_CAMERA: { desktop: HLCameraPreset; mobile: HLCameraPreset } = {
  desktop: {
    yaw: 46,
    tilt: 56,
    perspective: 3200,
    pad: { l: 24, r: 36, t: 64, b: 20 },
    wideLeft: 430,
  },
  /* phones (stage narrower than 700 px): the row stands more upright so it
     uses the tall space instead of a thin diagonal */
  mobile: {
    yaw: 30,
    tilt: 54,
    perspective: 2600,
    pad: { l: 10, r: 14, t: 48, b: 16 },
  },
};

/* ── TOWERS ─────────────────────────────────────────────────────────────── */
export interface HLBar {
  w: number; // size along x
  d: number; // size along y
  h: number; // height
  /** grey level (0–255) of the top / long side / end facing you (same idea as the hero) */
  tone: [number, number, number];
  seed: number; // window pattern
  lit: number; // share of lit windows (0–1)
  roof?: { x: number; y: number; w: number; d: number; h: number }[];
}

/** distance between the front edges of two neighbouring towers */
export const HL_SPACING = 250;

export const HL_BARS: HLBar[] = [
  {
    w: 190,
    d: 190,
    h: 150,
    tone: [44, 28, 18],
    seed: 11,
    lit: 0.07,
    roof: [{ x: 60, y: 50, w: 64, d: 56, h: 18 }],
  },
  { w: 190, d: 190, h: 270, tone: [47, 30, 19], seed: 12, lit: 0.09 },
  {
    w: 190,
    d: 190,
    h: 400,
    tone: [50, 32, 21],
    seed: 13,
    lit: 0.105,
    roof: [{ x: 30, y: 40, w: 70, d: 60, h: 22 }],
  },
  { w: 190, d: 190, h: 550, tone: [54, 35, 23], seed: 14, lit: 0.12 },
  {
    w: 190,
    d: 190,
    h: 710,
    tone: [58, 37, 24],
    seed: 15,
    lit: 0.14,
    roof: [{ x: 90, y: 70, w: 60, d: 60, h: 30 }],
  },
  {
    w: 190,
    d: 190,
    h: 900,
    tone: [62, 40, 26],
    seed: 16,
    lit: 0.16,
    roof: [{ x: 40, y: 40, w: 80, d: 70, h: 36 }],
  },
];

/** footprint of tower i: x0..x1 across, yFar..yNear along the row (centred on x = 0) */
export function barRect(i: number) {
  const b = HL_BARS[i];
  const yNear = -i * HL_SPACING;
  return { x0: -b.w / 2, x1: b.w / 2, yFar: yNear - b.d, yNear };
}

/** the middle of the roof of tower i (labels and the arrow are anchored to it) */
export function barTop(i: number): V3 {
  const r = barRect(i);
  return [(r.x0 + r.x1) / 2, (r.yFar + r.yNear) / 2, HL_BARS[i].h];
}

/* ── BASE SLAB the towers stand on ──────────────────────────────────────── */
const lastFar = barRect(HL_BARS.length - 1).yFar;
export const HL_SLAB = {
  x0: -300,
  x1: 300,
  y1: 200, // near edge
  y0: lastFar - 130, // far edge
  thick: 28,
};

/* ── GRID on the ground around the slab (fades out toward the edges) ───── */
export const HL_GRID = {
  step: 150,
  x0: -1200,
  x1: 1200,
  y0: -2400,
  y1: 700,
  cx: 0,
  cy: -800,
  rx: 1150,
  ry: 1600,
  inner: 0.3, // 0–1, where the fade starts
};

/* ── ARROW (floats above the towers, rises with them) ───────────────────── */
export const HL_ARROW = {
  /** shift from the tower tops. x > 0 puts the arrow on the right side of the towers
   *  (lower-right on screen, like the second arrow of the sketch), x < 0 on the left.
   *  z lifts it. This is the main knob if the arrow touches the floating chips. */
  offset: [340, 0, 40] as V3,
  /** the arrow's height = tower height × zScale + offset z */
  zScale: 0.6,
  width: 16, // ribbon width
  headLen: 80,
  headHalf: 42,
  startBack: 230, // how far before the first tower the arrow begins
  endAhead: 240, // how far past the last tower it ends
  endRise: 150, // extra height at the tip
  subdiv: 8, // smoothness (segments between two control points)
};

/** Catmull-Rom point between p1 and p2 */
function cr(p0: V3, p1: V3, p2: V3, p3: V3, t: number): V3 {
  const t2 = t * t;
  const t3 = t2 * t;
  const c = (a: number, b: number, c2: number, d: number) =>
    0.5 *
    (2 * b +
      (-a + c2) * t +
      (2 * a - 5 * b + 4 * c2 - d) * t2 +
      (-a + 3 * b - 3 * c2 + d) * t3);
  return [
    c(p0[0], p1[0], p2[0], p3[0]),
    c(p0[1], p1[1], p2[1], p3[1]),
    c(p0[2], p1[2], p2[2], p3[2]),
  ];
}

/** the centre line of the arrow (a smooth curve through points above every tower) */
export function buildArrowPath(): V3[] {
  const o = HL_ARROW.offset;
  const tops = HL_BARS.map((_, i): V3 => {
    const t = barTop(i);
    return [t[0] + o[0], t[1] + o[1], t[2] * HL_ARROW.zScale + o[2]];
  });
  const first = tops[0];
  const last = tops[tops.length - 1];
  const start: V3 = [first[0], first[1] + HL_ARROW.startBack, first[2] - 30];
  const end: V3 = [
    last[0],
    last[1] - HL_ARROW.endAhead,
    last[2] + HL_ARROW.endRise,
  ];
  const ctrl: V3[] = [start, ...tops, end];
  const pts: V3[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)];
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let s = 0; s < HL_ARROW.subdiv; s++) {
      pts.push(cr(p0, p1, p2, p3, s / HL_ARROW.subdiv));
    }
  }
  pts.push(end);
  return pts;
}

/** every point that must be inside the picture (used to scale the scene to fit) */
export function buildFitPoints(): V3[] {
  const pts: V3[] = [];
  const S = HL_SLAB;
  for (const x of [S.x0, S.x1])
    for (const y of [S.y0, S.y1])
      for (const z of [-S.thick, 0]) pts.push([x, y, z]);
  HL_BARS.forEach((b, i) => {
    const r = barRect(i);
    for (const x of [r.x0, r.x1])
      for (const y of [r.yFar, r.yNear]) pts.push([x, y, b.h + 40]);
  });
  const a = HL_ARROW;
  for (const p of buildArrowPath()) {
    pts.push([p[0] - a.headHalf, p[1], p[2]]);
    pts.push([p[0] + a.headHalf, p[1], p[2]]);
  }
  return pts;
}
