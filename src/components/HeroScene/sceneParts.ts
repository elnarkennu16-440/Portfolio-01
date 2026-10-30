import * as THREE from "three";

/* ────────────────────────────────────────────────────────────────────────────
 * sceneParts.ts — every object of the hero street scene.
 * Units are "metres". x = right, y = up, z = toward the camera.
 * The camera (see HeroScene.tsx) stands at about (0.5, 1.8, 20) and looks down
 * the street toward -z.
 *
 * PERFORMANCE NOTES (nothing here changes how the scene looks):
 *   • ground / sidewalk / road now draw in a smart order (see renderOrder) so the
 *     GPU skips shading the big hidden floor layers that used to be painted over.
 *   • texture anisotropy 16 → 8 (road text keeps 16) — far cheaper, same look.
 *   • the 8 cars are drawn with 4 InstancedMeshes instead of ~56 separate meshes.
 * ──────────────────────────────────────────────────────────────────────────── */

export type Rand = () => number;
export type ThemeMode = "dark" | "light";
export type BlockFn = (x: number, z: number, pad: number) => boolean;

/* ═══════════════════════════ TUNING (change freely) ═══════════════════════ */

export const ROAD_W = 7.5; // asphalt width
export const SIDEWALK_W = 17; // paved band around the road (letters stand on it)

/** Anisotropic filtering: sharper textures at grazing angles, but costs GPU time. */
const ANISO_DEFAULT = 8;
const ANISO_ROAD_TEXT = 16; // one small quad lying flat on the road: keep it crisp

/** Road centre line as [x, z] points (near the camera first). */
const ROAD_POINTS: ReadonlyArray<readonly [number, number]> = [
  [-12, 26],
  [-7, 14],
  [-2, 5],
  [3, -1],
  [9, -5.5],
  [14, -10.5],
  [17, -19],
  [16, -34],
  [11, -56],
  [4, -88],
];

/** The KENNU letter row: where it starts, how much it is turned, its size. */
export const WORD = { x: -9.5, z: -7, yaw: 0.35, scale: 0.82 };

/** Billboard on the right: position, turn toward the camera, size (metres). */
export const BILLBOARD = {
  x: 4.9,
  z: 6.5,
  yaw: -0.3,
  w: 4.0,
  h: 2.3,
  postH: 2,
};

/** Word painted on the asphalt: distance along the road, size. */
export const ROAD_TEXT = { text: "ELNAR", d: 31, w: 6.6, len: 7.5 };

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
  const ctx = canvas.getContext("2d");
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

export function createRoadCurve() {
  const curve = new THREE.CatmullRomCurve3(
    ROAD_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    "centripetal",
  );
  curve.arcLengthDivisions = 800;
  return curve;
}

/** Row of letters: total length in letter-design units (see LETTERS below). */
const LH = 7; // letter height
const LS = 1.2; // stem thickness
const LD = 1.9; // letter depth
const LGAP = 0.6; // gap between letters
const PLINTH_H = 0.25;

type Pt = [number, number];
const LETTER_DEFS: Record<string, { w: number; pts: Pt[] }> = {
  K: {
    w: 3.7,
    pts: [
      [0, 0],
      [LS, 0],
      [LS, 2.7],
      [2.05, 0],
      [3.7, 0],
      [2.35, 3.55],
      [3.7, LH],
      [2.05, LH],
      [LS, 4.35],
      [LS, LH],
      [0, LH],
    ],
  },
  E: {
    w: 3.2,
    pts: [
      [0, 0],
      [3.2, 0],
      [3.2, 1.15],
      [LS, 1.15],
      [LS, 2.95],
      [2.8, 2.95],
      [2.8, 4.05],
      [LS, 4.05],
      [LS, 5.85],
      [3.2, 5.85],
      [3.2, LH],
      [0, LH],
    ],
  },
  N: {
    w: 3.7,
    pts: [
      [0, 0],
      [LS, 0],
      [LS, 3.9],
      [2.5, 0],
      [3.7, 0],
      [3.7, LH],
      [2.5, LH],
      [2.5, 3.1],
      [LS, LH],
      [0, LH],
    ],
  },
  U: {
    w: 3.7,
    pts: [
      [0, 0],
      [3.7, 0],
      [3.7, LH],
      [2.5, LH],
      [2.5, LS],
      [LS, LS],
      [LS, LH],
      [0, LH],
    ],
  },
};
const WORD_TEXT = "KENNU";

