/* ────────────────────────────────────────────────────────────────────────────
 * HERO SCENE — all the numbers in one place.
 *
 * The scene is a real 3D street built from CSS 3D transforms (no libraries).
 * Ground coordinates (design pixels, before the screen scale is applied):
 *     x → right      y → toward YOU (negative y = far away, up the road)     z → up
 * The camera looks at the ground from above (TILT) and is turned (YAW) so the
 * road runs from the bottom-left to the top-right, like in your sketch.
 * ──────────────────────────────────────────────────────────────────────────── */

/* ── CAMERA ─────────────────────────────────────────────────────────────── */
export interface CameraPreset {
  /** the screen size this preset was designed for (the scene is scaled to fit) */
  designW: number;
  designH: number;
  /** where the world origin sits on the hero (0–1 of width / height) */
  anchorX: number;
  anchorY: number;
  /** turn of the street (deg). Bigger = road flatter, text easier to read */
  yaw: number;
  /** how much we look down (deg). 90 = straight down, 0 = street level */
  tilt: number;
  /** perspective distance (px). Smaller = stronger 3D */
  perspective: number;
  /** extra zoom of the whole scene (1 = as designed, 0.9 = a bit zoomed out).
   *  The scene shrinks toward the middle of the screen, so it stays centred. */
  zoom?: number;
}

export const CAMERA: { desktop: CameraPreset; mobile: CameraPreset } = {
  desktop: {
    designW: 2200,
    designH: 1250,
    anchorX: 0.5,
    anchorY: 0.72,
    yaw: 40,
    tilt: 58,
    perspective: 3200,
  },
  mobile: {
    designW: 960,
    designH: 1000,
    anchorX: 0.56,
    anchorY: 0.47,
    yaw: 42,
    tilt: 56,
    perspective: 1900,
    /* phones: zoomed out a little so the big KENNU letters have room at the sides */
    zoom: 0.88,
  },
};

export interface CameraVars {
  k: number;
  yaw: number;
  tilt: number;
  ax: number;
  ay: number;
  persp: number;
}

/** W × H = size of the hero stage in px. Called by Hero.tsx on load + resize. */
export function computeCamera(W: number, H: number): CameraVars {
  const desktop = W >= 992;
  const c = desktop ? CAMERA.desktop : CAMERA.mobile;
  const zoom = c.zoom ?? 1;
  const k =
    (desktop
      ? Math.min(W / c.designW, H / c.designH)
      : Math.min(W / c.designW, (H * 0.55) / c.designH)) * zoom;
  /* zoom about the middle of the 3D area (centre of the width, 34 % down), so the
     composition stays centred instead of sliding toward the anchor */
  const px = W * 0.5;
  const py = H * 0.34;
  return {
    k,
    yaw: c.yaw,
    tilt: c.tilt,
    ax: px + (W * c.anchorX - px) * zoom,
    ay: py + (H * c.anchorY - py) * zoom,
    persp: c.perspective * k,
  };
}

/* ── ROAD ───────────────────────────────────────────────────────────────── */
export const ROAD = {
  halfWidth: 170, // road is 340 wide, centred on x = 0
  walk: 80, // sidewalk width
  yFar: -2600,
  yNear: 820,
  crosswalkY: 330,
  crosswalkLen: 110,
};

/* ── BUILDINGS ──────────────────────────────────────────────────────────── */
export interface Block {
  x: number; // left edge
  y: number; // far edge (smaller y = farther)
  w: number; // size along x
  d: number; // size along y
  h: number; // height
  /** grey level (0–255) of the top / side facing the road / end facing you */
  tone: [number, number, number];
  seed: number; // window pattern
  lit: number; // share of lit windows (0–1)
  delay: number; // seconds after the reveal starts
  roof?: { x: number; y: number; w: number; d: number; h: number }[];
  /** hidden on phones / weak devices to save GPU memory */
  skipOnLite?: boolean;
}

