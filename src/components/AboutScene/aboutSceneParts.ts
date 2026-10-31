import * as THREE from "three";

/* ────────────────────────────────────────────────────────────────────────────
 * aboutSceneParts.ts — every object of the About street scene.
 * Same world rules as HeroScene/sceneParts.ts: units are "metres",
 * x = right, y = up, z = toward the viewer. The road runs along +x, the far
 * sidewalk (billboards, tower, lamp) is at -z, the near sidewalk (cat) at +z.
 *
 * Everything you may want to move / rename is in the TUNING block below.
 * This file is self-contained: it does NOT import anything from HeroScene.
 * ──────────────────────────────────────────────────────────────────────────── */

export type Rand = () => number;
export type BlockFn = (x: number, z: number, pad: number) => boolean;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ═══════════════════════════ TUNING (change freely) ═══════════════════════ */

export const ROAD_W = 8.5; // asphalt width
export const SIDEWALK_W = 34; // paved band around the road
const ANISO_DEFAULT = 8; // texture sharpness at grazing angles (costs GPU time)

/** Road centre line as [x, z] points. It sweeps left → right and bends away. */
const ROAD_POINTS: ReadonlyArray<readonly [number, number]> = [
  [-70, 3.2],
  [-40, 1.8],
  [-15, 0.6],
  [0, 0],
  [25, -1.6],
  [50, -5],
  [80, -12],
  [115, -24],
  [160, -42],
];

export interface BoardSpec {
  x: number;
  z: number;
  yaw: number; // turn toward the camera (radians)
  w: number; // board width (m)
  h: number; // board height (m)
  postH: number; // free space under the board (m)
}

/** Left billboard: 612 contributions + GitHub image (from your sketch). */
export const BOARD_A: BoardSpec = {
  x: -5.5,
  z: -9.5,
  yaw: -0.18,
  w: 6.8,
  h: 3.7,
  postH: 2.2,
};

/** Middle billboard: the "I maintain this platform…" statements. */
export const BOARD_B: BoardSpec = {
  x: 13,
  z: -13.5,
  yaw: -0.22,
  w: 8,
  h: 4.2,
  postH: 2.6,
};

/** The tall concrete block on the right (windows light up). */
export const TOWER = { x: 37, z: -21, w: 9, d: 9, h: 20, yaw: 0.04 };

/** The tall gooseneck street lamp at the right edge. */
export const LAMP = { x: 44, z: -9.5, h: 9.6, reach: 3.2 };

/** The cat on the near sidewalk (bottom-right of the wide view). */
export const CAT = { x: -9.2, z: 8.2, yaw: -0.45 };

/** World x where the zebra crossing sits. */
export const CROSSING_X = -3;

/** Texts drawn on the left billboard. Change the number here. */
export const CONTRIBUTIONS = {
  count: 612,
  title: "contributions",
  caption: "in the last year",
  source: "GitHub repository activity",
  range: "last 12 months",
};

/**
 * Texts drawn on the middle billboard. Every row is [dim part, bright part].
 * Edit these two rows freely (keep them short so they stay big).
 */
export const BOARD_B_COPY: {
  lead: string;
  tag: string;
  rows: ReadonlyArray<readonly [string, string]>;
} = {
  lead: "In short",
  tag: "ongoing",
  rows: [
    ["Maintaining this ", "Platform"],
    ["for ", "Flawless Execution..."],
  ],
};

/** The paragraph on the 3D comment sign above the cat (moved here from About.tsx). */
export const ABOUT_TEXT =
  "I maintain this platform as an open repository to document my background, practical work, and technical development. Instead of leaving projects confined to private directories, this space serves as an accessible record of my hands-on exploration and steady learning curve. I place high value on structural clarity and consistent routines. Much of my time involves refining interface behavior, addressing edge cases deliberately, and building applications with longevity and clean organization in mind.";

/**
 * 3D COMMENT SIGN — size / position tuning (metres, same world as the scene).
 *  wide = desktop + landscape    tall = phone tour (portrait)
 *  tailAt   where the tail sits along the bottom edge (0 = left, 1 = right)
 *  padX/padY  text padding inside the sign (metres)
 *  maxFont/minFont  text size range in texture pixels (it auto-shrinks to FIT)
 */
export type SignLayoutName = "wide" | "tall";
export interface SignLayout {
  bodyW: number;
  bodyH: number;
  tailH: number;
  tailW: number;
  tailAt: number;
  radius: number;
  padX: number;
  padY: number;
  maxFont: number;
  minFont: number;
}
export const SIGN_LAYOUTS: Record<SignLayoutName, SignLayout> = {
  wide: {
    bodyW: 4.0,
    bodyH: 1.6,
    tailH: 0.55,
    tailW: 0.34,
    tailAt: 0.62,
    radius: 0.17,
    padX: 0.19,
    padY: 0.14,
    maxFont: 56,
    minFont: 34,
  },
  tall: {
    bodyW: 2.6,
    bodyH: 1.56,
    tailH: 0.42,
    tailW: 0.28,
    tailAt: 0.5,
    radius: 0.14,
    padX: 0.12,
    padY: 0.1,
    maxFont: 50,
    minFont: 28,
  },
};
/** The tip of the sign's tail: just above the cat's head. */
export const SIGN_TIP = { x: CAT.x, y: 1.4, z: CAT.z };