export const ROW_LEN =
  WORD_TEXT.split("").reduce((sum, ch) => sum + LETTER_DEFS[ch].w, 0) +
  LGAP * (WORD_TEXT.length - 1);

/** True when (x, z) is inside the area reserved for letters / plaza / billboard. */
export const isBlocked: BlockFn = (x, z, pad) => {
  const dx = x - WORD.x;
  const dz = z - WORD.z;
  const c = Math.cos(WORD.yaw);
  const s = Math.sin(WORD.yaw);
  const lx = dx * c - dz * s; // along the letter row
  const lz = dx * s + dz * c; // toward the camera (front of the letters)
  const rowLen = ROW_LEN * WORD.scale;
  if (
    lx > -8 - pad &&
    lx < rowLen + 8 + pad &&
    lz > -10 - pad &&
    lz < 12 + pad
  ) {
    return true;
  }
  const bx = x - BILLBOARD.x;
  const bz = z - BILLBOARD.z;
  return bx * bx + bz * bz < (7 + pad) * (7 + pad);
};

/* ═══════════════════════════ TEXTURES ═════════════════════════════════════ */

/* Every texture below can be drawn in a "dark" (the original look, drawn with the
   shared seeded `rand` so the city layout never changes) or a "light" palette. */
function makeAsphaltTexture(rand: Rand, light = false) {
  const S = 512;
  const { canvas, ctx } = makeCanvas(S, S);
  ctx.fillStyle = light ? "#9b9ea5" : "#1b1b1e";
  ctx.fillRect(0, 0, S, S);
  const vMin = light ? 118 : 26;
  const vSpan = light ? 100 : 70;
  for (let i = 0; i < 26000; i++) {
    const v = vMin + Math.floor(rand() * vSpan);
    ctx.fillStyle = `rgba(${v},${v},${v + 3},${0.18 + rand() * 0.4})`;
    const size = rand() < 0.08 ? 2 : 1;
    ctx.fillRect(Math.floor(rand() * S), Math.floor(rand() * S), size, size);
  }
  for (let i = 0; i < 10; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const r = 40 + rand() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(
      0,
      light
        ? `rgba(60,62,70,${0.12 + rand() * 0.14})`
        : `rgba(0,0,0,${0.18 + rand() * 0.2})`,
    );
    g.addColorStop(1, light ? "rgba(60,62,70,0)" : "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return toTexture(canvas, true);
}

function makePavingTexture(rand: Rand, light = false) {
  const S = 512;
  const { canvas, ctx } = makeCanvas(S, S);
  ctx.fillStyle = light ? "#e3e4e8" : "#26262a";
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 12000; i++) {
    const v = (light ? 150 : 30) + Math.floor(rand() * (light ? 55 : 40));
    ctx.fillStyle = `rgba(${v},${v},${v + 2},${light ? 0.3 : 0.35})`;
    ctx.fillRect(rand() * S, rand() * S, 1.5, 1.5);
  }
  const cell = S / 4;
  for (let i = 0; i <= 4; i++) {
    ctx.fillStyle = light ? "rgba(110,114,124,0.5)" : "rgba(0,0,0,0.75)";
    ctx.fillRect(i * cell - 2, 0, 4, S);
    ctx.fillRect(0, i * cell - 2, S, 4);
    ctx.fillStyle = light ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.05)";
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
  return toTexture(canvas, false, 1); // a sprite always faces the camera: no anisotropy needed
}

function makeRoadTextTexture(text: string, rand: Rand) {
  const W = 1024;
  const H = 512;
  const { canvas, ctx } = makeCanvas(W, H);
  const spacing = 26;
  let size = 420;
  const family = `"Arial Black", Impact, "Helvetica Neue", Arial, sans-serif`;
  const measure = () => {
    ctx.font = `900 ${size}px ${family}`;
    return (
      text.split("").reduce((sum, ch) => sum + ctx.measureText(ch).width, 0) +
      spacing * (text.length - 1)
    );
  };
  while (measure() > W - 90 && size > 80) size -= 8;
  const total = measure();
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  let x = (W - total) / 2;
  for (const ch of text) {
    ctx.fillText(ch, x, H / 2 + size * 0.04);
    x += ctx.measureText(ch).width + spacing;
  }
  // worn paint
  ctx.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.25 + rand() * 0.6})`;
    ctx.fillRect(rand() * W, rand() * H, 1 + rand() * 5, 1 + rand() * 3);
  }
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.12 + rand() * 0.2})`;
    ctx.fillRect(0, rand() * H, W, 1 + rand() * 2);
  }
  ctx.globalCompositeOperation = "source-over";
  return toTexture(canvas, false, ANISO_ROAD_TEXT);
}