export const BUILDINGS: Block[] = [
  {
    x: -650,
    y: -90,
    w: 320,
    d: 400,
    h: 600,
    tone: [60, 38, 24],
    seed: 3,
    lit: 0.12,
    delay: 0.3,
    roof: [{ x: 40, y: 50, w: 90, d: 80, h: 34 }],
  },
  {
    x: -625,
    y: -560,
    w: 295,
    d: 420,
    h: 430,
    tone: [48, 30, 19],
    seed: 7,
    lit: 0.098,
    delay: 0.42,
    roof: [{ x: 120, y: 100, w: 110, d: 90, h: 26 }],
  },
  {
    x: -700,
    y: -1050,
    w: 370,
    d: 380,
    h: 720,
    tone: [63, 41, 26],
    seed: 19,
    lit: 0.135,
    delay: 0.2,
    roof: [{ x: 60, y: 60, w: 80, d: 80, h: 44 }],
  },
  {
    x: -610,
    y: -1470,
    w: 280,
    d: 340,
    h: 360,
    tone: [45, 29, 18],
    seed: 23,
    lit: 0.075,
    delay: 0.5,
  },
  /* the two below are skipped on phones / weaker devices (see `lite`) */
  {
    x: -660,
    y: -1850,
    w: 330,
    d: 360,
    h: 540,
    tone: [49, 31, 20],
    seed: 31,
    lit: 0.09,
    delay: 0.38,
    skipOnLite: true,
  },
  {
    x: 400,
    y: -1320,
    w: 300,
    d: 340,
    h: 300,
    tone: [35, 23, 15],
    seed: 41,
    lit: 0.06,
    delay: 0.62,
    skipOnLite: true,
  },
];

/* ── BIG LETTERS "KENNU" (block letters built from polygons) ────────────── */
export const WORD = {
  text: "KENNU",
  cap: 360, // letter height
  gap: 15, // space between letters (letter units; 140 = full height)
  depth: 110, // how thick (deep) the letters are
  x: -204, // x of the FRONT face (the side you read), on the left sidewalk
  yStart: 330, // where the K starts (nearest to you)
};

/* letter outlines in a 140-unit-tall box: width + points */
export const GLYPHS: Record<string, { w: number; pts: [number, number][] }> = {
  K: {
    w: 90,
    pts: [
      [0, 0],
      [24, 0],
      [24, 54],
      [58, 0],
      [88, 0],
      [48, 70],
      [90, 140],
      [60, 140],
      [24, 88],
      [24, 140],
      [0, 140],
    ],
  },
  E: {
    w: 76,
    pts: [
      [0, 0],
      [76, 0],
      [76, 24],
      [24, 24],
      [24, 58],
      [66, 58],
      [66, 82],
      [24, 82],
      [24, 116],
      [76, 116],
      [76, 140],
      [0, 140],
    ],
  },
  N: {
    w: 86,
    pts: [
      [0, 0],
      [26, 0],
      [62, 80],
      [62, 0],
      [86, 0],
      [86, 140],
      [60, 140],
      [24, 60],
      [24, 140],
      [0, 140],
    ],
  },
  U: {
    w: 86,
    pts: [
      [0, 0],
      [24, 0],
      [24, 112],
      [62, 112],
      [62, 0],
      [86, 0],
      [86, 140],
      [0, 140],
    ],
  },
};

/* ── BILLBOARD (right side of the road) ─────────────────────────────────── */
export const BILLBOARD = {
  x: 330, // back of the board
  thick: 24,
  y: -940, // far end
  len: 600, // length along the road
  z: 150, // height of the bottom edge
  h: 330, // height of the board
  posts: [-380, -860], // y of the two posts
};

/* ── STREET LAMPS (right sidewalk) ──────────────────────────────────────── */
export const LAMPS = {
  x: 218,
  ys: [360, -80, -520, -960, -1400, -1840],
  h: 210,
};

/* ── CARS (light streaks on the road) ───────────────────────────────────── */
export interface Streak {
  x: number; // lane position
  dir: 1 | -1; // 1 = coming toward you, -1 = going away
  dur: number; // seconds for one pass
  delay: number; // negative = already on the road when it starts
  len: number;
}
export const STREAKS: Streak[] = [
  { x: 82, dir: 1, dur: 7.5, delay: -1, len: 190 },
  { x: 96, dir: 1, dur: 9.5, delay: -6, len: 120 },
  { x: 70, dir: 1, dur: 12, delay: -9, len: 240 },
  { x: -84, dir: -1, dur: 8.5, delay: -3, len: 170 },
  { x: -100, dir: -1, dur: 11, delay: -8, len: 130 },
  { x: -68, dir: -1, dur: 14, delay: -11, len: 220 },
];
