/* ────────────────────────────────────────────────────────────────────────────
 * ABOUT SCENE — all the numbers in one place.
 *
 * Same street as the Hero, but seen from the sidewalk at eye level (POV).
 * World: x → right, y → up, z → toward you (1 unit ≈ 1 metre).
 *   far sidewalk + buildings  z < -5      road  -5 … 2.5      near sidewalk  z > 2.5
 * ──────────────────────────────────────────────────────────────────────────── */

import type { V3 } from "./aboutGlUtils";

/** the paragraph shown on the comment sign (also read by About.tsx for screen readers) */
export const ABOUT_TEXT =
  "I maintain this platform as an open repository to document my background, practical work, and technical development. Instead of leaving projects confined to private directories, this space serves as an accessible record of my hands-on exploration and steady learning curve. I place high value on structural clarity and consistent routines. Much of my time involves refining interface behavior, addressing edge cases deliberately, and building applications with longevity and clean organization in mind.";

/* ── LOOKS: must match About.module.css (--about-bg) so canvas + section blend ── */
export const LOOKS = {
  dark: { bg: [0x12, 0x12, 0x14] as V3 }, // #121214
  /* light look = the Hero's light look: a literal white world (street, floor, sky) with
     the buildings / billboard / cat / sign staying black-grey. Set --about-bg (light) to #ffffff too. */
  light: { bg: [0xff, 0xff, 0xff] as V3 }, // #ffffff
};

/* ── CAMERA ─────────────────────────────────────────────────────────────── */
export interface Pose {
  eye: V3;
  target: V3;
  fov: number; // vertical, degrees
}

/** the Hero looks down from far away; scrolling into About moves the camera from
 *  START (that same high view) to END (street-level POV). */
export const CAMERA = {
  start: { eye: [-17, 25, 31], target: [1, 0.5, -4], fov: 38 } as Pose,
  end: { eye: [0, 1.8, 13.8], target: [0.6, 2.9, -5], fov: 50 } as Pose,
  /** phones / portrait: a little higher and wider so the billboard AND the cat fit */
  endPortrait: { eye: [0, 7.5, 21], target: [0, 2.8, -3], fov: 70 } as Pose,
  /** the horizontal field of view never goes below this (keeps both sides visible) */
  minHFov: 74,
  minHFovPortrait: 30,
  maxFov: 86,
  maxFovPortrait: 100,
  near: 0.1,
  far: 260,
};

/* ── FOG / DEPTH ────────────────────────────────────────────────────────── */
export const FOG = { start: 28, end: 105 };
/** light look: the haze starts later, so the black buildings stay black instead of going milky */
export const FOG_LIGHT = { start: 44, end: 130 };

/* ── STREET ─────────────────────────────────────────────────────────────── */
export const STREET = {
  x0: -48,
  x1: 48,
  z0: -12, // far edge of the textured ground
  z1: 26, // near edge
  roadFar: -5,
  roadNear: 2.5,
  crossX0: -1.2, // zebra crossing
  crossX1: 3.0,
};

/* ── LAND: the near sidewalk in front of the road (the square paving) ─────────
 * Bigger black squares (like the Hero's land) + the gravity waves live here.
 * split = where the road ends and the land starts (the road and everything on it never move). */
export const LAND = {
  split: STREET.roadNear + 0.15,
  /** size of one paving square (metres) */
  square: 2.4,
  /** size of one piece of the land mesh (the waves bend these) */
  cell: 0.5,
  cellLite: 0.8,
};

/* ── BUILDINGS (far side of the street) ─────────────────────────────────── */
export interface Block {
  x: number; // left edge
  zFront: number; // z of the face you see (+z face)
  w: number;
  d: number;
  h: number;
  seed: number;
  lit: number; // share of lit windows
  base: number; // wall grey (0-255)
  delay: number;
  skipOnLite?: boolean;
}
export const BUILDINGS: Block[] = [
  {
    x: -25,
    zFront: -9.5,
    w: 13.5,
    d: 9,
    h: 21,
    seed: 4,
    lit: 0.1,
    base: 34,
    delay: 0.25,
  },
  {
    x: -10.5,
    zFront: -11.5,
    w: 9.5,
    d: 9,
    h: 25,
    seed: 8,
    lit: 0.17,
    base: 30,
    delay: 0.4,
  },
  {
    x: -0.5,
    zFront: -12.5,
    w: 8,
    d: 9,
    h: 17,
    seed: 12,
    lit: 0.12,
    base: 28,
    delay: 0.55,
  },
  {
    x: 8.2,
    zFront: -15,
    w: 9.5,
    d: 9,
    h: 30,
    seed: 16,
    lit: 0.07,
    base: 24,
    delay: 0.35,
    skipOnLite: true,
  },
  {
    x: 19,
    zFront: -18,
    w: 12,
    d: 9,
    h: 15,
    seed: 20,
    lit: 0.06,
    base: 22,
    delay: 0.7,
    skipOnLite: true,
  },
];