/* ═══════════════════════ GROUND, ROAD, MARKINGS ═══════════════════════════ */

interface RibbonSpec {
  offset: number; // sideways shift from the centre line (+ = left)
  width: number;
  y: number;
  from: number; // start / end distance along the curve
  to: number;
  uTile: number; // metres per texture repeat across
  vTile: number; // metres per texture repeat along
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
      const nx = t.z; // left-hand normal
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
  const textures: THREE.Texture[] = [];

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0d0d0f,
    roughness: 0.96,
    metalness: 0,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  // PERF: draw the huge ground plane LAST. Everything nearer is already in the
  // depth buffer, so the GPU skips the expensive lighting for hidden pixels.
  ground.renderOrder = 10;
  group.add(ground);

  const pavingDark = makePavingTexture(rand);
  textures.push(pavingDark);
  const sidewalkMat = new THREE.MeshStandardMaterial({
    map: pavingDark,
    color: 0xb4b4ba,
    roughness: 0.8,
    metalness: 0.02,
  });
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
    sidewalkMat,
  );
  sidewalk.receiveShadow = true;
  // PERF: after the road, before the ground (same reason as above)
  sidewalk.renderOrder = 5;
  group.add(sidewalk);

  const asphaltDark = makeAsphaltTexture(rand);
  textures.push(asphaltDark);
  const roadMat = new THREE.MeshStandardMaterial({
    map: asphaltDark,
    color: 0xa6a6ac,
    roughness: 0.44,
    metalness: 0.15,
  });
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
    roadMat,
  );
  road.receiveShadow = true;
  group.add(road);

  const flat = (color: number, opacity: number) =>
    new THREE.MeshBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

  // curbs + solid edge lines
  const curbMats: THREE.MeshBasicMaterial[] = [];
  const edgeMats: THREE.MeshBasicMaterial[] = [];
  for (const side of [1, -1]) {
    const curbMat = flat(0x303034, 1);
    curbMats.push(curbMat);
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
        curbMat,
      ),
    );
    const edgeMat = flat(0x9b9ba2, 0.7);
    edgeMats.push(edgeMat);
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
        edgeMat,
      ),
    );
  }

  // centre dashes (revealed near → far by drawRange in HeroScene)
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
  const dashMat = flat(0xd4d4d8, 0.9);
  const dashes = new THREE.Mesh(dashed.geo, dashMat);
  group.add(dashes);

  // light palette: drawn on first use (own seeded rand: the city layout above
  // is untouched), swapped in/out without recompiling anything
  let pavingLight: THREE.Texture | null = null;
  let asphaltLight: THREE.Texture | null = null;
  const setTheme = (mode: ThemeMode) => {
    const light = mode === "light";
    if (light && !pavingLight) {
      pavingLight = makePavingTexture(mulberry32(51001), true);
      asphaltLight = makeAsphaltTexture(mulberry32(51002), true);
      textures.push(pavingLight, asphaltLight);
    }
    groundMat.color.setHex(light ? 0xe6e7ea : 0x0d0d0f);
    sidewalkMat.map = light ? pavingLight : pavingDark;
    sidewalkMat.color.setHex(light ? 0xffffff : 0xb4b4ba);
    roadMat.map = light ? asphaltLight : asphaltDark;
    roadMat.color.setHex(light ? 0xffffff : 0xa6a6ac);
    for (const m of curbMats) m.color.setHex(light ? 0x9a9da5 : 0x303034);
    for (const m of edgeMats) m.color.setHex(light ? 0xffffff : 0x9b9ba2);
    dashMat.color.setHex(light ? 0xffffff : 0xd4d4d8);
  };

  return { group, dashes, dashCount: dashed.count, setTheme, textures };
}

