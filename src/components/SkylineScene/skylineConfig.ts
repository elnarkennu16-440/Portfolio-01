/* ────────────────────────────────────────────────────────────────────────────
 * SKYLINE SCENE — all the numbers in one place.
 *
 * Same idea as HeroScene (CSS-3D version of the same maths): a ground plane,
 * a camera that looks down at it (TILT) and is turned (YAW). Same angles as
 * your Hero street, so the two scenes feel like one world.
 *
 *     x → right      y → toward YOU (negative y = far away)      z → up
 *
 * The buildings climb from the bottom-left to the top-right like your drawing:
 * small one near you, the tallest one far away.
 * Every size below is in "design pixels"; the whole scene is scaled to fit.
 * ──────────────────────────────────────────────────────────────────────────── */

export type SkyTheme = "dark" | "light";

/* ── CAMERA ─────────────────────────────────────────────────────────────── */
export interface SkyCameraPreset {
  /** the stage size this preset was designed for (the scene is scaled to fit) */
  designW: number;
  designH: number;
  /** turn of the street (deg). Bigger = row flatter / more horizontal */
  yaw: number;
  /** how much the ground is tilted back (deg). Same meaning as HeroScene */
  tilt: number;
  /** perspective distance (px). Smaller = stronger 3D */
  perspective: number;
  /** world point that sits in the middle of the stage */
  focus: [number, number, number];
  /** extra zoom (1 = as designed) */
  zoom?: number;
}

export const SKY_CAMERA: { desktop: SkyCameraPreset; mobile: SkyCameraPreset } =
  {
    desktop: {
      designW: 1900,
      designH: 1270,
      yaw: 46,
      tilt: 58,
      perspective: 3200,
      focus: [150, -20, 320],
    },
    mobile: {
      designW: 1280,
      designH: 1536,
      yaw: 46,
      tilt: 58,
      perspective: 2400,
      focus: [90, 0, 430],
      zoom: 1,
    },
  };

export interface SkyCameraVars {
  k: number;
  yaw: number;
  tilt: number;
  persp: number;
  /** label scale: cancels the scene scale so text keeps a real, readable size */
  ls: number;
  focus: [number, number, number];
  mobile: boolean;
}

/** W × H = size of the stage in px. Called on load + resize. */
export function computeSkyCamera(W: number, H: number): SkyCameraVars {
  const mobile = W < 1000; // phones + tablets use the compact layout
  const c = mobile ? SKY_CAMERA.mobile : SKY_CAMERA.desktop;
  const k = Math.min(W / c.designW, H / c.designH) * (c.zoom ?? 1);
  return {
    k,
    yaw: c.yaw,
    tilt: c.tilt,
    persp: c.perspective * k,
    ls: 1 / Math.max(k, 0.0001),
    focus: c.focus,
    mobile,
  };
}

/* ── BUILDINGS (the "bars" of the graph) ────────────────────────────────── */
export interface SkyBuilding {
  x: number; // left edge
  y: number; // far edge (smaller y = farther)
  w: number; // size along x
  d: number; // size along y
  h: number; // height
  seed: number; // window pattern
  lit: number; // share of lit windows (0–1)
  delay: number; // seconds after the reveal starts
  roof?: { x: number; y: number; w: number; d: number; h: number }[];
  /** the floating quote above this building */
  tag: string;
  title: string;
  text: string;
}

export const SKY_BUILDINGS: SkyBuilding[] = [
  {
    x: 0,
    y: 480,
    w: 170,
    d: 130,
    h: 95,
    seed: 5,
    lit: 0.1,
    delay: 0.1,
    roof: [{ x: 28, y: 30, w: 46, d: 40, h: 16 }],
    tag: "01",
    title: "Start small",
    text: "Every skyline begins with a single block.",
  },
  {
    x: 0,
    y: 230,
    w: 190,
    d: 130,
    h: 170,
    seed: 11,
    lit: 0.1,
    delay: 0.3,
    tag: "02",
    title: "Be patient",
    text: "Slow progress is still progress.",
  },
  {
    x: 0,
    y: -20,
    w: 210,
    d: 130,
    h: 262,
    seed: 17,
    lit: 0.11,
    delay: 0.5,
    roof: [{ x: 120, y: 50, w: 56, d: 46, h: 20 }],
    tag: "03",
    title: "Keep showing up",
    text: "Build a little, every single day.",
  },
  {
    x: 0,
    y: -270,
    w: 230,
    d: 130,
    h: 382,
    seed: 23,
    lit: 0.12,
    delay: 0.7,
    tag: "04",
    title: "Care for craft",
    text: "Details are what people remember.",
  },
  {
    x: 0,
    y: -520,
    w: 250,
    d: 130,
    h: 535,
    seed: 31,
    lit: 0.13,
    delay: 0.9,
    roof: [
      { x: 40, y: 34, w: 70, d: 58, h: 28 },
      { x: 170, y: 60, w: 40, d: 36, h: 16 },
    ],
    tag: "05",
    title: "Let it compound",
    text: "Great things take time, and they are worth the wait.",
  },
];

/* ── GROWTH ARROW (floats above the buildings, bottom-left → top-right) ──── */
export const GROWTH = {
  x: -430, // sits up-left of the row, clear of the quotes
  from: { y: 600, z: 110 },
  to: { y: -470, z: 600 },
  delay: 1.6,
};

/* ── TIME AXIS (flat on the ground, along the road direction) ───────────── */
export const AXIS = {
  x: 372,
  from: 600,
  to: -760,
  text: "THINGS COME WITH TIME",
  textY: 540,
  delay: 1.9,
};

/* ── GROUND ─────────────────────────────────────────────────────────────── */
export const GROUND = { x: -1100, y: -1500, size: 2800 };

/* ── FLOATING WORDS (small chips drifting in the air) ───────────────────── */
export interface SkyChip {
  x: number;
  y: number;
  z: number;
  text: string;
  delay: number;
  /** hidden on phones to keep the picture clean */
  skipOnMobile?: boolean;
}
export const SKY_CHIPS: SkyChip[] = [
  { x: 330, y: 330, z: 150, text: "small steps", delay: 2.2 },
  { x: 330, y: 20, z: 300, text: "+1% a day", delay: 2.4, skipOnMobile: true },
  { x: 340, y: -300, z: 470, text: "learn · ship", delay: 2.6 },
  { x: -300, y: 330, z: 210, text: "repeat", delay: 2.5, skipOnMobile: true },
  { x: -330, y: -250, z: 560, text: "keep going", delay: 2.8 },
  { x: 340, y: -640, z: 700, text: "someday", delay: 3.0, skipOnMobile: true },
];