/* ── GITHUB BILLBOARD (far sidewalk, left) ──────────────────────────────── */
export const BILLBOARD = {
  x: -6.8, // centre
  z: -7.2,
  yBottom: 1.7,
  w: 7.4,
  h: 4.16,
  yaw: 12, // degrees, turned a little toward you
  contributions: 612,
  /** phones: moved + scaled so it sits above the sign */
  portrait: { x: 0, z: -9, scale: 1.9, lift: 1.5, yaw: 0 },
  /** the picture in /public — shown on the board (turned grey). Falls back to a drawn calendar. */
  image: "Github-Contribution.png",
};

/* ── COMMENT SIGN (floats above the cat) ────────────────────────────────── */
export const SIGN = {
  /* desktop: wider + shorter bubble, pushed right so it no longer touches the GitHub board;
     the tail points down at the cat's head */
  x: 4.1, // (moved 1.2 left + tailX 1.4 so the tail still points at the cat while the sign is turned in 3D)
  y: 3.35, // centre height
  z: 1.8,
  w: 9.4,
  h: 2.55,
  depth: 0.32,
  radius: 0.5,
  tailX: 1.4, // tail position from the centre (right of the middle)
  tailLen: 0.95,
  tailW: 0.95,
  /** 3D perspective: the sign is turned so its RIGHT side comes toward you (bigger) and its LEFT side
   *  goes away (smaller). Negative = right side nearer. 0 = flat on to the screen. */
  yaw: -28,
  /** portrait / phones: wide + short bubble that sits BELOW the GitHub board (the contribution
   *  graph stays fully visible); long tail down to the base of the sign */
  portrait: {
    x: -0.8, // (moved left + tailX 1.95 so the tail stays on the cat while the sign is turned)
    y: 5.1,
    z: 3,
    w: 12.6,
    h: 3.9,
    tailX: 1.95,
    tailLen: 2.4,
    tailW: 1.3,
    yaw: -22, // same 3D turn as desktop, a little softer for the narrow screen
    /** how much of the half-width of the screen the bubble may use (see signFit in aboutGl.ts) */
    fitLimit: 0.83,
  },
  /** desktop: same idea. On narrower windows the bubble shrinks (around its tail tip) instead of
   *  running off the right edge. fitMin = the smallest it is allowed to get (1 = full size). */
  fitLimit: 0.93,
  fitMin: 0.6,
  /** typing speed */
  charsPerSecond: 58,
};

/* ── CAT (near sidewalk, bottom right) ──────────────────────────────────── */
export const CAT = {
  x: 4.3,
  z: 4.3,
  yaw: -26,
  scale: 1.5,
  portraitX: 1.4,
  portraitZ: 5.3,
  portraitScale: 1.0,
  portraitYaw: 0,
};

/* ── STREET LAMP + CARS + DUST ──────────────────────────────────────────── */
export const LAMP = { x: -2.2, z: -5.6, h: 8.4 };
/* speed is in metres per second: 12 ≈ 43 km/h, 15 ≈ 54 km/h (city traffic, similar pace to the Hero streaks) */
export const CARS = [
  { lane: -3.5, dir: -1, speed: 16, x0: 34, len: 4.4, tone: 5 },
  { lane: 0.9, dir: 1, speed: 20, x0: -30, len: 4.6, tone: 8 },
];
/** length of the loop a car drives before it comes around again (metres) */
export const CARS_RANGE = 110;
/** phones: the road is far from the camera, so the cars are drawn a bit bigger to keep a believable size next to the cat */
export const CARS_PORTRAIT_SCALE = 1.6;
export const DUST = { count: 90, liteCount: 40 };

/* ── REVEAL TIMELINE (seconds after the About scene starts) ─────────────── */
export const TIMELINE = {
  ground: { delay: 0.05, dur: 1.4 },
  lampOn: 1.6,
  billboard: { delay: 0.9, dur: 1.5 },
  billboardOn: 2.1, // the screen lights up
  cat: { delay: 1.5, dur: 1.2 },
  sign: { delay: 2.0, dur: 1.1 },
  typeStart: 3.3,
  cars: 2.6,
};