export function buildRoadText(curve: THREE.CatmullRomCurve3, rand: Rand) {
  const u = ROAD_TEXT.d / curve.getLength();
  const p = curve.getPointAt(u);
  const t = curve.getTangentAt(u);
  const material = new THREE.MeshBasicMaterial({
    map: makeRoadTextTexture(ROAD_TEXT.text, rand),
    color: 0xd2d2d7,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(ROAD_TEXT.w, ROAD_TEXT.len),
    material,
  );
  mesh.rotation.order = "YXZ";
  mesh.rotation.set(-Math.PI / 2, Math.atan2(-t.x, -t.z), 0);
  mesh.position.set(p.x, 0.075, p.z);
  const setTheme = (mode: ThemeMode) =>
    material.color.setHex(mode === "light" ? 0xffffff : 0xd2d2d7);
  return { mesh, material, setTheme };
}

/* ═══════════════════════════ KENNU LETTERS ════════════════════════════════ */

export function buildLetters() {
  const group = new THREE.Group();
  group.position.set(WORD.x, 0, WORD.z);
  group.rotation.y = WORD.yaw;
  group.scale.setScalar(WORD.scale);

  const material = new THREE.MeshStandardMaterial({
    color: 0xe9e9ec,
    roughness: 0.6,
    metalness: 0.03,
    emissive: 0xffffff,
    emissiveIntensity: 0,
  });

  // concrete plinth under the letters
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x2b2b2f,
    roughness: 0.9,
    metalness: 0.02,
  });
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(ROW_LEN + 1.6, PLINTH_H, LD + 1.4),
    plinthMat,
  );
  plinth.position.set(ROW_LEN / 2, PLINTH_H / 2, 0);
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const letters: THREE.Mesh[] = [];
  let cursor = 0;
  for (const ch of WORD_TEXT) {
    const def = LETTER_DEFS[ch];
    const shape = new THREE.Shape(
      def.pts.map(([x, y]) => new THREE.Vector2(x, y)),
    );
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: LD,
      bevelEnabled: true,
      bevelThickness: 0.07,
      bevelSize: 0.07,
      bevelSegments: 1,
      curveSegments: 1,
    });
    geo.translate(-def.w / 2, 0, -LD / 2);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(cursor + def.w / 2, PLINTH_H, 0);
    mesh.scale.y = 0.001; // grows up from the plinth during the reveal
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    letters.push(mesh);
    cursor += def.w + LGAP;
  }
  // light mode: dark monoliths on a white street (dark mode: pale on dark)
  const setTheme = (mode: ThemeMode) => {
    const light = mode === "light";
    material.color.setHex(light ? 0x1a1a1e : 0xe9e9ec);
    material.emissive.setHex(light ? 0x4a4a52 : 0xffffff);
    plinthMat.color.setHex(light ? 0xb6b9c0 : 0x2b2b2f);
  };
  return { group, letters, plinth, material, setTheme };
}

/* ═══════════════════════════ BILLBOARD ════════════════════════════════════ */

const SANS = `"Helvetica Neue", Helvetica, Arial, sans-serif`;
const MONO = `ui-monospace, "SF Mono", Menlo, Consolas, monospace`;

