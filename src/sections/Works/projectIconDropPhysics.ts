/**
 * projectIconDropPhysics.ts
 *
 * Pure logic (NO DOM access) for the "icon falls off the toppled tower" effect used in
 * ViewAllProjects. Everything here is just math: it builds a timeline (a "plan") that
 * the component plays back with requestAnimationFrame.
 *
 * Coordinates: every pose is a translation RELATIVE to the icon's home slot (0,0 = the
 * original position). Rects passed in are client (viewport) rects.
 */

export interface Pose {
  /** translate X / Y in px, relative to the home slot */
  x: number;
  y: number;
  /** rotations in degrees (rz = flat spin, rx / ry = 3D tilt) */
  rz: number;
  rx: number;
  ry: number;
  /** scale */
  s: number;
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface Crack {
  /** SVG path data in a 0..100 box (starts at the crack's origin) */
  d: string;
  /** crack "level" (0..1) at which this crack starts to grow */
  start: number;
}

export interface DropPlan {
  /** total length of the drop in seconds */
  duration: number;
  /** final resting pose */
  rest: Pose;
  poseAt: (t: number) => Pose;
  /** how much of the cracks are visible (0..1) */
  crackAt: (t: number) => number;
  /** impact flash intensity (0..1) */
  flashAt: (t: number) => number;
  cracks: Crack[];
}

export interface PlanInput {
  /** rect of the icon's home slot (never transformed) */
  home: Rect;
  /** rect of the tower's front face: the icon may never leave it */
  front: Rect;
  /** project index: gives every project its own "personality" of falling */
  personality: number;
  /** rects of buttons / links: the icon avoids landing on them */
  keepOut?: Rect[];
  /** reduced-motion: a short, gentle fall without spin or bounce */
  calm?: boolean;
  rnd?: () => number;
}

/* ------------------------------------------------------------------ constants */

export const ZERO_POSE: Pose = { x: 0, y: 0, rz: 0, rx: 0, ry: 0, s: 1 };
export const PERSPECTIVE_PX = 700;
export const MAX_CRACKS = 8;
/** how long (in crack-level units) a single crack takes to grow */
export const CRACK_SPAN = 0.5;

/** gap kept between the icon and the edge of the tower face */
const EDGE_PAD = 8;
/** the icon never lands further than this (px) to the right of its home slot */
const MAX_TRAVEL_X = 560;

/* -------------------------------------------------------------------- helpers */

export const clamp = (v: number, a: number, b: number) =>
  Math.min(Math.max(v, a), b);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (t: number) => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const easeInOutCubic = (t: number) => {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};

export const poseToTransform = (p: Pose): string =>
  `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) ` +
  `perspective(${PERSPECTIVE_PX}px) ` +
  `rotateX(${p.rx.toFixed(2)}deg) rotateY(${p.ry.toFixed(2)}deg) ` +
  `rotateZ(${p.rz.toFixed(2)}deg) scale(${p.s.toFixed(4)})`;

/** half of the bounding-box size of a square (side = size) rotated by deg */
export const halfExtent = (size: number, deg: number) => {
  const r = (deg * Math.PI) / 180;
  return (size / 2) * (Math.abs(Math.cos(r)) + Math.abs(Math.sin(r)));
};

const maxHalfExtent = (size: number, degs: number[], slack: number) => {
  let m = 0;
  for (const d of degs) {
    m = Math.max(
      m,
      halfExtent(size, d - slack),
      halfExtent(size, d),
      halfExtent(size, d + slack),
    );
  }
  return m;
};

/**
 * Range of translations that keeps a tile (with the given half extent) inside `front`.
 */
export const translationBounds = (
  home: Rect,
  front: Rect,
  half: number,
  pad = EDGE_PAD,
): Bounds => {
  const cx = (home.left + home.right) / 2;
  const cy = (home.top + home.bottom) / 2;
  let minX = front.left + pad + half - cx;
  let maxX = front.right - pad - half - cx;
  let minY = front.top + pad + half - cy;
  let maxY = front.bottom - pad - half - cy;
  if (minX > maxX) minX = maxX = (minX + maxX) / 2;
  if (minY > maxY) minY = maxY = (minY + maxY) / 2;
  return { minX, maxX, minY, maxY };
};

/** Makes sure the home position (0,0) is always allowed, so nothing ever "jumps" at the start. */
export const relaxBounds = (b: Bounds): Bounds => ({
  minX: Math.min(b.minX, 0),
  maxX: Math.max(b.maxX, 0),
  minY: Math.min(b.minY, 0),
  maxY: Math.max(b.maxY, 0),
});

const overlapArea = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
  Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

/* ----------------------------------------------------------- personalities
 * Each of the first 6 projects falls in its own style. Random jitter on top of it
 * makes every single drop different as well.
 */
interface Personality {
  dir: 1 | -1; // spin / drift direction
  spin: [number, number]; // degrees spun during the fall
  tumbleX: number; // 3D tumble amplitude (deg)
  tumbleY: number;
  bounce: [number, number]; // restitution of the first bounce
  drift: [number, number]; // sideways slide after the first bounce (px)
  shake: number; // strength of the "loose" wobble before falling
}

const PERSONALITIES: Personality[] = [
  {
    dir: 1,
    spin: [26, 42],
    tumbleX: 30,
    tumbleY: 12,
    bounce: [0.36, 0.42],
    drift: [16, 26],
    shake: 1.0,
  },
  {
    dir: -1,
    spin: [14, 26],
    tumbleX: 16,
    tumbleY: 28,
    bounce: [0.3, 0.36],
    drift: [24, 36],
    shake: 0.7,
  },
  {
    dir: 1,
    spin: [34, 52],
    tumbleX: 40,
    tumbleY: 20,
    bounce: [0.32, 0.4],
    drift: [10, 18],
    shake: 1.3,
  },
  {
    dir: -1,
    spin: [20, 34],
    tumbleX: 24,
    tumbleY: 8,
    bounce: [0.4, 0.46],
    drift: [14, 22],
    shake: 0.9,
  },
  {
    dir: 1,
    spin: [10, 20],
    tumbleX: 12,
    tumbleY: 34,
    bounce: [0.28, 0.34],
    drift: [26, 40],
    shake: 0.6,
  },
  {
    dir: -1,
    spin: [30, 46],
    tumbleX: 36,
    tumbleY: 16,
    bounce: [0.34, 0.44],
    drift: [12, 20],
    shake: 1.1,
  },
];

export const personalityFromKey = (key: string): number => {
  const digits = parseInt(key.replace(/\D/g, ""), 10);
  if (!Number.isNaN(digits)) return Math.max(0, digits - 1);
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
};

/* --------------------------------------------------------------------- cracks */

export const buildCracks = (rnd: () => number = Math.random): Crack[] => {
  const R = (a: number, b: number) => a + (b - a) * rnd();
  const corner = Math.floor(rnd() * 4);
  const ox = corner % 2 === 0 ? R(8, 26) : R(74, 92);
  const oy = corner < 2 ? R(8, 26) : R(74, 92);
  const base = Math.atan2(50 - oy, 50 - ox) + R(-0.25, 0.25);
  const nMain = 4 + Math.floor(rnd() * 3); // 4..6
  const fmt = (n: number) => n.toFixed(1);

  const cracks: Crack[] = [];
  const mains: { pts: [number, number][]; ang: number[] }[] = [];

  for (let i = 0; i < nMain; i++) {
    let a = base + (i - (nMain - 1) / 2) * R(0.42, 0.6) + R(-0.12, 0.12);
    let x = ox;
    let y = oy;
    const pts: [number, number][] = [[x, y]];
    const ang: number[] = [a];
    for (let s = 0; s < 4; s++) {
      a += R(-0.4, 0.4);
      const len = R(11, 19);
      x += Math.cos(a) * len;
      y += Math.sin(a) * len;
      pts.push([x, y]);
      ang.push(a);
    }
    mains.push({ pts, ang });
    cracks.push({
      d: "M" + pts.map((p) => `${fmt(p[0])} ${fmt(p[1])}`).join(" L"),
      start: i * 0.05,
    });
  }

  // up to two small side branches growing out of the main cracks
  const order = mains.map((_, i) => i).sort(() => rnd() - 0.5);
  for (let k = 0; k < Math.min(2, order.length); k++) {
    const m = mains[order[k]];
    const at = 1 + Math.floor(rnd() * 2); // from the 2nd or 3rd point
    let a = m.ang[at] + (rnd() < 0.5 ? -1 : 1) * R(0.5, 0.9);
    let x = m.pts[at][0];
    let y = m.pts[at][1];
    const pts: [number, number][] = [[x, y]];
    const segs = 2 + Math.floor(rnd() * 2);
    for (let s = 0; s < segs; s++) {
      a += R(-0.35, 0.35);
      const len = R(7, 12);
      x += Math.cos(a) * len;
      y += Math.sin(a) * len;
      pts.push([x, y]);
    }
    cracks.push({
      d: "M" + pts.map((p) => `${fmt(p[0])} ${fmt(p[1])}`).join(" L"),
      start: 0.32 + k * 0.07,
    });
  }
  return cracks.slice(0, MAX_CRACKS);
};

/* ------------------------------------------------------------------ drop plan */

export const buildDropPlan = (input: PlanInput): DropPlan => {
  const rnd = input.rnd ?? Math.random;
  const R = (a: number, b: number) => a + (b - a) * rnd();
  const sign = () => (rnd() < 0.5 ? -1 : 1);
  const calm = !!input.calm;
  const k = calm ? 0.4 : 1;

  const per =
    PERSONALITIES[
      ((input.personality % PERSONALITIES.length) + PERSONALITIES.length) %
        PERSONALITIES.length
    ];
  const { home, front } = input;
  const size = home.right - home.left;
  const hcx = (home.left + home.right) / 2;
  const hcy = (home.top + home.bottom) / 2;

  /* ---- angles ---- */
  const dir = rnd() < 0.2 ? -per.dir : per.dir;
  const thetaRest = dir * R(5, 28) * k;
  const theta1 = calm
    ? thetaRest
    : thetaRest + dir * R(per.spin[0], per.spin[1]);
  const theta2 = calm ? thetaRest : thetaRest - dir * R(2, 7);
  const theta3 = calm ? thetaRest : thetaRest - (theta2 - thetaRest) * 0.3;
  const phiX = sign() * R(4, 11) * k;
  const phiY = sign() * R(4, 12) * k;
  const ax = calm ? 0 : per.tumbleX * sign();
  const ay = calm ? 0 : per.tumbleY * sign();
  const wobX = -Math.sign(ax || 1) * 5;
  const wobY = -Math.sign(ay || 1) * 4;

  /* ---- keep the whole icon (even while rotated) inside the tower face ---- */
  const half = maxHalfExtent(size, [theta1, theta2, theta3, thetaRest], 6) + 2;
  const bounds = translationBounds(home, front, half);
  const flight = relaxBounds(bounds);

  /* ---- sideways drift after the bounces ---- */
  const sx = dir;
  const d1 = calm ? 0 : sx * R(per.drift[0], per.drift[1]);
  const d2 = calm ? 0 : d1 * R(0.28, 0.4);
  const dTot = Math.abs(d1) + Math.abs(d2);

  /* ---- pick a random landing spot ---- */
  const lowX = bounds.minX + (sx > 0 ? dTot : 0);
  let highX = bounds.maxX - (sx < 0 ? dTot : 0);
  highX = Math.max(lowX, Math.min(highX, MAX_TRAVEL_X));
  const highY = bounds.maxY;
  const minDrop = Math.min(size * 0.55, Math.max(0, highY) * 0.6);
  const lowY = Math.min(highY, Math.max(bounds.minY, minDrop));

  const keep = (input.keepOut ?? []).map((r) => ({
    left: r.left - 4,
    top: r.top - 4,
    right: r.right + 4,
    bottom: r.bottom + 4,
  }));
  const heRest = halfExtent(size, thetaRest) + 4;
  let best = { x: (lowX + highX) / 2, y: (lowY + highY) / 2 };
  let bestScore = Infinity;
  for (let i = 0; i < 40; i++) {
    const cx = lowX <= highX ? R(lowX, highX) : (lowX + highX) / 2;
    const cy = lowY <= highY ? R(lowY, highY) : (lowY + highY) / 2;
    const rect: Rect = {
      left: hcx + cx - heRest,
      right: hcx + cx + heRest,
      top: hcy + cy - heRest,
      bottom: hcy + cy + heRest,
    };
    let score = 0;
    for (const kr of keep) score += overlapArea(rect, kr);
    if (score < bestScore) {
      bestScore = score;
      best = { x: cx, y: cy };
    }
    if (score === 0) break;
  }

  const restX = best.x;
  const restY = Math.max(best.y, 6);
  const p1x = restX - d1 - d2;
  const p2x = restX - d2;

  /* ---- timeline (seconds) ---- */
  const T = calm
    ? 0.46
    : clamp(0.5 + restY / 520 + Math.abs(p1x) / 2600, 0.55, 1.2);
  const e1 = calm
    ? 0
    : Math.max(
        R(per.bounce[0], per.bounce[1]),
        Math.min(0.6, Math.sqrt(8 / restY)),
      );
  const e2 = e1 * 0.5;
  const h1 = e1 * e1 * restY; // peak height of the 1st bounce
  const h2 = e2 * e2 * restY;
  const Ta = calm ? 0 : 0.24; // "loose" wobble before the fall
  const Tb1 = 2 * e1 * T;
  const Tb2 = 2 * e2 * T;
  const Ts = calm ? 0.2 : 0.55; // settle rocking
  const t1 = Ta;
  const t2 = t1 + T; // 1st impact
  const t3 = t2 + Tb1; // 2nd impact
  const t4 = t3 + Tb2; // last impact (rest)
  const t5 = t4 + Ts;

  const rest: Pose = {
    x: restX,
    y: restY,
    rz: thetaRest,
    rx: phiX,
    ry: phiY,
    s: 1,
  };

  const poseAt = (t: number): Pose => {
    let p: Pose;
    if (t < t1) {
      const u = t / Ta;
      p = {
        x: sx * 1.3 * per.shake * Math.sin(u * Math.PI * 6) * (1 - 0.4 * u),
        y: -2.5 * Math.sin(Math.PI * u),
        rz: dir * 3.2 * per.shake * Math.sin(u * Math.PI * 5),
        rx: 0,
        ry: 0,
        s: 1 + 0.045 * Math.sin(Math.PI * u),
      };
    } else if (t < t2) {
      const u = (t - t1) / T;
      p = {
        x: p1x * (0.55 * u + 0.45 * smoothstep(u)),
        y: restY * u * u, // gravity
        rz: theta1 * (0.6 * u + 0.4 * u * u),
        rx: phiX * u + ax * Math.sin(Math.PI * u),
        ry: phiY * u + ay * Math.sin(2 * Math.PI * u) * (1 - u),
        s: 1 + 0.05 * Math.sin(Math.PI * u),
      };
    } else if (t < t3) {
      const v = (t - t2) / Tb1;
      const hg = 4 * h1 * v * (1 - v);
      p = {
        x: p1x + d1 * v,
        y: restY - hg,
        rz: lerp(theta1, theta2, easeInOutSine(v)),
        rx: phiX + wobX * Math.sin(Math.PI * v),
        ry: phiY + wobY * Math.sin(Math.PI * v),
        s: 1 + 0.0016 * hg,
      };
    } else if (t < t4) {
      const v = (t - t3) / Tb2;
      const hg = 4 * h2 * v * (1 - v);
      p = {
        x: p2x + d2 * v,
        y: restY - hg,
        rz: lerp(theta2, theta3, easeInOutSine(v)),
        rx: phiX + wobX * 0.5 * Math.sin(Math.PI * v),
        ry: phiY + wobY * 0.5 * Math.sin(Math.PI * v),
        s: 1 + 0.0016 * hg,
      };
    } else if (t < t5) {
      const ss = t - t4;
      const su = ss / Ts;
      const w = 1 - smoothstep((su - 0.55) / 0.45);
      const decay = Math.exp(-6 * ss) * w;
      p = {
        x: restX,
        y: restY,
        rz: thetaRest + (theta3 - thetaRest) * Math.cos(11 * ss) * decay,
        rx: phiX + wobX * 0.4 * Math.sin(12 * ss) * decay,
        ry: phiY + wobY * 0.4 * Math.sin(12 * ss) * decay,
        s: 1,
      };
    } else {
      p = rest;
    }
    // never leave the tower face (home is always allowed)
    return {
      ...p,
      x: clamp(p.x, flight.minX, flight.maxX),
      y: clamp(p.y, flight.minY, flight.maxY),
    };
  };

  const ramp = (t: number, at: number, len: number) =>
    easeOutCubic((t - at) / len);

  const crackAt = (t: number) =>
    clamp(
      0.62 * (t >= t2 ? ramp(t, t2, calm ? 0.3 : 0.14) : 0) +
        0.28 * (t >= t3 ? ramp(t, t3, 0.14) : 0) +
        0.1 * (t >= t4 ? ramp(t, t4, 0.3) : 0) +
        (calm && t >= t2 ? 0.38 * ramp(t, t2, 0.3) : 0),
      0,
      1,
    );

  const pulse = (t: number, at: number, amp: number) =>
    t >= at ? amp * Math.exp(-(t - at) / 0.06) : 0;
  const flashAt = (t: number) =>
    clamp(pulse(t, t2, 0.4) + pulse(t, t3, 0.22) + pulse(t, t4, 0.1), 0, 1);

  return {
    duration: t5,
    rest,
    poseAt,
    crackAt,
    flashAt,
    cracks: buildCracks(rnd),
  };
};

/* ------------------------------------------------------------ hit-testing */

export const pointInPolygon = (
  x: number,
  y: number,
  poly: [number, number][],
): boolean => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
};

/**
 * Silhouette of the toppled tower: front face + top face + end face.
 * `card` = whole article box, `front` = front face box (the article has padding-top = dy
 * and padding-right = dx for the oblique depth).
 */
export const towerSilhouette = (
  card: Rect,
  front: Rect,
): [number, number][] => {
  const dy = front.top - card.top;
  const dx = card.right - front.right;
  return [
    [front.left, front.top],
    [front.left + dx, card.top],
    [card.right, card.top],
    [card.right, front.bottom - dy],
    [front.right, front.bottom],
    [front.left, front.bottom],
  ];
};