const SANS = `"Helvetica Neue", Helvetica, Arial, sans-serif`;
const HEAVY = `"Arial Black", "Helvetica Neue", Arial, sans-serif`;
const MONO = `ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
const BOARD_BG = "#0e0e10";

/* ═══════════════════════════════ HELPERS ══════════════════════════════════ */

export const mulberry32 = (seed: number): Rand => {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const makeCanvas = (w: number, h: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  // PERF: these canvases get thousands of tiny 1-2px rects (noise) and are read back
  // (getImageData). A CPU-backed canvas is much faster for that than a GPU one.
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas is not available");
  return { canvas, ctx };
};

const toTexture = (
  canvas: HTMLCanvasElement,
  repeat: boolean,
  anisotropy: number = ANISO_DEFAULT,
) => {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }
  return tex;
};

const inset = (r: Rect, n: number): Rect => ({
  x: r.x + n,
  y: r.y + n,
  w: r.w - n * 2,
  h: r.h - n * 2,
});

/* ═══════════════════════ THEME HELPERS (light mode) ═══════════════════════ */

/** One half of the theme switch of a part: build light assets lazily, then swap. */
export interface ThemeSwap {
  /** builds (once) the light textures; returns the new ones so they can be pre-uploaded */
  prepare: () => THREE.Texture[];
  set: (light: boolean) => void;
}

function makeLut(points: ReadonlyArray<readonly [number, number]>) {
  const lut = new Uint8ClampedArray(256);
  let k = 0;
  for (let v = 0; v < 256; v++) {
    while (k < points.length - 2 && v > points[k + 1][0]) k++;
    const [x0, y0] = points[k];
    const [x1, y1] = points[k + 1];
    const f = x1 === x0 ? 0 : Math.min(1, Math.max(0, (v - x0) / (x1 - x0)));
    lut[v] = y0 + (y1 - y0) * f;
  }
  return lut;
}

/** dark texel value → light texel value. Same pattern, light palette. */
const LUT_GROUND = makeLut([
  [0, 120],
  [10, 140],
  [27, 176],
  [38, 206],
  [60, 222],
  [96, 236],
  [255, 255],
]);
const LUT_FACADE = makeLut([
  [0, 150],
  [8, 165],
  [24, 195],
  [42, 236],
  [80, 246],
  [214, 255],
  [255, 255],
]);

/** A light copy of a dark canvas texture (same layout, noise, windows, joints...). */
function lightCopy(src: THREE.Texture, lut: Uint8ClampedArray) {
  try {
    const img = src.image as HTMLCanvasElement;
    const { canvas, ctx } = makeCanvas(img.width, img.height);
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      px[i] = lut[px[i]];
      px[i + 1] = lut[px[i + 1]];
      px[i + 2] = lut[px[i + 2]];
    }
    ctx.putImageData(data, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = src.colorSpace;
    tex.anisotropy = src.anisotropy;
    tex.wrapS = src.wrapS;
    tex.wrapT = src.wrapT;
    return tex;
  } catch {
    return null;
  }
}

/** swaps material.map (+ tint) between the dark texture and a lazily built light one */
function textureSwap(
  mat: THREE.MeshStandardMaterial,
  lut: Uint8ClampedArray,
  lightColor: number,
) {
  const darkMap = mat.map as THREE.Texture;
  const darkColor = mat.color.getHex();
  let lightMap: THREE.Texture | null | undefined;
  const prepare = (): THREE.Texture[] => {
    if (lightMap !== undefined) return [];
    lightMap = lightCopy(darkMap, lut);
    return lightMap ? [lightMap] : [];
  };
  const set = (light: boolean) => {
    if (light) {
      prepare();
      mat.map = lightMap ?? darkMap;
      mat.color.setHex(lightColor);
    } else {
      mat.map = darkMap;
      mat.color.setHex(darkColor);
    }
  };
  return { prepare, set };
}

export function createRoadCurve() {
  const curve = new THREE.CatmullRomCurve3(
    ROAD_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    "centripetal",
  );
  curve.arcLengthDivisions = 800;
  return curve;
}

/** Distance along the curve where the road passes world x. */
function distanceAtX(curve: THREE.CatmullRomCurve3, x: number) {
  const L = curve.getLength();
  let best = 0;
  let bestErr = Infinity;
  for (let d = 0; d <= L; d += 0.5) {
    const err = Math.abs(curve.getPointAt(d / L).x - x);
    if (err < bestErr) {
      bestErr = err;
      best = d;
    }
  }
  return best;
}

/** True where something important stands (billboards, tower, lamp). */
export const isBlocked: BlockFn = (x, z, pad) => {
  for (const b of [BOARD_A, BOARD_B]) {
    const dx = x - b.x;
    const dz = z - b.z;
    const r = b.w / 2 + 5 + pad;
    if (dx * dx + dz * dz < r * r) return true;
  }
  if (
    Math.abs(x - TOWER.x) < TOWER.w / 2 + 6 + pad &&
    Math.abs(z - TOWER.z) < TOWER.d / 2 + 6 + pad
  ) {
    return true;
  }
  const lx = x - LAMP.x;
  const lz = z - LAMP.z;
  return lx * lx + lz * lz < (4 + pad) * (4 + pad);
};

/* ═══════════════════════════ TEXTURES ═════════════════════════════════════ */

function makeAsphaltTexture(rand: Rand) {
  const S = 512;
  const { canvas, ctx } = makeCanvas(S, S);
  ctx.fillStyle = "#1b1b1e";
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 26000; i++) {
    const v = 26 + Math.floor(rand() * 70);
    ctx.fillStyle = `rgba(${v},${v},${v + 3},${0.18 + rand() * 0.4})`;
    const size = rand() < 0.08 ? 2 : 1;
    ctx.fillRect(Math.floor(rand() * S), Math.floor(rand() * S), size, size);
  }
  for (let i = 0; i < 10; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const r = 40 + rand() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(0,0,0,${0.18 + rand() * 0.2})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return toTexture(canvas, true);
}

function makePavingTexture(rand: Rand) {
  const S = 512;
  const { canvas, ctx } = makeCanvas(S, S);
  ctx.fillStyle = "#26262a";
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 12000; i++) {
    const v = 30 + Math.floor(rand() * 40);
    ctx.fillStyle = `rgba(${v},${v},${v + 2},0.35)`;
    ctx.fillRect(rand() * S, rand() * S, 1.5, 1.5);
  }
  const cell = S / 4;
  for (let i = 0; i <= 4; i++) {
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(i * cell - 2, 0, 4, S);
    ctx.fillRect(0, i * cell - 2, S, 4);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(i * cell + 2, 0, 1, S);
    ctx.fillRect(0, i * cell + 2, S, 1);
  }
  return toTexture(canvas, true);
}

function makeGlowTexture() {
  const S = 128;
  const { canvas, ctx } = makeCanvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.55)");
  g.addColorStop(0.5, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return toTexture(canvas, false, 1);
}

/** Soft dark spot used as a contact shadow under the cat. */
function makeBlobTexture() {
  const S = 128;
  const { canvas, ctx } = makeCanvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(0,0,0,0.85)");
  g.addColorStop(0.55, "rgba(0,0,0,0.35)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return toTexture(canvas, false, 1);
}

/** Worn road paint for the zebra crossing. */
function makePaintTexture(rand: Rand) {
  const S = 256;
  const { canvas, ctx } = makeCanvas(S, S);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, S, S);
  ctx.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.2 + rand() * 0.6})`;
    ctx.fillRect(rand() * S, rand() * S, 1 + rand() * 5, 1 + rand() * 4);
  }
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.1 + rand() * 0.2})`;
    ctx.fillRect(0, rand() * S, S, 1 + rand() * 3);
  }
  ctx.globalCompositeOperation = "source-over";
  return toTexture(canvas, false);
}

/* ═══════════════════════ GROUND, ROAD, MARKINGS ═══════════════════════════ */

interface RibbonSpec {
  offset: number; // sideways shift from the centre line (+ = far side)
  width: number;
  y: number;
  from: number;
  to: number;
  uTile: number;
  vTile: number;
  step?: number;
  dash?: number;
  gap?: number;
}

/** A flat strip that follows the road curve (optionally cut into dashes). */
function buildRibbon(curve: THREE.CatmullRomCurve3, s: RibbonSpec) {
  const L = curve.getLength();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let count = 0;

  const addStrip = (d0: number, d1: number, n: number) => {
    const base = positions.length / 3;
    for (let i = 0; i <= n; i++) {
      const d = d0 + ((d1 - d0) * i) / n;
      const u = Math.min(Math.max(d / L, 0), 1);
      const p = curve.getPointAt(u);
      const t = curve.getTangentAt(u);
      const nx = t.z;
      const nz = -t.x;
      const cx = p.x + nx * s.offset;
      const cz = p.z + nz * s.offset;
      const hw = s.width / 2;
      positions.push(
        cx + nx * hw,
        s.y,
        cz + nz * hw,
        cx - nx * hw,
        s.y,
        cz - nz * hw,
      );
      normals.push(0, 1, 0, 0, 1, 0);
      uvs.push(0, d / s.vTile, s.width / s.uTile, d / s.vTile);
      if (i > 0) {
        const a = base + (i - 1) * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
  };

  if (s.dash && s.gap) {
    for (let d = s.from; d + s.dash <= s.to; d += s.dash + s.gap) {
      addStrip(d, d + s.dash, 1);
      count++;
    }
  } else {
    addStrip(
      s.from,
      s.to,
      Math.max(2, Math.ceil((s.to - s.from) / (s.step ?? 1.5))),
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return { geo, count };
}

export function buildGroundAndRoad(curve: THREE.CatmullRomCurve3, rand: Rand) {
  const group = new THREE.Group();
  const L = curve.getLength();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(800, 800),
    new THREE.MeshStandardMaterial({
      color: 0x0d0d0f,
      roughness: 0.96,
      metalness: 0,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.renderOrder = 10; // PERF: drawn last, hidden pixels are skipped
  group.add(ground);

  const sidewalk = new THREE.Mesh(
    buildRibbon(curve, {
      offset: 0,
      width: SIDEWALK_W,
      y: 0.02,
      from: 0,
      to: L,
      uTile: 8,
      vTile: 8,
    }).geo,
    new THREE.MeshStandardMaterial({
      map: makePavingTexture(rand),
      color: 0xb4b4ba,
      roughness: 0.8,
      metalness: 0.02,
    }),
  );
  sidewalk.receiveShadow = true;
  sidewalk.renderOrder = 5;
  group.add(sidewalk);

  const road = new THREE.Mesh(
    buildRibbon(curve, {
      offset: 0,
      width: ROAD_W,
      y: 0.04,
      from: 0,
      to: L,
      uTile: 6,
      vTile: 6,
    }).geo,
    new THREE.MeshStandardMaterial({
      map: makeAsphaltTexture(rand),
      color: 0xa6a6ac,
      roughness: 0.44,
      metalness: 0.15,
    }),
  );
  road.receiveShadow = true;
  group.add(road);

  const groundMat = ground.material as THREE.MeshStandardMaterial;
  const sidewalkMat = sidewalk.material as THREE.MeshStandardMaterial;
  const roadMat = road.material as THREE.MeshStandardMaterial;
  const themedFlats: Array<{
    mat: THREE.MeshBasicMaterial;
    dark: number;
    light: number;
  }> = [];

  const flat = (color: number, opacity: number, lightColor: number = color) => {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    themedFlats.push({ mat, dark: color, light: lightColor });
    return mat;
  };

  // curbs + solid edge lines
  for (const side of [1, -1]) {
    group.add(
      new THREE.Mesh(
        buildRibbon(curve, {
          offset: side * (ROAD_W / 2 + 0.12),
          width: 0.26,
          y: 0.07,
          from: 0,
          to: L,
          uTile: 1,
          vTile: 1,
        }).geo,
        flat(0x303034, 1, 0x8e8e94),
      ),
    );
    group.add(
      new THREE.Mesh(
        buildRibbon(curve, {
          offset: side * (ROAD_W / 2 - 0.45),
          width: 0.14,
          y: 0.06,
          from: 0,
          to: L,
          uTile: 1,
          vTile: 1,
        }).geo,
        flat(0x9b9ba2, 0.7, 0xf2f2f4),
      ),
    );
  }

  // centre dashes (revealed near → far by drawRange)
  const dashed = buildRibbon(curve, {
    offset: 0,
    width: 0.16,
    y: 0.06,
    from: 2,
    to: L - 2,
    uTile: 1,
    vTile: 1,
    dash: 2.6,
    gap: 4.2,
  });
  const dashes = new THREE.Mesh(dashed.geo, flat(0xd4d4d8, 0.9, 0xf7f7f9));
  group.add(dashes);

  const swaps = [
    textureSwap(sidewalkMat, LUT_GROUND, 0xffffff),
    textureSwap(roadMat, LUT_GROUND, 0xffffff),
  ];
  const theme: ThemeSwap = {
    prepare: () => swaps.flatMap((sw) => sw.prepare()),
    set: (light) => {
      groundMat.color.setHex(light ? 0xcdcdd1 : 0x0d0d0f);
      swaps.forEach((sw) => sw.set(light));
      for (const f of themedFlats) f.mat.color.setHex(light ? f.light : f.dark);
    },
  };

  return { group, dashes, dashCount: dashed.count, theme };
}

/** Zebra crossing + two stop lines. Bars are drawn one by one (drawRange). */
export function buildCrossing(curve: THREE.CatmullRomCurve3, rand: Rand) {
  const L = curve.getLength();
  const u = distanceAtX(curve, CROSSING_X) / L;
  const p = curve.getPointAt(u);
  const t = curve.getTangentAt(u);
  const nx = t.z;
  const nz = -t.x;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let bars = 0;

  const addBar = (along: number, across: number, len: number, wid: number) => {
    const cx = p.x + t.x * along + nx * across;
    const cz = p.z + t.z * along + nz * across;
    const hl = len / 2;
    const hw = wid / 2;
    const base = positions.length / 3;
    for (const [a, c] of [
      [-hl, -hw],
      [hl, -hw],
      [hl, hw],
      [-hl, hw],
    ]) {
      positions.push(cx + t.x * a + nx * c, 0.065, cz + t.z * a + nz * c);
    }
    uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    bars++;
  };

  // zebra: bars run along the road, side by side across it (near → far)
  for (let k = -4; k <= 4; k++) addBar(0, k * 0.95, 3.6, 0.5);
  // stop lines, one per lane
  addBar(-3.3, -2.1, 0.4, 3.4);
  addBar(3.3, 2.1, 0.4, 3.4);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.setDrawRange(0, 0);

  const material = new THREE.MeshBasicMaterial({
    map: makePaintTexture(rand),
    color: 0xd6d6db,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const mesh = new THREE.Mesh(geo, material);
  const theme: ThemeSwap = {
    prepare: () => [],
    set: (light) => material.color.setHex(light ? 0xf5f5f7 : 0xd6d6db),
  };
  return { mesh, barCount: bars, theme };
}

/* ═══════════════════════════ BILLBOARDS ═══════════════════════════════════ */

/** Dark panel base + scan lines + double frame (shared by both boards). */
function paintBoardBase(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = BOARD_BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.025)";
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 1);
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 4;
  ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);
}

const rule = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  a = 0.3,
) => {
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.fillRect(x0, y, x1 - x0, 2);
};

/* ── Board A: 612 contributions + GitHub image ─────────────────────────── */

function layoutA(W: number, H: number) {
  const pad = 72;
  const numeral: Rect = { x: pad, y: 134, w: 640, h: 272 };
  const imageTop = 462;
  const image: Rect = {
    x: pad,
    y: imageTop,
    w: W - pad * 2,
    h: H - imageTop - 60,
  };
  return {
    pad,
    numeral,
    image,
    titleX: pad + numeral.w + 40,
    titleY: 292,
    rule1: 118,
    rule2: 436,
  };
}

/** Image → dark monochrome (auto-inverts light screenshots so they fit the board). */
function toDarkMono(img: HTMLImageElement): HTMLCanvasElement | null {
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return null;
    const { canvas, ctx } = makeCanvas(w, h);
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    let sum = 0;
    let n = 0;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] > 128) {
        sum += px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
        n++;
      }
    }
    const invert = n > 0 && sum / n > 150;
    for (let i = 0; i < px.length; i += 4) {
      let v = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
      if (invert) v = 255 - v;
      v = Math.min(255, Math.max(0, (v - 128) * 1.18 + 128 - 14));
      px[i] = v;
      px[i + 1] = v;
      px[i + 2] = v;
    }
    ctx.putImageData(data, 0, 0);
    return canvas;
  } catch {
    return null;
  }
}

function drawImageFrame(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  gray: HTMLCanvasElement | null,
) {
  ctx.fillStyle = "#08080a";
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x, r.y, r.w, r.h);

  const inner = inset(r, 22);
  if (gray) {
    const s = Math.min(inner.w / gray.width, inner.h / gray.height);
    const dw = gray.width * s;
    const dh = gray.height * s;
    ctx.globalAlpha = 0.96;
    ctx.drawImage(
      gray,
      inner.x + (inner.w - dw) / 2,
      inner.y + (inner.h - dh) / 2,
      dw,
      dh,
    );
    ctx.globalAlpha = 1;
  } else {
    // placeholder grid while the image loads (or if it is missing)
    const cols = 53;
    const rows = 7;
    const cell = Math.min(inner.w / cols, inner.h / rows);
    const ox = inner.x + (inner.w - cell * cols) / 2;
    const oy = inner.y + (inner.h - cell * rows) / 2;
    for (let c = 0; c < cols; c++) {
      for (let rr = 0; rr < rows; rr++) {
        const k =
          Math.abs(Math.sin(c * 12.9898 + rr * 78.233) * 43758.5453) % 1;
        ctx.fillStyle = `rgba(255,255,255,${0.05 + k * 0.2})`;
        ctx.fillRect(ox + c * cell + 2, oy + rr * cell + 2, cell - 4, cell - 4);
      }
    }
  }

  // hard corner ticks (brutalist registration marks)
  ctx.strokeStyle = "rgba(255,255,255,0.78)";
  ctx.lineWidth = 4;
  const tick = 30;
  const { x, y, w, h } = r;
  ctx.beginPath();
  ctx.moveTo(x, y + tick);
  ctx.lineTo(x, y);
  ctx.lineTo(x + tick, y);
  ctx.moveTo(x + w - tick, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + tick);
  ctx.moveTo(x + w, y + h - tick);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w - tick, y + h);
  ctx.moveTo(x + tick, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + h - tick);
  ctx.stroke();
}

function drawBoardA(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  gray: HTMLCanvasElement | null,
) {
  paintBoardBase(ctx, W, H);
  const L = layoutA(W, H);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `500 28px ${MONO}`;
  ctx.fillText(CONTRIBUTIONS.source, L.pad, 92);
  ctx.textAlign = "right";
  ctx.fillText(CONTRIBUTIONS.range, W - L.pad, 92);
  ctx.textAlign = "left";
  rule(ctx, L.pad, W - L.pad, L.rule1);

  // the big number lives on its own plane (it counts up), so only the words are here
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = `800 96px ${SANS}`;
  ctx.fillText(CONTRIBUTIONS.title, L.titleX, L.titleY);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `500 40px ${MONO}`;
  ctx.fillText(CONTRIBUTIONS.caption, L.titleX, L.titleY + 64);

  rule(ctx, L.pad, W - L.pad, L.rule2);
  drawImageFrame(ctx, L.image, gray);
}

function drawCounter(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  n: number,
) {
  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.98)";
  ctx.font = `900 270px ${HEAVY}`;
  ctx.fillText(String(n), 0, H - 30);
}

/* ── Board B: statements ───────────────────────────────────────────────── */

function drawBoardB(ctx: CanvasRenderingContext2D, W: number, H: number) {
  paintBoardBase(ctx, W, H);
  const padX = 84;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.font = `76px "Kaushan Script", "Caveat", cursive`;
  ctx.fillText(BOARD_B_COPY.lead, padX, 132);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `500 28px ${MONO}`;
  ctx.fillText(BOARD_B_COPY.tag, W - padX, 116);
  ctx.textAlign = "left";

  const top = 172;
  const rows = BOARD_B_COPY.rows;
  const rowH = (H - top - 64) / rows.length;
  const maxW = W - padX * 2 - 120;

  // one common size for all rows (the longest line decides)
  let size = 128;
  const setFont = () => (ctx.font = `800 ${size}px ${SANS}`);
  setFont();
  const widthOf = (r: readonly [string, string]) =>
    ctx.measureText(r[0] + r[1]).width;
  while (size > 44 && rows.some((r) => widthOf(r) > maxW)) {
    size -= 4;
    setFont();
  }

  rows.forEach(([dim, bright], i) => {
    const y0 = top + rowH * i;
    rule(ctx, padX, W - padX, y0, 0.3);
    const base = y0 + rowH / 2 + size * 0.34;
    setFont();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(dim, padX, base);
    const dx = ctx.measureText(dim).width;
    ctx.fillStyle = "rgba(255,255,255,0.97)";
    ctx.fillText(bright, padX + dx, base);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `500 56px ${MONO}`;
    ctx.textAlign = "right";
    ctx.fillText("↗", W - padX, y0 + rowH / 2 + 20);
    ctx.textAlign = "left";
  });
  rule(ctx, padX, W - padX, top + rowH * rows.length, 0.3);
}

/** Shared billboard structure: footing, posts, board rig, lamp arm, spotlight. */
function buildBoard(
  spec: BoardSpec,
  draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => void,
) {
  const { w, h, postH } = spec;
  const group = new THREE.Group();
  group.position.set(spec.x, 0, spec.z);
  group.rotation.y = spec.yaw;

  const W = 1792;
  const H = Math.round(W * (h / w));
  const { canvas, ctx } = makeCanvas(W, H);
  draw(ctx, W, H);
  const tex = toTexture(canvas, false);
  const redraw = () => {
    draw(ctx, W, H);
    tex.needsUpdate = true;
  };

  // every lit surface of the board shares one glow value
  const lit: THREE.MeshStandardMaterial[] = [];
  const addLit = (map: THREE.Texture, transparent = false) => {
    const m = new THREE.MeshStandardMaterial({
      map,
      emissiveMap: map,
      emissive: 0xffffff,
      emissiveIntensity: 0,
      color: 0x888888,
      roughness: 0.6,
      transparent,
      depthWrite: !transparent,
    });
    lit.push(m);
    return m;
  };
  const setGlow = (v: number) => {
    for (const m of lit) m.emissiveIntensity = v;
  };

  const metal = new THREE.MeshStandardMaterial({
    color: 0x1a1a1d,
    metalness: 0.75,
    roughness: 0.45,
  });
  const concrete = new THREE.MeshStandardMaterial({
    color: 0x2b2b2f,
    roughness: 0.92,
    metalness: 0.02,
  });
  const frameD = 0.34;

  // the board unfolds upward from its bottom edge during the reveal
  const rig = new THREE.Group();
  rig.position.y = postH;
  rig.scale.y = 0.001;
  group.add(rig);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.36, h + 0.36, frameD),
    metal,
  );
  frame.position.set(0, h / 2, 0);
  frame.castShadow = true;
  rig.add(frame);

  const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), addLit(tex));
  panel.position.set(0, h / 2, frameD / 2 + 0.005);
  rig.add(panel);

  // lamp arm + three heads over the board
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xf4f4f7 });
  const armY = h + 0.5;
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.72, 0.05, 0.05),
    metal,
  );
  arm.position.set(0, armY, 0.55);
  rig.add(arm);
  for (const lx of [-0.27, 0, 0.27]) {
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.07, 0.2),
      lampMat,
    );
    head.position.set(lx * w, armY - 0.06, 0.55);
    rig.add(head);
    const strut = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.34, 0.04),
      metal,
    );
    strut.position.set(lx * w, armY - 0.2, 0.2);
    strut.rotation.x = -0.9;
    rig.add(strut);
  }

  const postLen = postH + h * 0.4;
  const postGeo = new THREE.BoxGeometry(0.22, postLen, 0.22);
  postGeo.translate(0, postLen / 2, 0);
  const posts = [-1, 1].map((sx) => {
    const post = new THREE.Mesh(postGeo, metal);
    post.position.set(sx * w * 0.28, 0, -0.06);
    post.scale.y = 0.001;
    post.castShadow = true;
    group.add(post);
    return post;
  });

  const footing = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.74, 0.34, 1.1),
    concrete,
  );
  footing.position.set(0, 0.17, -0.06);
  footing.scale.x = 0.001;
  footing.castShadow = true;
  footing.receiveShadow = true;
  group.add(footing);

  const spot = new THREE.SpotLight(0xe8ebf0, 0, 20, 0.8, 0.7, 2);
  spot.position.set(0, postH + h + 0.5, 0.6);
  const target = new THREE.Object3D();
  target.position.set(0, postH + h * 0.25, 0.3);
  group.add(target);
  spot.target = target;
  group.add(spot);

  /** canvas-pixel rectangle → local position / size on the board (metres) */
  const toLocal = (r: Rect) => ({
    x: ((r.x + r.w / 2) / W - 0.5) * w,
    y: h / 2 + (0.5 - (r.y + r.h / 2) / H) * h,
    w: (r.w / W) * w,
    h: (r.h / H) * h,
  });

  return {
    group,
    rig,
    posts,
    footing,
    spot,
    lampMat,
    W,
    H,
    frameD,
    addLit,
    setGlow,
    redraw,
    toLocal,
    theme: {
      prepare: () => [],
      set: (light: boolean) =>
        concrete.color.setHex(light ? 0xb4b4b9 : 0x2b2b2f),
    } as ThemeSwap,
  };
}

export function buildBoardA(src: string, onChange: () => void) {
  let gray: HTMLCanvasElement | null = null;
  const board = buildBoard(BOARD_A, (ctx, W, H) => drawBoardA(ctx, W, H, gray));
  const L = layoutA(board.W, board.H);

  // the big number: its own small plane so it can count up cheaply
  const counter = makeCanvas(L.numeral.w, L.numeral.h);
  const counterTex = toTexture(counter.canvas, false);
  const nl = board.toLocal(L.numeral);
  const counterMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(nl.w, nl.h),
    board.addLit(counterTex, true),
  );
  counterMesh.position.set(nl.x, nl.y, board.frameD / 2 + 0.014);
  board.rig.add(counterMesh);
  let shown = -1;
  const setCount = (n: number) => {
    if (n === shown) return;
    shown = n;
    drawCounter(counter.ctx, L.numeral.w, L.numeral.h, n);
    counterTex.needsUpdate = true;
  };
  setCount(0);

  // a dark curtain over the image that wipes away left → right
  const bg = makeCanvas(4, 4);
  bg.ctx.fillStyle = BOARD_BG;
  bg.ctx.fillRect(0, 0, 4, 4);
  const il = board.toLocal(inset(L.image, 6));
  const curtainGeo = new THREE.PlaneGeometry(il.w, il.h);
  curtainGeo.translate(-il.w / 2, 0, 0); // pivot = right edge
  const curtain = new THREE.Mesh(
    curtainGeo,
    board.addLit(toTexture(bg.canvas, false, 1)),
  );
  curtain.position.set(il.x + il.w / 2, il.y, board.frameD / 2 + 0.01);
  board.rig.add(curtain);

  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    gray = toDarkMono(img);
    board.redraw();
    onChange();
  };
  img.src = src;

  return { ...board, setCount, curtain };
}

export function buildBoardB() {
  return buildBoard(BOARD_B, drawBoardB);
}

/* ═══════════════════════════ BUILDINGS ════════════════════════════════════ */

const COLS = 4;
const ROWS = 6;
const CELL_W = 1.3;
const CELL_H = 1.8;
const PX_W = 72;
const PX_H = 96;
const FACADE_BASE = ["#2a2a2e", "#222226", "#303035"] as const;

interface FacadeSet {
  material: THREE.MeshStandardMaterial;
  tileW: number;
  tileH: number;
}

function makeFacade(rand: Rand, variant: 0 | 1 | 2): FacadeSet {
  const W = COLS * PX_W;
  const H = ROWS * PX_H;
  const a = makeCanvas(W, H);
  const b = makeCanvas(W, H);
  const map = a.ctx;
  const glow = b.ctx;

  map.fillStyle = FACADE_BASE[variant];
  map.fillRect(0, 0, W, H);
  glow.fillStyle = "#000000";
  glow.fillRect(0, 0, W, H);
  for (let i = 0; i < 5000; i++) {
    const v = 20 + Math.floor(rand() * 50);
    map.fillStyle = `rgba(${v},${v},${v + 2},0.35)`;
    map.fillRect(rand() * W, rand() * H, 1.5, 1.5);
  }

  const litChance = [0.2, 0.14, 0.3][variant];
  const lit = (x: number, y: number, w: number, h: number) => {
    const k = 0.55 + rand() * 0.45;
    map.fillStyle = `rgba(214,214,220,${0.1 + 0.8 * k})`;
    map.fillRect(x, y, w, h);
    glow.fillStyle = `rgba(255,255,255,${k})`;
    glow.fillRect(x, y, w, h);
  };
  const win = (x: number, y: number, w: number, h: number) => {
    map.fillStyle = "#08080a";
    map.fillRect(x, y, w, h);
    map.fillStyle = "rgba(0,0,0,0.55)";
    map.fillRect(x - 3, y - 3, w + 6, 3);
    map.fillStyle = "#505057";
    map.fillRect(x - 2, y + h, w + 4, 3);
    if (rand() < litChance) lit(x, y, w, h);
  };

  for (let r = 0; r < ROWS; r++) {
    const y = r * PX_H;
    if (variant === 1) {
      const sy = y + PX_H * 0.24;
      const sh = PX_H * 0.46;
      map.fillStyle = "#08080a";
      map.fillRect(6, sy, W - 12, sh);
      for (let c = 0; c < COLS; c++) {
        if (rand() < litChance) lit(c * PX_W + 6, sy, PX_W - 8, sh);
      }
      map.fillStyle = FACADE_BASE[1];
      for (let c = 1; c < COLS; c++) map.fillRect(c * PX_W - 2, sy, 4, sh);
    } else {
      for (let c = 0; c < COLS; c++) {
        const x = c * PX_W;
        if (variant === 0) {
          win(x + PX_W * 0.16, y + PX_H * 0.2, PX_W * 0.68, PX_H * 0.5);
        } else {
          win(x + PX_W * 0.2, y + PX_H * 0.12, PX_W * 0.16, PX_H * 0.7);
          win(x + PX_W * 0.62, y + PX_H * 0.12, PX_W * 0.16, PX_H * 0.7);
        }
      }
    }
    map.fillStyle = "#18181b";
    map.fillRect(0, y + PX_H - 7, W, 7);
  }
  if (variant === 2) {
    map.fillStyle = "rgba(255,255,255,0.05)";
    for (let c = 0; c <= COLS; c++) map.fillRect(c * PX_W - 1, 0, 2, H);
  }

  const material = new THREE.MeshStandardMaterial({
    map: toTexture(a.canvas, true),
    emissiveMap: toTexture(b.canvas, true),
    emissive: 0xffffff,
    emissiveIntensity: 0,
    roughness: 0.88,
    metalness: 0.06,
  });
  return { material, tileW: COLS * CELL_W, tileH: ROWS * CELL_H };
}

export function buildCity(
  curve: THREE.CatmullRomCurve3,
  rand: Rand,
  blocked: BlockFn,
) {
  const facades = [
    makeFacade(rand, 0),
    makeFacade(rand, 1),
    makeFacade(rand, 2),
  ];
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.95,
  });
  const concrete = new THREE.MeshStandardMaterial({
    color: 0x2a2a2e,
    roughness: 0.92,
    metalness: 0.03,
  });
  const group = new THREE.Group();
  const beacons: THREE.Mesh[] = [];
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
  });
  const L = curve.getLength();

  const addBox = (
    cx: number,
    cz: number,
    w: number,
    h: number,
    dp: number,
    yaw: number,
    f: FacadeSet,
    shadow: boolean,
  ) => {
    const geo = new THREE.BoxGeometry(w, h, dp);
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    const rep = (len: number, tile: number) =>
      Math.max(1, Math.round(len / tile));
    const scaleFace = (face: number, su: number, sv: number) => {
      for (let i = face * 4; i < face * 4 + 4; i++)
        uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
    };
    const ry = rep(h, f.tileH);
    scaleFace(0, rep(dp, f.tileW), ry); // +x
    scaleFace(1, rep(dp, f.tileW), ry); // -x
    scaleFace(4, rep(w, f.tileW), ry); // +z
    scaleFace(5, rep(w, f.tileW), ry); // -z
    // PERF: a box has 6 material groups = 6 draw calls. Re-order the indices so the
    // 4 facade faces come first and the 2 roof faces last: 2 draw calls, same look.
    const index = geo.index;
    if (index) {
      const idx = Array.from(index.array as ArrayLike<number>);
      geo.setIndex(
        idx.slice(0, 12).concat(idx.slice(24, 36), idx.slice(12, 24)),
      );
      geo.clearGroups();
      geo.addGroup(0, 24, 0);
      geo.addGroup(24, 12, 1);
    }
    const m = f.material;
    // facade material first, roof material second (matches the two groups above)
    const mesh = new THREE.Mesh(geo, [m, roofMat]);
    mesh.position.set(cx, h / 2, cz);
    mesh.rotation.y = yaw;
    mesh.castShadow = shadow;
    group.add(mesh);
    if (h > 36) {
      const beacon = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        beaconMat.clone(),
      );
      beacon.position.set(cx, h + 0.4, cz);
      group.add(beacon);
      beacons.push(beacon);
    }
  };

  // procedural blocks on the FAR side of the road only (the near side stays open)
  let d = 6;
  while (d < L - 6) {
    const u = d / L;
    const p = curve.getPointAt(u);
    const t = curve.getTangentAt(u);
    const nx = t.z;
    const nz = -t.x;
    const far = d > 150;
    const w = 6 + rand() * 9;
    const dep = 7 + rand() * 9;
    const h = (far ? 30 : 14) + rand() * (far ? 34 : 26);
    const variant = Math.floor(rand() * 3);
    const jitter = (rand() - 0.5) * 0.1;
    const off = ROAD_W / 2 + 15 + dep / 2 + rand() * 4;
    const cx = p.x + nx * off;
    const cz = p.z + nz * off;
    if (!blocked(cx, cz, Math.max(w, dep) / 2)) {
      addBox(
        cx,
        cz,
        w,
        h,
        dep,
        Math.atan2(-t.z, t.x) + jitter,
        facades[variant],
        false,
      );
    }
    d += 8 + rand() * 7;
  }

  // brutalist tower: shaft + podium + canopy + overhanging cap + fins
  const T = TOWER;
  addBox(T.x, T.z, T.w, T.h, T.d, T.yaw, facades[2], true);
  const extras = new THREE.Group();
  extras.position.set(T.x, 0, T.z);
  extras.rotation.y = T.yaw;
  const slab = (
    w: number,
    h: number,
    dp: number,
    x: number,
    y: number,
    z: number,
  ) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), concrete);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    extras.add(m);
  };
  slab(T.w + 3.2, 3.4, T.d + 3.2, 0, 1.7, 0); // podium
  slab(T.w * 0.7, 0.3, 3, 0, 4.4, T.d / 2 + 2.6); // canopy
  slab(T.w + 1.8, 2.4, T.d + 1.8, 0, T.h + 1.2, 0); // overhanging cap
  for (const fx of [-0.42, -0.18, 0.18, 0.42]) {
    slab(0.55, T.h - 3.4, 0.7, fx * T.w, 3.4 + (T.h - 3.4) / 2, T.d / 2 + 0.1);
  }
  group.add(extras);

  const beacon = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    beaconMat.clone(),
  );
  beacon.position.set(T.x, T.h + 2.9, T.z);
  group.add(beacon);
  beacons.push(beacon);

  const swaps = facades.map((f) =>
    textureSwap(f.material, LUT_FACADE, 0xffffff),
  );
  const theme: ThemeSwap = {
    prepare: () => swaps.flatMap((sw) => sw.prepare()),
    set: (light) => {
      swaps.forEach((sw) => sw.set(light));
      roofMat.color.setHex(light ? 0xc4c4c8 : 0x18181b);
      concrete.color.setHex(light ? 0xb4b4b9 : 0x2a2a2e);
      for (const b of beacons) {
        (b.material as THREE.MeshBasicMaterial).color.setHex(
          light ? 0x4a4a50 : 0xffffff,
        );
      }
    },
  };
  return {
    group,
    facadeMats: facades.map((f) => f.material),
    beacons,
    theme,
  };
}

/* ═══════════════════════════ STREET LIGHTS ════════════════════════════════ */

/** Small lamps along the far sidewalk (depth cue + glow). */
export function buildStreetLights(
  curve: THREE.CatmullRomCurve3,
  blocked: BlockFn,
) {
  const group = new THREE.Group();
  const L = curve.getLength();
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x1b1b1e,
    metalness: 0.8,
    roughness: 0.4,
  });
  const headMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f8 });
  const glowMat = new THREE.SpriteMaterial({
    map: makeGlowTexture(),
    color: 0xdfe3ea,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  for (let d = 18; d < L - 8; d += 19) {
    const u = d / L;
    const p = curve.getPointAt(u);
    const t = curve.getTangentAt(u);
    const nx = t.z;
    const nz = -t.x;
    const off = ROAD_W / 2 + 1.1;
    const px = p.x + nx * off;
    const pz = p.z + nz * off;
    if (blocked(px, pz, 1)) continue;

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.1, 7.4, 8),
      poleMat,
    );
    pole.position.set(px, 3.7, pz);
    group.add(pole);

    const dirX = -nx; // the arm points toward the road centre
    const dirZ = -nz;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.1), poleMat);
    arm.position.set(px + dirX * 0.8, 7.35, pz + dirZ * 0.8);
    arm.rotation.y = Math.atan2(-dirZ, dirX);
    group.add(arm);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.1, 0.28),
      headMat,
    );
    head.position.set(px + dirX * 1.6, 7.3, pz + dirZ * 1.6);
    head.rotation.y = arm.rotation.y;
    group.add(head);

    const glow = new THREE.Sprite(glowMat);
    glow.position.set(px + dirX * 1.6, 7.2, pz + dirZ * 1.6);
    glow.scale.setScalar(6);
    group.add(glow);
  }
  const theme: ThemeSwap = {
    prepare: () => [],
    set: (light) => headMat.color.setHex(light ? 0xc9c9ce : 0xf5f5f8),
  };
  return { group, glowMat, theme };
}

/** The tall gooseneck lamp from the sketch, with a faint light beam. */
export function buildGooseLamp() {
  const group = new THREE.Group();
  group.position.set(LAMP.x, 0, LAMP.z);

  const metal = new THREE.MeshStandardMaterial({
    color: 0x1b1b1e,
    metalness: 0.8,
    roughness: 0.4,
  });
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.3, 0),
    new THREE.Vector3(0, LAMP.h * 0.55, 0),
    new THREE.Vector3(0, LAMP.h * 0.93, 0.05),
    new THREE.Vector3(0, LAMP.h + 0.5, LAMP.reach * 0.4),
    new THREE.Vector3(0, LAMP.h + 0.38, LAMP.reach * 0.82),
    new THREE.Vector3(0, LAMP.h - 0.05, LAMP.reach),
  ]);
  const pole = new THREE.Mesh(new THREE.TubeGeometry(path, 56, 0.1, 8), metal);
  pole.castShadow = true;
  group.add(pole);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.3, 0.7, 8),
    metal,
  );
  base.position.y = 0.35;
  group.add(base);

  const gooseHeadMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f8 });
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.14, 0.5),
    gooseHeadMat,
  );
  head.position.set(0, LAMP.h - 0.12, LAMP.reach);
  group.add(head);

  const glowMat = new THREE.SpriteMaterial({
    map: makeGlowTexture(),
    color: 0xdfe3ea,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.position.set(0, LAMP.h - 0.3, LAMP.reach);
  glow.scale.setScalar(9);
  group.add(glow);

  // soft cone of light + pool on the ground
  const coneH = LAMP.h - 0.2;
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xdfe3ea,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(3.2, coneH, 28, 1, true),
    coneMat,
  );
  cone.position.set(0, coneH / 2, LAMP.reach);
  group.add(cone);

  const poolMat = new THREE.MeshBasicMaterial({
    map: makeGlowTexture(),
    color: 0xdfe3ea,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.09, LAMP.reach);
  group.add(pool);

  const theme: ThemeSwap = {
    prepare: () => [],
    set: (light) => gooseHeadMat.color.setHex(light ? 0xc9c9ce : 0xf5f5f8),
  };
  return { group, glowMat, coneMat, poolMat, theme };
}

/* ═══════════════════════════ TRAFFIC ══════════════════════════════════════ */

/** 12 cars drawn with 4 InstancedMeshes (body, cabin, head- and tail-lights). */
export function buildTraffic(curve: THREE.CatmullRomCurve3, rand: Rand) {
  const L = curve.getLength();
  const span = L - 12;
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1d1d20,
    metalness: 0.9,
    roughness: 0.26,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x050506,
    metalness: 0.9,
    roughness: 0.08,
  });
  const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xc9c9ce });

  const CAR_COUNT = 12;
  const lightGeo = new THREE.BoxGeometry(0.4, 0.16, 0.06);
  const bodies = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.9, 0.75, 4.3),
    bodyMat,
    CAR_COUNT,
  );
  const cabins = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.6, 0.55, 2.3),
    glassMat,
    CAR_COUNT,
  );
  const heads = new THREE.InstancedMesh(lightGeo, headMat, CAR_COUNT * 2);
  const tails = new THREE.InstancedMesh(lightGeo, tailMat, CAR_COUNT * 2);
  const parts = [bodies, cabins, heads, tails];
  for (const m of parts) {
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    group.add(m);
  }

  const at = (x: number, y: number, z: number) =>
    new THREE.Matrix4().makeTranslation(x, y, z);
  const L_BODY = at(0, 0.6, 0);
  const L_CABIN = at(0, 1.2, -0.3);
  const L_HEAD = [at(-0.65, 0.65, 2.17), at(0.65, 0.65, 2.17)];
  const L_TAIL = [at(-0.65, 0.65, -2.17), at(0.65, 0.65, -2.17)];

  const cars: {
    dir: 1 | -1;
    speed: number;
    phase: number;
    sc: THREE.Vector3;
  }[] = [];
  for (let i = 0; i < CAR_COUNT; i++) {
    cars.push({
      dir: i % 2 === 0 ? 1 : -1,
      speed: 5 + rand() * 5,
      phase: rand() * span,
      // a little variety: some are longer / taller (vans)
      sc: new THREE.Vector3(
        0.95 + rand() * 0.2,
        0.9 + rand() * 0.45,
        0.9 + rand() * 0.7,
      ),
    });
  }

  const pos = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const point = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const carM = new THREE.Matrix4();
  const partM = new THREE.Matrix4();

  const update = (t: number) => {
    for (let i = 0; i < CAR_COUNT; i++) {
      const c = cars[i];
      let d = (c.phase + c.dir * c.speed * t) % span;
      if (d < 0) d += span;
      d += 6;
      const u = d / L;
      curve.getPointAt(u, point);
      curve.getTangentAt(u, tan);
      const off = c.dir === 1 ? -1.9 : 1.9;
      pos.set(point.x + tan.z * off, 0.05, point.z - tan.x * off);
      quat.setFromAxisAngle(yAxis, Math.atan2(tan.x * c.dir, tan.z * c.dir));
      carM.compose(pos, quat, c.sc);

      bodies.setMatrixAt(i, partM.multiplyMatrices(carM, L_BODY));
      cabins.setMatrixAt(i, partM.multiplyMatrices(carM, L_CABIN));
      heads.setMatrixAt(i * 2, partM.multiplyMatrices(carM, L_HEAD[0]));
      heads.setMatrixAt(i * 2 + 1, partM.multiplyMatrices(carM, L_HEAD[1]));
      tails.setMatrixAt(i * 2, partM.multiplyMatrices(carM, L_TAIL[0]));
      tails.setMatrixAt(i * 2 + 1, partM.multiplyMatrices(carM, L_TAIL[1]));
    }
    for (const m of parts) m.instanceMatrix.needsUpdate = true;
  };
  update(0);
  return { group, update };
}

/* ═══════════════════════════ THE CAT ══════════════════════════════════════ */

/**
 * A faceted (low-poly) sitting cat in dark grey: body, haunches, front legs,
 * head with ears + glowing eyes, and a 7-piece tail that sways.
 * update(): tail sway, head follows the pointer, eyes blink, reveal scale.
 */
export function buildCat() {
  const group = new THREE.Group();
  group.position.set(CAT.x, 0, CAT.z);
  group.rotation.y = CAT.yaw;

  const rig = new THREE.Group();
  rig.scale.setScalar(0.001);
  group.add(rig);

  const fur = new THREE.MeshStandardMaterial({
    color: 0x1c1c20,
    roughness: 0.82,
    metalness: 0.04,
    flatShading: true,
  });
  const ico = (r: number, detail = 1) =>
    new THREE.IcosahedronGeometry(r, detail);
  const part = (
    geo: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = rig,
    shadow = true,
  ) => {
    const m = new THREE.Mesh(geo, fur);
    m.position.set(x, y, z);
    m.castShadow = shadow;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  part(ico(0.3), 0, 0.4, -0.04).scale.set(1, 1.4, 0.95); // body
  part(ico(0.2), -0.2, 0.2, -0.1).scale.set(0.9, 1.05, 1.25); // haunches
  part(ico(0.2), 0.2, 0.2, -0.1).scale.set(0.9, 1.05, 1.25);
  const legGeo = new THREE.CylinderGeometry(0.055, 0.068, 0.46, 6);
  legGeo.translate(0, 0.23, 0);
  part(legGeo, -0.1, 0, 0.2);
  part(legGeo, 0.1, 0, 0.2);
  const pawGeo = ico(0.08, 0);
  part(pawGeo, -0.1, 0.04, 0.26).scale.set(1, 0.55, 1.5);
  part(pawGeo, 0.1, 0.04, 0.26).scale.set(1, 0.55, 1.5);

  // head
  const head = new THREE.Group();
  head.position.set(0, 0.88, 0.07);
  rig.add(head);
  part(ico(0.2), 0, 0, 0, head, false).scale.set(1.08, 0.92, 0.95);
  const earGeo = new THREE.ConeGeometry(0.078, 0.2, 4);
  const earL = part(earGeo, -0.115, 0.2, -0.02, head, false);
  earL.rotation.set(0, Math.PI / 4, 0.28);
  const earR = part(earGeo, 0.115, 0.2, -0.02, head, false);
  earR.rotation.set(0, Math.PI / 4, -0.28);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xdfe2e8 });
  const eyes = new THREE.Group();
  head.add(eyes);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.034), eyeMat);
    eye.position.set(sx * 0.078, 0.025, 0.184);
    eye.rotation.y = sx * 0.4;
    eyes.add(eye);
  }
  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.036, 0.024, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x55565c }),
  );
  nose.position.set(0, -0.035, 0.19);
  head.add(nose);

  // tail: chain of small segments, each one swings a little later than the last
  const TAIL_N = 7;
  const SEG = 0.15;
  const tailBase = new THREE.Group();
  tailBase.position.set(0.12, 0.1, -0.3);
  tailBase.rotation.x = -0.55;
  rig.add(tailBase);
  const segGeo = new THREE.CylinderGeometry(0.03, 0.04, SEG, 6);
  segGeo.translate(0, SEG / 2, 0);
  const tail: THREE.Group[] = [];
  let parent: THREE.Object3D = tailBase;
  for (let i = 0; i < TAIL_N; i++) {
    const g = new THREE.Group();
    g.position.y = i === 0 ? 0 : SEG;
    g.add(new THREE.Mesh(segGeo, fur));
    parent.add(g);
    tail.push(g);
    parent = g;
  }

  // contact shadow
  const blobMat = new THREE.MeshBasicMaterial({
    map: makeBlobTexture(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), blobMat);
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.03;
  group.add(blob);

  const update = (time: number, px: number, py: number, reveal: number) => {
    rig.scale.setScalar(Math.max(0.001, reveal));
    blobMat.opacity = 0.6 * Math.min(1, reveal);
    for (let i = 0; i < TAIL_N; i++) {
      const k = i / (TAIL_N - 1);
      tail[i].rotation.z =
        0.1 + Math.sin(time * 1.6 - i * 0.6) * (0.07 + k * 0.12);
      tail[i].rotation.x =
        0.06 + Math.sin(time * 1.1 - i * 0.5 + 1.3) * 0.05 + (i > 3 ? 0.12 : 0);
    }
    // the cat faces the viewer, so "screen right" is the cat's local -x
    const wantY = THREE.MathUtils.clamp(-px * 0.9, -0.7, 0.7);
    const wantX = THREE.MathUtils.clamp(py * 0.35, -0.25, 0.25);
    head.rotation.y += (wantY - head.rotation.y) * 0.06;
    head.rotation.x += (wantX - head.rotation.x) * 0.06;
    eyes.scale.y = time % 4.6 > 4.45 ? 0.12 : 1; // blink
  };

  return { group, update };
}

/* ═══════════════════════════ DUST ═════════════════════════════════════════ */

/** A few slow dust motes floating in the street light. */
export function buildDust(rand: Rand, count: number) {
  const X0 = -26;
  const X1 = 34;
  const Z0 = -14;
  const Z1 = 12;
  const Y1 = 9;
  const base = new Float32Array(count * 3);
  const speed = new Float32Array(count);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    base[i * 3] = X0 + rand() * (X1 - X0);
    base[i * 3 + 1] = rand() * Y1;
    base[i * 3 + 2] = Z0 + rand() * (Z1 - Z0);
    speed[i] = 0.06 + rand() * 0.14;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const material = new THREE.PointsMaterial({
    size: 0.07,
    color: 0xc9ced8,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;

  const update = (t: number) => {
    for (let i = 0; i < count; i++) {
      pos[i * 3] = base[i * 3] + Math.sin(t * 0.3 + i) * 0.6;
      pos[i * 3 + 1] = (base[i * 3 + 1] + t * speed[i]) % Y1;
      pos[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.25 + i * 1.3) * 0.6;
    }
    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  };
  update(0);
  return { points, material, update };
}

/* ═══════════════════════════ 3D COMMENT SIGN ══════════════════════════════ */

/**
 * A real 3D speech bubble (extruded, bevelled) that floats above the cat. Its tail
 * tip is the pivot, so the bubble swings gently while the tip stays on the cat.
 * The paragraph is drawn once on a canvas texture; the "typing" reveals it with two
 * flat cover planes (no texture re-upload per letter → no FPS cost).
 */
export type SignTheme = "dark" | "light";

const SIGN_PX = 512; // texture pixels per metre of sign
const SIGN_DEPTH = 0.07;
const SIGN_BEVEL = 0.014;
const SIGN_FACE_Z = SIGN_DEPTH / 2 + SIGN_BEVEL + 0.0025;
const SIGN_LINE_H = 1.42;
const SIGN_FONT_WEIGHT = 400;
const SIGN_TYPE_DELAY = 0.9; // seconds after the pop-out before typing starts

const SIGN_COLORS: Record<
  SignTheme,
  { fill: string; text: string; edge: number; caret: string }
> = {
  dark: { fill: "#2c2c30", text: "#c6c6cc", edge: 0x3a3a3f, caret: "#d6d6dc" },
  light: { fill: "#f6f6f8", text: "#26262a", edge: 0xd9d9de, caret: "#2a2a2e" },
};

interface SignLine {
  start: number; // index of the line's first letter in ABOUT_TEXT
  top: number; // canvas px
  xs: number[]; // right edge (canvas px) of every letter of the line
}
interface SignText {
  left: number;
  right: number;
  blockBottom: number;
  lineH: number;
  lines: SignLine[];
}

const easeBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/** outline numbers of a layout; the tail TIP is the origin (0, 0) */
function signFrame(c: SignLayout) {
  const bx0 = -0.28 * c.tailW;
  const bx1 = 0.72 * c.tailW;
  const xL = bx0 - c.tailAt * c.bodyW;
  return {
    xL,
    xR: xL + c.bodyW,
    y0: c.tailH,
    y1: c.tailH + c.bodyH,
    bx0,
    bx1,
  };
}

function signShape(c: SignLayout) {
  const f = signFrame(c);
  const r = c.radius;
  const s = new THREE.Shape();
  s.moveTo(f.xL + r, f.y0);
  s.lineTo(f.bx0, f.y0);
  s.lineTo(0, 0);
  s.lineTo(f.bx1, f.y0);
  s.lineTo(f.xR - r, f.y0);
  s.quadraticCurveTo(f.xR, f.y0, f.xR, f.y0 + r);
  s.lineTo(f.xR, f.y1 - r);
  s.quadraticCurveTo(f.xR, f.y1, f.xR - r, f.y1);
  s.lineTo(f.xL + r, f.y1);
  s.quadraticCurveTo(f.xL, f.y1, f.xL, f.y1 - r);
  s.lineTo(f.xL, f.y0 + r);
  s.quadraticCurveTo(f.xL, f.y0, f.xL + r, f.y0);
  return s;
}

/** paints panel + paragraph; shrinks the font until everything FITS; returns the line map */
function drawSignFace(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  c: SignLayout,
  colors: { fill: string; text: string },
  family: string,
): SignText {
  const left = c.padX * SIGN_PX;
  const right = W - left;
  const top = c.padY * SIGN_PX;
  const bottom = H - top;
  const maxW = right - left;
  const words = ABOUT_TEXT.split(" ");

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = colors.fill;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  const setSize = (px: number) => {
    ctx.font = `${SIGN_FONT_WEIGHT} ${px}px ${family}`;
    // an unusable font-family string is ignored by the canvas → use the safe stack
    if (!ctx.font.includes(`${px}px`)) {
      ctx.font = `${SIGN_FONT_WEIGHT} ${px}px ${SANS}`;
    }
  };
  const wrap = (): string[][] => {
    const out: string[][] = [];
    let cur: string[] = [];
    for (const w of words) {
      const test = cur.length ? `${cur.join(" ")} ${w}` : w;
      if (cur.length && ctx.measureText(test).width > maxW) {
        out.push(cur);
        cur = [w];
      } else {
        cur.push(w);
      }
    }
    if (cur.length) out.push(cur);
    return out;
  };

  let size = c.maxFont;
  let rows: string[][] = [];
  for (; size >= c.minFont; size -= 2) {
    setSize(size);
    rows = wrap();
    if (rows.length * size * SIGN_LINE_H <= bottom - top) break;
  }
  size = Math.max(size, c.minFont);
  setSize(size);
  rows = wrap();

  const lineH = size * SIGN_LINE_H;
  const block = rows.length * lineH;
  const y0 = top + Math.max(0, (bottom - top - block) / 2);
  const space = ctx.measureText(" ").width;
  ctx.fillStyle = colors.text;

  const lines: SignLine[] = [];
  let start = 0;
  rows.forEach((row, i) => {
    const text = row.join(" ");
    const lineTop = y0 + i * lineH;
    const base = lineTop + lineH / 2 + size * 0.35;
    let gap = space;
    if (i < rows.length - 1 && row.length > 1) {
      // justified like the old paragraph (unless the gaps would get ugly)
      const wide =
        space + (maxW - ctx.measureText(text).width) / (row.length - 1);
      if (wide <= space * 2.4) gap = wide;
    }
    const xs: number[] = [];
    let x = left;
    row.forEach((word, j) => {
      ctx.fillText(word, x, base);
      for (let k = 1; k <= word.length; k++) {
        xs.push(x + ctx.measureText(word.slice(0, k)).width);
      }
      x += ctx.measureText(word).width + gap;
      if (j < row.length - 1) xs.push(x); // the space after the word
    });
    lines.push({ start, top: lineTop, xs });
    start += text.length + 1;
  });

  return { left, right, blockBottom: y0 + block, lineH, lines };
}

export function buildCommentSign(initialFamily: string = SANS) {
  const group = new THREE.Group();
  group.position.set(SIGN_TIP.x, SIGN_TIP.y, SIGN_TIP.z);
  group.rotation.order = "YXZ";
  group.scale.setScalar(0.001);
  group.visible = false;

  let family = initialFamily;
  let theme: SignTheme = "dark";
  let cfg: SignLayout = SIGN_LAYOUTS.wide;
  let frame = signFrame(cfg);
  let W = 0;
  let H = 0;
  let ctx2d: CanvasRenderingContext2D | null = null;
  let tex: THREE.CanvasTexture | null = null;
  let layout: SignText | null = null;
  let body: THREE.Mesh | null = null;
  let face: THREE.Mesh | null = null;
  let typedShown = -2;
  let blinkShown = false;

  const edgeMat = new THREE.MeshStandardMaterial({
    color: SIGN_COLORS.dark.edge,
    roughness: 0.55,
    metalness: 0.12,
  });
  const faceMat = new THREE.MeshBasicMaterial({
    toneMapped: false,
    fog: false,
  });
  const coverMat = new THREE.MeshBasicMaterial({
    color: SIGN_COLORS.dark.fill,
    toneMapped: false,
    fog: false,
  });
  const caretMat = new THREE.MeshBasicMaterial({
    color: SIGN_COLORS.dark.caret,
    toneMapped: false,
    fog: false,
  });
  const unit = new THREE.PlaneGeometry(1, 1);
  const cover1 = new THREE.Mesh(unit, coverMat); // hides the lines not typed yet
  const cover2 = new THREE.Mesh(unit, coverMat); // hides the rest of the current line
  const caret = new THREE.Mesh(unit, caretMat);
  group.add(cover1, cover2, caret);

  /** canvas-pixel rectangle → position / scale of a flat plane on the sign face */
  const place = (
    m: THREE.Mesh,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    z: number,
  ) => {
    const X0 = frame.xL + x0 / SIGN_PX;
    const X1 = frame.xL + x1 / SIGN_PX;
    const Y0 = frame.y1 - y0 / SIGN_PX;
    const Y1 = frame.y1 - y1 / SIGN_PX;
    m.position.set((X0 + X1) / 2, (Y0 + Y1) / 2, z);
    m.scale.set(Math.max(1e-4, X1 - X0), Math.max(1e-4, Y0 - Y1), 1);
  };

  const paint = () => {
    if (!ctx2d || !tex) return;
    layout = drawSignFace(ctx2d, W, H, cfg, SIGN_COLORS[theme], family);
    tex.needsUpdate = true;
    typedShown = -2; // force the covers to be placed again
  };

  const rebuild = () => {
    frame = signFrame(cfg);
    const shape = signShape(cfg);
    if (body) {
      group.remove(body);
      body.geometry.dispose();
    }
    if (face) {
      group.remove(face);
      face.geometry.dispose();
    }
    tex?.dispose();

    const bodyGeo = new THREE.ExtrudeGeometry(shape, {
      depth: SIGN_DEPTH,
      bevelEnabled: true,
      bevelThickness: SIGN_BEVEL,
      bevelSize: SIGN_BEVEL,
      bevelSegments: 2,
      curveSegments: 10,
    });
    bodyGeo.translate(0, 0, -SIGN_DEPTH / 2);
    body = new THREE.Mesh(bodyGeo, edgeMat);
    group.add(body);

    // front plate: same outline, its UVs map the BODY rectangle onto the texture
    const faceGeo = new THREE.ShapeGeometry(shape, 10);
    const pos = faceGeo.attributes.position as THREE.BufferAttribute;
    const uv = faceGeo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(
        i,
        (pos.getX(i) - frame.xL) / cfg.bodyW,
        (pos.getY(i) - frame.y0) / cfg.bodyH,
      );
    }
    face = new THREE.Mesh(faceGeo, faceMat);
    face.position.z = SIGN_FACE_Z;
    group.add(face);

    W = Math.round(cfg.bodyW * SIGN_PX);
    H = Math.round(cfg.bodyH * SIGN_PX);
    const made = makeCanvas(W, H);
    ctx2d = made.ctx;
    tex = toTexture(made.canvas, false);
    faceMat.map = tex;
    faceMat.needsUpdate = true;
    paint();
  };

  const setTyped = (n: number, blink: boolean) => {
    if (!layout) return;
    if (n === typedShown && blink === blinkShown) return;
    typedShown = n;
    blinkShown = blink;
    if (n >= ABOUT_TEXT.length) {
      cover1.visible = false;
      cover2.visible = false;
      caret.visible = false;
      return;
    }
    let li = 0;
    for (let i = 0; i < layout.lines.length; i++) {
      if (layout.lines[i].start <= n) li = i;
    }
    const line = layout.lines[li];
    const k = Math.min(n - line.start, line.xs.length);
    const cx = k <= 0 ? layout.left : line.xs[k - 1];
    const lineBottom = line.top + layout.lineH;
    const zc = SIGN_FACE_Z + 0.0025;

    place(cover2, cx, line.top - 1, layout.right + 4, lineBottom, zc);
    cover2.visible = true;
    if (li < layout.lines.length - 1) {
      place(
        cover1,
        layout.left - 4,
        lineBottom,
        layout.right + 4,
        layout.blockBottom + 2,
        zc,
      );
      cover1.visible = true;
    } else {
      cover1.visible = false;
    }
    place(
      caret,
      cx + 1,
      line.top + layout.lineH * 0.14,
      cx + 5,
      lineBottom - layout.lineH * 0.14,
      zc + 0.0025,
    );
    caret.visible = blink;
  };

  /**
   * clock: seconds since the sign appeared (< 0 = hidden). cam: camera position,
   * the sign turns (mostly) toward it. step: seconds per typed letter.
   */
  const update = (
    clock: number,
    now: number,
    cam: THREE.Vector3,
    step: number,
    scaleK: number,
    reduced: boolean,
  ) => {
    if (clock < 0) {
      group.visible = false;
      return;
    }
    group.visible = true;
    const pop = reduced ? 1 : easeBack(Math.min(1, clock / 0.8));
    group.scale.setScalar(Math.max(0.001, pop * scaleK));
    const faceYaw = Math.atan2(cam.x - SIGN_TIP.x, cam.z - SIGN_TIP.z);
    group.rotation.set(
      0,
      faceYaw * 0.9 + (reduced ? 0 : Math.sin(now * 0.0007) * 0.035),
      reduced ? 0 : Math.sin(now * 0.0009 + 1) * 0.012,
    );
    group.position.y =
      SIGN_TIP.y + (reduced ? 0 : Math.sin(now * 0.0011) * 0.035);
    const typed = reduced
      ? ABOUT_TEXT.length
      : Math.floor(Math.max(0, clock - SIGN_TYPE_DELAY) / step);
    setTyped(Math.min(typed, ABOUT_TEXT.length), !reduced && now % 1000 < 520);
  };

  const setTheme = (t: SignTheme) => {
    theme = t;
    edgeMat.color.setHex(SIGN_COLORS[t].edge);
    coverMat.color.set(SIGN_COLORS[t].fill);
    caretMat.color.set(SIGN_COLORS[t].caret);
    paint();
  };
  const setLayout = (name: SignLayoutName) => {
    cfg = SIGN_LAYOUTS[name];
    rebuild();
  };
  const setFont = (next: string) => {
    family = next;
    paint();
  };

  rebuild();

  return {
    group,
    update,
    setTheme,
    setLayout,
    setFont,
    redraw: paint,
    texture: () => tex,
  };
}

/* ═══════════════════════════ CLEAN-UP ═════════════════════════════════════ */

export function disposeObject(root: THREE.Object3D) {
  root.traverse((o) => {
    const obj = o as THREE.Mesh;
    obj.geometry?.dispose();
    if ((o as THREE.InstancedMesh).isInstancedMesh) {
      (o as THREE.InstancedMesh).dispose();
    }
    const mats = Array.isArray(obj.material)
      ? obj.material
      : obj.material
        ? [obj.material]
        : [];
    for (const m of mats) {
      for (const value of Object.values(
        m as unknown as Record<string, unknown>,
      )) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      m.dispose();
    }
  });
}