function drawBoard(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0e0e10";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.025)";
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 1);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  const padX = 84;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.font = `66px "Kaushan Script", "Caveat", cursive`;
  ctx.fillText("Focusing on", padX, 118);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `500 26px ${MONO}`;
  ctx.fillText("[ 01 — 03 ]", W - padX, 108);
  ctx.textAlign = "left";

  const rows = ["SOFTWARE QUALITY", "USER FLOWS", "DEPENDABLE WEB APPS"];
  const top = 156;
  const rowH = (H - top - 60) / rows.length;
  const textX = padX + 120;
  const maxW = W - textX - padX - 70;

  // one common size for all rows (the longest line decides)
  let size = 118;
  const setFont = () => (ctx.font = `800 ${size}px ${SANS}`);
  setFont();
  while (size > 40 && rows.some((r) => ctx.measureText(r).width > maxW)) {
    size -= 4;
    setFont();
  }

  rows.forEach((text, i) => {
    const y0 = top + rowH * i;
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(padX, y0, W - padX * 2, 2);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = `500 28px ${MONO}`;
    ctx.fillText(`0${i + 1}`, padX, y0 + 54);
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    setFont();
    ctx.fillText(text, textX, y0 + rowH / 2 + size * 0.34);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `500 54px ${MONO}`;
    ctx.textAlign = "right";
    ctx.fillText("↗", W - padX, y0 + rowH / 2 + 18);
    ctx.textAlign = "left";
  });
}

export function buildBillboard() {
  const { w, h, postH } = BILLBOARD;
  const group = new THREE.Group();
  group.position.set(BILLBOARD.x, 0, BILLBOARD.z);
  group.rotation.y = BILLBOARD.yaw;

  const BW = 1536;
  const BH = Math.round(BW * (h / w));
  const { canvas, ctx } = makeCanvas(BW, BH);
  drawBoard(ctx, BW, BH);
  const tex = toTexture(canvas, false);
  const redraw = () => {
    drawBoard(ctx, BW, BH);
    tex.needsUpdate = true;
  };

  const metal = new THREE.MeshStandardMaterial({
    color: 0x1a1a1d,
    metalness: 0.8,
    roughness: 0.4,
  });
  const frameD = 0.26;
  const boardY = postH + h / 2;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.28, h + 0.28, frameD),
    metal,
  );
  frame.position.set(0, boardY, 0);
  frame.castShadow = true;
  group.add(frame);

  const panelMat = new THREE.MeshStandardMaterial({
    map: tex,
    emissiveMap: tex,
    emissive: 0xffffff,
    emissiveIntensity: 0,
    color: 0x888888,
    roughness: 0.6,
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), panelMat);
  panel.position.set(0, boardY, frameD / 2 + 0.005);
  group.add(panel);

  for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, postH + h * 0.4, 0.2),
      metal,
    );
    post.position.set(sx * w * 0.28, (postH + h * 0.4) / 2, -0.04);
    post.castShadow = true;
    group.add(post);
  }
  const footing = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.7, 0.3, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x2b2b2f, roughness: 0.9 }),
  );
  footing.position.set(0, 0.15, -0.04);
  footing.receiveShadow = true;
  group.add(footing);

  // lamp arm + 3 lamp heads over the board
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xf4f4f7 });
  const armY = postH + h + 0.5;
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.72, 0.05, 0.05),
    metal,
  );
  arm.position.set(0, armY, 0.55);
  group.add(arm);
  for (const lx of [-0.27, 0, 0.27]) {
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.07, 0.2),
      lampMat,
    );
    head.position.set(lx * w, armY - 0.06, 0.55);
    group.add(head);
    const strut = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.34, 0.04),
      metal,
    );
    strut.position.set(lx * w, armY - 0.2, 0.2);
    strut.rotation.x = -0.9;
    group.add(strut);
  }

  const spot = new THREE.SpotLight(0xe8ebf0, 0, 16, 0.75, 0.7, 2);
  spot.position.set(0, armY, 0.6);
  const target = new THREE.Object3D();
  target.position.set(0, postH + h * 0.25, 0.3);
  group.add(target);
  spot.target = target;
  group.add(spot);

  return { group, panelMat, lampMat, spot, redraw };
}

/* ═══════════════════════════ BUILDINGS ════════════════════════════════════ */

const COLS = 4;
const ROWS = 6;
const CELL_W = 1.3;
const CELL_H = 1.8;
const PX_W = 72;
const PX_H = 96;
const FACADE_BASE = ["#2a2a2e", "#222226", "#303035"] as const;

interface FacadeTex {
  map: THREE.CanvasTexture;
  emissiveMap: THREE.CanvasTexture;
}

interface FacadeSet {
  material: THREE.MeshStandardMaterial;
  tileW: number;
  tileH: number;
  dark: FacadeTex;
  /** drawn on first use, with its own seeded rand */
  light: () => FacadeTex;
}

/** Draws one facade tile. The dark palette is the original look (same rand calls,
 *  same order, so the layout never changes); "light" is the same tile in white. */
function drawFacade(rand: Rand, variant: 0 | 1 | 2, light: boolean): FacadeTex {
  const W = COLS * PX_W;
  const H = ROWS * PX_H;
  const a = makeCanvas(W, H);
  const b = makeCanvas(W, H);
  const map = a.ctx;
  const glow = b.ctx;

  const pal = light
    ? {
        base: ["#d3d5da", "#c9ccd2", "#dbdde1"] as const,
        nMin: 150,
        nSpan: 55,
        glass: "#3a3d45",
        recess: "rgba(0,0,0,0.22)",
        sill: "#a7aab2",
        slab: "#b4b7be",
        fin: "rgba(0,0,0,0.07)",
        lit: (k: number) => `rgba(238,241,247,${0.35 + 0.6 * k})`,
      }
    : {
        base: FACADE_BASE,
        nMin: 20,
        nSpan: 50,
        glass: "#08080a",
        recess: "rgba(0,0,0,0.55)",
        sill: "#505057",
        slab: "#18181b",
        fin: "rgba(255,255,255,0.05)",
        lit: (k: number) => `rgba(214,214,220,${0.1 + 0.8 * k})`,
      };

  map.fillStyle = pal.base[variant];
  map.fillRect(0, 0, W, H);
  glow.fillStyle = "#000000";
  glow.fillRect(0, 0, W, H);
  for (let i = 0; i < 5000; i++) {
    const v = pal.nMin + Math.floor(rand() * pal.nSpan);
    map.fillStyle = `rgba(${v},${v},${v + 2},0.35)`;
    map.fillRect(rand() * W, rand() * H, 1.5, 1.5);
  }

  const litChance = [0.2, 0.14, 0.26][variant];
  const lit = (x: number, y: number, w: number, h: number) => {
    const k = 0.55 + rand() * 0.45;
    map.fillStyle = pal.lit(k);
    map.fillRect(x, y, w, h);
    glow.fillStyle = `rgba(255,255,255,${k})`;
    glow.fillRect(x, y, w, h);
  };
  const win = (x: number, y: number, w: number, h: number) => {
    map.fillStyle = pal.glass;
    map.fillRect(x, y, w, h);
    map.fillStyle = pal.recess; // recess shadow on top
    map.fillRect(x - 3, y - 3, w + 6, 3);
    map.fillStyle = pal.sill; // sill
    map.fillRect(x - 2, y + h, w + 4, 3);
    if (rand() < litChance) lit(x, y, w, h);
  };

  for (let r = 0; r < ROWS; r++) {
    const y = r * PX_H;
    if (variant === 1) {
      // ribbon windows with mullions
      const sy = y + PX_H * 0.24;
      const sh = PX_H * 0.46;
      map.fillStyle = pal.glass;
      map.fillRect(6, sy, W - 12, sh);
      for (let c = 0; c < COLS; c++) {
        if (rand() < litChance) lit(c * PX_W + 6, sy, PX_W - 8, sh);
      }
      map.fillStyle = pal.base[1];
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
    map.fillStyle = pal.slab; // floor slab shadow line
    map.fillRect(0, y + PX_H - 7, W, 7);
  }
  if (variant === 2) {
    map.fillStyle = pal.fin; // vertical fins
    for (let c = 0; c <= COLS; c++) map.fillRect(c * PX_W - 1, 0, 2, H);
  }

  return {
    map: toTexture(a.canvas, true),
    emissiveMap: toTexture(b.canvas, true),
  };
}

function makeFacade(
  rand: Rand,
  variant: 0 | 1 | 2,
  store: THREE.Texture[],
): FacadeSet {
  const dark = drawFacade(rand, variant, false);
  store.push(dark.map, dark.emissiveMap);
  let lightTex: FacadeTex | null = null;
  const material = new THREE.MeshStandardMaterial({
    map: dark.map,
    emissiveMap: dark.emissiveMap,
    emissive: 0xffffff,
    emissiveIntensity: 0,
    roughness: 0.88,
    metalness: 0.06,
  });
  return {
    material,
    tileW: COLS * CELL_W,
    tileH: ROWS * CELL_H,
    dark,
    light: () => {
      if (!lightTex) {
        lightTex = drawFacade(mulberry32(52000 + variant), variant, true);
        store.push(lightTex.map, lightTex.emissiveMap);
      }
      return lightTex;
    },
  };
}

export function buildCity(
  curve: THREE.CatmullRomCurve3,
  rand: Rand,
  blocked: BlockFn,
) {
  const textures: THREE.Texture[] = [];
  const facades = [
    makeFacade(rand, 0, textures),
    makeFacade(rand, 1, textures),
    makeFacade(rand, 2, textures),
  ];
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.95,
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
    d: number,
    yaw: number,
    f: FacadeSet,
    shadow: boolean,
  ) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    const rep = (len: number, tile: number) =>
      Math.max(1, Math.round(len / tile));
    const scaleFace = (face: number, su: number, sv: number) => {
      for (let i = face * 4; i < face * 4 + 4; i++)
        uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
    };
    const ry = rep(h, f.tileH);
    scaleFace(0, rep(d, f.tileW), ry); // +x
    scaleFace(1, rep(d, f.tileW), ry); // -x
    scaleFace(4, rep(w, f.tileW), ry); // +z
    scaleFace(5, rep(w, f.tileW), ry); // -z
    const m = f.material;
    // PERF: BoxGeometry ships 6 groups (one per face) = 6 draw calls per building,
    // and the shadow pass repeats them. Faces that share a material are neighbours
    // (+x/-x = facade, +y/-y = roof, +z/-z = facade), so merge them into 3 groups.
    // Same pixels, half the draw calls.
    geo.clearGroups();
    geo.addGroup(0, 12, 0); // +x, -x  → facade
    geo.addGroup(12, 12, 1); // +y, -y → roof
    geo.addGroup(24, 12, 2); // +z, -z → facade
    const mesh = new THREE.Mesh(geo, [m, roofMat, m]);
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

  // procedural blocks on both sides of the road
  let d = 16;
  while (d < L - 6) {
    const u = d / L;
    const p = curve.getPointAt(u);
    const t = curve.getTangentAt(u);
    const nx = t.z;
    const nz = -t.x;
    for (const side of [1, -1]) {
      const far = d > 70;
      const w = 6 + rand() * 9;
      const dep = 7 + rand() * 9;
      const h = (far ? 30 : 14) + rand() * (far ? 34 : 26);
      const variant = Math.floor(rand() * 3);
      const jitter = (rand() - 0.5) * 0.1;
      const off = side * (ROAD_W / 2 + 9 + dep / 2 + rand() * 4);
      const cx = p.x + nx * off;
      const cz = p.z + nz * off;
      if (cz > 4) continue; // keep the camera side open
      if (blocked(cx, cz, Math.max(w, dep) / 2)) continue;
      addBox(
        cx,
        cz,
        w,
        h,
        dep,
        Math.atan2(-t.z, t.x) + jitter,
        facades[variant],
        d < 80,
      );
    }
    d += 8 + rand() * 7;
  }

  // hero tower + two concrete pylons behind the K (from the sketch)
  addBox(-15.5, -13, 7, 30, 6, 0.2, facades[1], true);
  const pylonMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2e,
    roughness: 0.9,
    metalness: 0.04,
  });
  const pylonA = new THREE.Mesh(new THREE.BoxGeometry(1.5, 22, 1.5), pylonMat);
  pylonA.position.set(-12.2, 11, -12.5);
  pylonA.castShadow = true;
  const pylonB = new THREE.Mesh(new THREE.BoxGeometry(1.2, 16, 1.2), pylonMat);
  pylonB.position.set(-10.4, 8, -14);
  pylonB.castShadow = true;
  group.add(pylonA, pylonB);

  const setTheme = (mode: ThemeMode) => {
    const light = mode === "light";
    for (const f of facades) {
      const t = light ? f.light() : f.dark;
      f.material.map = t.map;
      f.material.emissiveMap = t.emissiveMap;
    }
    roofMat.color.setHex(light ? 0xc2c5cb : 0x18181b);
    pylonMat.color.setHex(light ? 0xb3b6bd : 0x2a2a2e);
    for (const b of beacons)
      (b.material as THREE.MeshBasicMaterial).color.setHex(
        light ? 0x2b2b30 : 0xffffff,
      );
  };

  return {
    group,
    facadeMats: facades.map((f) => f.material),
    beacons,
    setTheme,
    textures,
  };
}

/* ═══════════════════════════ STREET LIGHTS ════════════════════════════════ */

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

  let n = 0;
  for (let d = 26; d < L - 8; d += 17) {
    const u = d / L;
    const p = curve.getPointAt(u);
    const t = curve.getTangentAt(u);
    const nx = t.z;
    const nz = -t.x;
    const side = n % 2 === 0 ? -1 : 1; // alternate right / left side
    n++;
    const off = side * (ROAD_W / 2 + 1.1);
    const px = p.x + nx * off;
    const pz = p.z + nz * off;
    if (blocked(px, pz, 1)) continue;

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.1, 7.4, 8),
      poleMat,
    );
    pole.position.set(px, 3.7, pz);
    group.add(pole);

    const dirX = -nx * side; // arm points toward the road centre
    const dirZ = -nz * side;
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
  return { group, glowMat, headMat };
}

/* ═══════════════════════════ TRAFFIC ══════════════════════════════════════ */

/**
 * PERF: the 8 cars used to be 8 groups × ~7 meshes (≈56 draw calls, ≈56 matrix
 * updates every frame). They are now 4 InstancedMeshes (body, cabin, headlights,
 * tail-lights) = 4 draw calls. Same shapes, same positions, same movement.
 */
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

  const CAR_COUNT = 8;
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
    m.frustumCulled = false; // instances move every frame
    group.add(m);
  }

  // where each part sits inside its car (identical numbers to the old version)
  const at = (x: number, y: number, z: number) =>
    new THREE.Matrix4().makeTranslation(x, y, z);
  const L_BODY = at(0, 0.6, 0);
  const L_CABIN = at(0, 1.2, -0.3);
  const L_HEAD = [at(-0.65, 0.65, 2.17), at(0.65, 0.65, 2.17)];
  const L_TAIL = [at(-0.65, 0.65, -2.17), at(0.65, 0.65, -2.17)];

  const cars: { dir: 1 | -1; speed: number; phase: number }[] = [];
  for (let i = 0; i < CAR_COUNT; i++) {
    const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
    cars.push({ dir, speed: 5 + rand() * 5, phase: rand() * span });
  }

  // scratch objects: nothing is allocated per frame
  const pos = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const point = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const one = new THREE.Vector3(1, 1, 1);
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
      const off = c.dir === 1 ? -1.9 : 1.9; // away = right lane, toward = left lane
      pos.set(point.x + tan.z * off, 0.05, point.z - tan.x * off);
      quat.setFromAxisAngle(yAxis, Math.atan2(tan.x * c.dir, tan.z * c.dir));
      carM.compose(pos, quat, one);

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
