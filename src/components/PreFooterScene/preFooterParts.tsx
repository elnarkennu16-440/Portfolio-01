import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* ────────────────────────────────────────────────────────────────────────────
 * preFooterParts.ts — every object of the pre-footer billboard scene.
 * Units are "metres". x = right, y = up, z = toward the camera.
 *
 * Same rules as sceneParts.ts (Hero):
 *   • strictly black / white / gray, no colour anywhere;
 *   • few draw calls (repeated things are InstancedMesh or merged geometry);
 *   • static things never change after build, only the stream / splash move.
 *
 * Composition (copied from the reference photo):
 *   a huge billboard, a giant bottle lying on its right edge, pouring a glossy
 *   stream straight down into the hatch of a chrome tanker parked in front.
 * ──────────────────────────────────────────────────────────────────────────── */

export type Rand = () => number;

export const mulberry32 = (seed: number): Rand => {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/* ═══════════════════════════ LAYOUT (change freely) ═══════════════════════ */

export const LAYOUT = {
  board: { x0: -17, x1: 9, y0: 8.5, y1: 19.5, z: -7 },
  truck: { z: -3, x0: -10, x1: 6.5, r: 1.75, y: 2.6 },
  hatchX: 3.5,
  /** the tip of the bottle: the stream starts exactly here */
  mouth: { x: 3.5, y: 9.8, z: -3 },
  /** direction from the mouth toward the bottle's base (up, to the right) */
  bottleDir: { x: 0.65, y: 0.75, z: -0.1 },
  bottleLen: 12.9,
} as const;

export const TANK_TOP = LAYOUT.truck.y + LAYOUT.truck.r;
export const HATCH_TOP = TANK_TOP + 0.29;

/* ═══════════════════════════════ HELPERS ══════════════════════════════════ */

const SANS = `"Helvetica Neue", Helvetica, Arial, sans-serif`;
const SERIF = `Georgia, "Times New Roman", serif`;
const MONO = `ui-monospace, "SF Mono", Menlo, Consolas, monospace`;

const makeCanvas = (w: number, h: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is not available");
  return { canvas, ctx };
};

const toTexture = (canvas: HTMLCanvasElement, anisotropy = 8) => {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
};

const setLetterSpacing = (ctx: CanvasRenderingContext2D, value: string) => {
  (ctx as unknown as { letterSpacing?: string }).letterSpacing = value;
};

const addBox = (
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  cast = false,
  receive = false,
) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  parent.add(m);
  return m;
};

const _d = new THREE.Object3D();
const setInst = (
  mesh: THREE.InstancedMesh,
  i: number,
  x: number,
  y: number,
  z: number,
  sx = 1,
  sy = 1,
  sz = 1,
  rx = 0,
  ry = 0,
  rz = 0,
) => {
  _d.position.set(x, y, z);
  _d.rotation.set(rx, ry, rz);
  _d.scale.set(sx, sy, sz);
  _d.updateMatrix();
  mesh.setMatrixAt(i, _d.matrix);
};

/** Glossy light-gray liquid shared by the stream and the splash. */
export function createLiquidMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xc4c5ca,
    metalness: 0.45,
    roughness: 0.1,
    emissive: 0x1b1b1d,
    envMapIntensity: 1.4,
    side: THREE.DoubleSide,
  });
}

/* ═══════════════════════════ GROUND / HILL / FENCE ════════════════════════ */

const HILL_Z0 = -8.5;
const HILL_DEPTH = 58;
const hillHeight = (x: number, v: number) =>
  Math.pow(v, 1.15) * 30 +
  (Math.sin(x * 0.09 + 1.3) * 0.5 + Math.sin(x * 0.23 + v * 5) * 0.25) *
    (0.6 + v * 3.2);

export function buildGround(rand: Rand) {
  const group = new THREE.Group();

  // flat yard
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x17171a,
    roughness: 0.95,
    metalness: 0.02,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 120), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -5);
  ground.receiveShadow = true;
  group.add(ground);

  // soft pool of light under the truck
  const g = makeCanvas(256, 256);
  const grad = g.ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.ctx.fillStyle = grad;
  g.ctx.fillRect(0, 0, 256, 256);
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 22),
    new THREE.MeshBasicMaterial({
      map: toTexture(g.canvas, 1),
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(2, 0.03, -2);
  group.add(glow);

  // hill behind the billboard (low-poly, flat shaded)
  const NX = 56;
  const NZ = 22;
  const pos = new Float32Array((NX + 1) * (NZ + 1) * 3);
  const col = new Float32Array((NX + 1) * (NZ + 1) * 3);
  let p = 0;
  for (let j = 0; j <= NZ; j++) {
    const v = j / NZ;
    for (let i = 0; i <= NX; i++) {
      const x = -140 + (i / NX) * 280;
      const y = Math.max(
        -0.1,
        hillHeight(x, v) + (rand() - 0.5) * (0.3 + v * 1.2),
      );
      pos[p] = x;
      pos[p + 1] = y;
      pos[p + 2] = HILL_Z0 - v * HILL_DEPTH;
      const c = 0.055 + v * 0.05 + rand() * 0.03;
      col[p] = col[p + 1] = col[p + 2] = c;
      p += 3;
    }
  }
  const idx: number[] = [];
  for (let j = 0; j < NZ; j++) {
    for (let i = 0; i < NX; i++) {
      const a = j * (NX + 1) + i;
      const b = a + 1;
      const c = a + NX + 1;
      const d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  const hillGeo = new THREE.BufferGeometry();
  hillGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  hillGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  hillGeo.setIndex(idx);
  hillGeo.computeVertexNormals();
  const hill = new THREE.Mesh(
    hillGeo,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 1,
      metalness: 0,
    }),
  );
  hill.receiveShadow = true;
  group.add(hill);

  // far trees: one InstancedMesh
  const TREES = 70;
  const trees = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({
      color: 0x1b1d1f,
      roughness: 1,
      flatShading: true,
    }),
    TREES,
  );
  for (let i = 0; i < TREES; i++) {
    const v = 0.12 + rand() * 0.8;
    const x = -135 + rand() * 270;
    const s = 2.2 + rand() * 3.2;
    setInst(
      trees,
      i,
      x,
      hillHeight(x, v) + s * 0.55 - 0.3,
      HILL_Z0 - v * HILL_DEPTH,
      s * (0.9 + rand() * 0.3),
      s * (0.8 + rand() * 0.5),
      s * (0.9 + rand() * 0.3),
      0,
      rand() * 6.28,
      0,
    );
  }
  group.add(trees);

  // three bigger trees close to the billboard (like the reference photo)
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2e,
    roughness: 0.95,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x232527,
    roughness: 1,
    flatShading: true,
  });
  const leafGeo = new THREE.IcosahedronGeometry(1, 1);
  const bigTree = (x: number, z: number, h: number) => {
    const t = new THREE.Group();
    t.position.set(x, 0, z);
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.38, h, 8),
      trunkMat,
    );
    trunk.position.y = h / 2;
    trunk.castShadow = true;
    t.add(trunk);
    const blobs: [number, number, number, number][] = [
      [0, h + 0.4, 0, h * 0.34],
      [h * 0.2, h * 0.8, 0.5, h * 0.26],
      [-h * 0.2, h * 0.86, -0.3, h * 0.24],
    ];
    for (const [bx, by, bz, br] of blobs) {
      const m = new THREE.Mesh(leafGeo, leafMat);
      m.position.set(bx, by, bz);
      m.scale.set(br, br * 0.85, br);
      m.castShadow = true;
      t.add(m);
    }
    group.add(t);
  };
  bigTree(-22, -8, 9);
  bigTree(14.5, -8.5, 10);
  bigTree(-28, -5, 7);

  // chain-link fence in front of the truck
  const f = makeCanvas(64, 64);
  f.ctx.strokeStyle = "#ffffff";
  f.ctx.lineWidth = 4;
  f.ctx.beginPath();
  f.ctx.moveTo(0, 0);
  f.ctx.lineTo(64, 64);
  f.ctx.moveTo(64, 0);
  f.ctx.lineTo(0, 64);
  f.ctx.stroke();
  const fenceTex = toTexture(f.canvas, 8);
  fenceTex.wrapS = fenceTex.wrapT = THREE.RepeatWrapping;
  fenceTex.repeat.set(52 / 0.5, 2.1 / 0.5);
  const fenceMat = new THREE.MeshStandardMaterial({
    map: fenceTex,
    alphaTest: 0.35,
    side: THREE.DoubleSide,
    color: 0x9a9a9f,
    roughness: 0.6,
    metalness: 0.6,
  });
  const fence = new THREE.Mesh(new THREE.PlaneGeometry(52, 2.1), fenceMat);
  fence.position.set(0, 1.15, 3.2);
  group.add(fence);
  const steel = new THREE.MeshStandardMaterial({
    color: 0x3a3a3f,
    metalness: 0.7,
    roughness: 0.5,
  });
  const POSTS = 21;
  const posts = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.14, 2.3, 0.14),
    steel,
    POSTS,
  );
  for (let i = 0; i < POSTS; i++) setInst(posts, i, -25 + i * 2.5, 1.15, 3.2);
  group.add(posts);
  addBox(group, 52, 0.1, 0.1, steel, 0, 2.2, 3.2);
  addBox(group, 52, 0.1, 0.1, steel, 0, 0.1, 3.2);

  return { group };
}

/* ═══════════════════════════ BILLBOARD ════════════════════════════════════ */

function drawPanel(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = "#0b0b0d";
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(255,255,255,0.05)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 1);
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 3;
  ctx.strokeRect(34, 34, W - 68, H - 68);

  const size = Math.round(W * 0.0225);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(235,235,238,0.92)";
  ctx.font = `700 ${size}px ${SANS}`;
  setLetterSpacing(ctx, "0.08em");
  const x = Math.round(W * 0.05);
  const y = Math.round(H * 0.15);
  ctx.fillText("I BUILD & TEST EVERYTHING CAREFULLY.", x, y);
  ctx.fillText("PLEASE ENJOY IT THAT WAY.", x, y + size * 1.6);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = `500 ${Math.round(size * 0.62)}px ${MONO}`;
  ctx.textAlign = "right";
  ctx.fillText("KENNU / QA — WEB — 2026", W - x, H - Math.round(H * 0.09));
  setLetterSpacing(ctx, "0px");
}

function drawSign(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = "#101012";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.fillStyle = "#f1f1f3";
  ctx.font = `800 ${Math.round(H * 0.5)}px ${SANS}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  setLetterSpacing(ctx, "0.06em");
  ctx.fillText("KENNU", W / 2, H / 2 + 4);
  setLetterSpacing(ctx, "0px");
}

export function buildBillboard() {
  const { x0, x1, y0, y1, z } = LAYOUT.board;
  const w = x1 - x0;
  const h = y1 - y0;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const group = new THREE.Group();

  const TW = 2048;
  const TH = Math.round(TW * (h / w));
  const pc = makeCanvas(TW, TH);
  drawPanel(pc.ctx, TW, TH);
  const panelTex = toTexture(pc.canvas, 8);

  const steel = new THREE.MeshStandardMaterial({
    color: 0x1c1c1f,
    metalness: 0.7,
    roughness: 0.45,
  });
  const trim = new THREE.MeshStandardMaterial({
    color: 0x4a4a50,
    metalness: 0.6,
    roughness: 0.4,
  });

  addBox(group, w + 0.5, h + 0.5, 0.5, steel, cx, cy, z - 0.05, true, true);

  const panelMat = new THREE.MeshStandardMaterial({
    map: panelTex,
    emissiveMap: panelTex,
    emissive: 0xffffff,
    emissiveIntensity: 0,
    color: 0xb0b0b0,
    roughness: 0.7,
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), panelMat);
  panel.position.set(cx, cy, z + 0.205);
  panel.receiveShadow = true; // the bottle casts its shadow on the board
  group.add(panel);

  addBox(group, w + 0.5, 0.14, 0.1, trim, cx, y1 + 0.18, z + 0.23);
  addBox(group, w + 0.5, 0.14, 0.1, trim, cx, y0 - 0.18, z + 0.23);
  addBox(group, 0.14, h + 0.5, 0.1, trim, x0 - 0.18, cy, z + 0.23);
  addBox(group, 0.14, h + 0.5, 0.1, trim, x1 + 0.18, cy, z + 0.23);

  // under-beam, catwalk and handrail
  addBox(group, w, 0.35, 0.35, steel, cx, y0 - 0.15, z + 0.1, true);
  addBox(group, w - 0.6, 0.18, 2.0, steel, cx, y0 - 0.35, z + 1.0, true, true);
  addBox(group, w - 0.6, 0.08, 0.08, steel, cx, y0 + 0.55, z + 2.0);
  const RAILS = 14;
  const rails = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.08, 0.9, 0.08),
    steel,
    RAILS,
  );
  for (let i = 0; i < RAILS; i++)
    setInst(
      rails,
      i,
      x0 + 0.6 + (i / (RAILS - 1)) * (w - 1.2),
      y0 + 0.1,
      z + 2.0,
    );
  group.add(rails);

  // main pole + footing + name plate
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.95, y0 - 0.4, 28),
    steel,
  );
  pole.position.set(-5, (y0 - 0.4) / 2, z + 0.8);
  pole.castShadow = true;
  group.add(pole);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.6, 0.25, 28),
    trim,
  );
  base.position.set(-5, 0.12, z + 0.8);
  base.receiveShadow = true;
  group.add(base);

  const sc = makeCanvas(512, 160);
  drawSign(sc.ctx, 512, 160);
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 1.07, 0.1),
    new THREE.MeshStandardMaterial({
      map: toTexture(sc.canvas, 8),
      roughness: 0.5,
      metalness: 0.3,
    }),
  );
  plate.position.set(-5, 5.6, z + 1.82);
  group.add(plate);

  // lamp bar with 5 heads over the board
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xf2f2f5 });
  addBox(group, w * 0.9, 0.12, 0.12, steel, cx, y1 + 0.85, z + 1.7);
  const LAMPS = 5;
  const arms = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.1, 0.1, 1.9),
    steel,
    LAMPS,
  );
  const heads = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.4, 0.28, 0.8),
    lampMat,
    LAMPS,
  );
  for (let i = 0; i < LAMPS; i++) {
    const lx = x0 + 2.4 + (i / (LAMPS - 1)) * (w - 4.8);
    setInst(arms, i, lx, y1 + 0.5, z + 0.85);
    setInst(heads, i, lx, y1 + 0.75, z + 1.7, 1, 1, 1, 0.5);
  }
  group.add(arms, heads);

  const setGlow = (f: number) => {
    panelMat.emissiveIntensity = 0.55 * f;
    const c = 0.12 + 0.88 * f;
    lampMat.color.setRGB(c * 0.95, c * 0.95, c * 0.97);
  };
  setGlow(1);
  return { group, panelMat, setGlow };
}

/* ═══════════════════════════ WORKER (scale reference) ═════════════════════ */

export function buildWorker() {
  const { x1, y0, z } = LAYOUT.board;
  const group = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({
    color: 0x2a2a2e,
    roughness: 0.9,
  });
  const skin = new THREE.MeshStandardMaterial({
    color: 0xcfd0d4,
    roughness: 0.7,
  });
  const floorY = y0 - 0.35 + 0.09;
  group.position.set(x1 - 1.2, floorY, z + 1.2);
  addBox(group, 0.34, 0.85, 0.2, cloth, 0, 0.425, 0, true);
  addBox(group, 0.5, 0.7, 0.28, cloth, 0, 1.2, 0, true);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), skin);
  head.position.set(0, 1.76, 0);
  group.add(head);
  const arm = addBox(group, 0.12, 0.62, 0.12, cloth, 0.38, 1.55, 0, true);
  arm.rotation.z = -0.5;
  return { group };
}

/* ═══════════════════════════ BOTTLE ═══════════════════════════════════════ */

function drawLabel(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#ececea";
  const inset = 26;
  ctx.fillRect(inset, 0, W - inset * 2, H);
  // scalloped long edges
  const N = 15;
  const rr = H / N / 2;
  for (let k = 0; k < N; k++) {
    const y = (k + 0.5) * (H / N);
    ctx.beginPath();
    ctx.arc(inset, y, rr, 0, Math.PI * 2);
    ctx.arc(W - inset, y, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  // text runs along the bottle (rotated 90°): glyph-up points to +u
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = "#0c0c0e";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 250px ${SERIF}`;
  const tw = ctx.measureText("KENNU").width;
  ctx.save();
  ctx.scale(Math.min(1, 650 / tw), 1);
  ctx.fillText("KENNU", 0, -6);
  ctx.restore();
  ctx.fillRect(-330, -170, 660, 4);
  ctx.fillRect(-330, 150, 660, 4);
  setLetterSpacing(ctx, "6px");
  ctx.font = `600 30px ${SANS}`;
  ctx.fillText("QUALITY ASSURED  ·  EST. 2026", 0, -208);
  ctx.fillText("SMALL BATCH  ·  WEB BUILDS", 0, 198);
  setLetterSpacing(ctx, "0px");
  ctx.restore();
}

function drawSeal(ctx: CanvasRenderingContext2D, S: number) {
  ctx.clearRect(0, 0, S, S);
  ctx.fillStyle = "#0c0c0e";
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#f1f1f3";
  ctx.font = `700 ${Math.round(S * 0.52)}px ${SERIF}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("K", S / 2, S / 2 + 6);
}

export function buildBottle(viewDir: THREE.Vector3) {
  const L = LAYOUT;
  const m = new THREE.Vector3(
    -L.bottleDir.x,
    -L.bottleDir.y,
    -L.bottleDir.z,
  ).normalize(); // base → mouth
  const mouth = new THREE.Vector3(L.mouth.x, L.mouth.y, L.mouth.z);
  const base = mouth.clone().addScaledVector(m, -L.bottleLen);

  // pivot sits on the mouth so the bottle can tip in around it during the intro
  const pivot = new THREE.Group();
  pivot.position.copy(mouth);
  const bottle = new THREE.Group();
  bottle.position.copy(base).sub(mouth);
  bottle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), m);
  pivot.add(bottle);
  const inner = new THREE.Group();
  bottle.add(inner);

  // turn the label toward the camera
  const local = new THREE.Vector3();
  let best = 0;
  let bestDot = -2;
  for (let a = 0; a < 72; a++) {
    const phi = (a * Math.PI) / 36;
    local
      .set(Math.sin(phi), 0, Math.cos(phi))
      .applyQuaternion(bottle.quaternion);
    const dot = local.dot(viewDir);
    if (dot > bestDot) {
      bestDot = dot;
      best = phi;
    }
  }
  inner.rotation.y = best;

  const R = 2.6;

  // glass body + neck (smooth profile → lathe)
  const profile: [number, number][] = [
    [0, 0],
    [1.5, 0],
    [2.2, 0.15],
    [2.5, 0.55],
    [R, 1.3],
    [R, 6.8],
    [2.5, 7.7],
    [2.15, 8.6],
    [1.6, 9.4],
    [1.1, 10.0],
    [0.88, 10.6],
    [0.84, 11.4],
    [0.84, 12.0],
  ];
  const curve = new THREE.CatmullRomCurve3(
    profile.map(([r, y]) => new THREE.Vector3(r, y, 0)),
    false,
    "centripetal",
  );
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xa9abb1,
    metalness: 0.25,
    roughness: 0.18,
    envMapIntensity: 1.2,
  });
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(
      curve.getPoints(90).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y)),
      64,
    ),
    glassMat,
  );
  glass.castShadow = true;
  inner.add(glass);

  // black wax neck with drips (merged into one geometry)
  const rand = mulberry32(77);
  const waxProfile: [number, number][] = [
    [0.9, 9.5],
    [1.02, 9.8],
    [1.08, 10.3],
    [1.08, 12.4],
    [1.0, 12.82],
    [0.78, 12.95],
    [0.55, 12.9],
    [0.5, 12.3],
  ];
  const waxCurve = new THREE.CatmullRomCurve3(
    waxProfile.map(([r, y]) => new THREE.Vector3(r, y, 0)),
    false,
    "centripetal",
  );
  const waxParts: THREE.BufferGeometry[] = [
    new THREE.LatheGeometry(
      waxCurve.getPoints(40).map((p) => new THREE.Vector2(p.x, p.y)),
      48,
    ),
  ];
  const DRIPS = 11;
  for (let i = 0; i < DRIPS; i++) {
    const a = (i / DRIPS) * Math.PI * 2 + rand() * 0.3;
    const len = 0.5 + rand() * 1.3;
    const d = new THREE.CylinderGeometry(0.15, 0.1, len, 8, 1);
    d.translate(0, -len / 2, 0);
    const bulb = new THREE.SphereGeometry(0.17, 8, 6);
    bulb.translate(0, -len, 0);
    const drip = mergeGeometries([d, bulb]);
    if (drip) {
      drip.translate(Math.sin(a) * 1.05, 9.95, Math.cos(a) * 1.05);
      waxParts.push(drip);
    }
  }
  const waxGeo = mergeGeometries(waxParts) ?? waxParts[0];
  const waxMat = new THREE.MeshStandardMaterial({
    color: 0x0c0c0e,
    metalness: 0.2,
    roughness: 0.22,
    envMapIntensity: 1.1,
  });
  const wax = new THREE.Mesh(waxGeo, waxMat);
  wax.castShadow = true;
  inner.add(wax);
  const hole = new THREE.Mesh(
    new THREE.CircleGeometry(0.52, 20),
    new THREE.MeshBasicMaterial({ color: 0x020203 }),
  );
  hole.rotation.x = -Math.PI / 2;
  hole.position.y = 12.3;
  inner.add(hole);

  // paper label (text runs along the bottle) + round seal
  const LABEL_H = 4.7;
  const LABEL_Y0 = 1.3;
  const lc = makeCanvas(768, 824);
  drawLabel(lc.ctx, 768, 824);
  const labelGeo = new THREE.CylinderGeometry(
    R + 0.03,
    R + 0.03,
    LABEL_H,
    48,
    1,
    true,
    -0.85,
    1.7,
  );
  labelGeo.translate(0, LABEL_Y0 + LABEL_H / 2, 0);
  const labelMat = new THREE.MeshStandardMaterial({
    map: toTexture(lc.canvas, 8),
    emissiveMap: null,
    alphaTest: 0.5,
    roughness: 0.6,
    metalness: 0,
    emissive: 0x1c1c1c,
  });
  inner.add(new THREE.Mesh(labelGeo, labelMat));

  const sealC = makeCanvas(256, 256);
  drawSeal(sealC.ctx, 256);
  const sealGeo = new THREE.CylinderGeometry(
    R + 0.03,
    R + 0.03,
    1.1,
    24,
    1,
    true,
    -0.2,
    0.4,
  );
  sealGeo.translate(0, 6.55, 0);
  inner.add(
    new THREE.Mesh(
      sealGeo,
      new THREE.MeshStandardMaterial({
        map: toTexture(sealC.canvas, 4),
        transparent: true,
        alphaTest: 0.3,
        roughness: 0.4,
      }),
    ),
  );

  return { pivot, reflective: [glassMat, waxMat] };
}

/* ═══════════════════════════ POURING STREAM ═══════════════════════════════ */

const STREAM_K = 46; // rings along the fall
const STREAM_S = 20; // points around each ring

export function buildStream(mat: THREE.Material) {
  const K = STREAM_K;
  const S = STREAM_S;
  const top = LAYOUT.mouth.y;
  const bot = HATCH_TOP + 0.04;
  const cx = LAYOUT.mouth.x;
  const cz = LAYOUT.mouth.z;

  const pos = new Float32Array(K * S * 3);
  const idx: number[] = [];
  for (let k = 0; k < K - 1; k++) {
    for (let s = 0; s < S; s++) {
      const a = k * S + s;
      const b = k * S + ((s + 1) % S);
      const c = (k + 1) * S + s;
      const d = (k + 1) * S + ((s + 1) % S);
      idx.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  const attr = new THREE.BufferAttribute(pos, 3);
  attr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute("position", attr);
  geo.setIndex(idx);
  geo.setDrawRange(0, 0);

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.frustumCulled = false;

  const smooth = (e0: number, e1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };

  const update = (time: number) => {
    let p = 0;
    for (let k = 0; k < K; k++) {
      const s = k / (K - 1);
      const y = top + (bot - top) * s;
      const r =
        (0.55 * (1 - 0.28 * Math.pow(s, 0.8)) + 0.2 * smooth(0.82, 1, s)) *
        (1 + 0.06 * Math.sin(s * 14 - time * 7));
      const sway = Math.sin(s * 5.5 - time * 2.4) * 0.05 * s;
      for (let j = 0; j < S; j++) {
        const a = (j / S) * Math.PI * 2;
        const rr = r * (1 + 0.03 * Math.sin(a * 3 + time * 3 + s * 9));
        pos[p++] = cx + sway + Math.cos(a) * rr;
        pos[p++] = y;
        pos[p++] = cz + Math.sin(a) * rr;
      }
    }
    attr.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  };
  update(0);

  /** 0 → nothing, 1 → the whole stream (the pour starts at the mouth) */
  const setGrow = (g: number) => {
    const rings = Math.round(Math.min(1, Math.max(0, g)) * (K - 1));
    geo.setDrawRange(0, rings * S * 6);
  };
  return { mesh, update, setGrow };
}

/* ═══════════════════════════ SPLASH CROWN ═════════════════════════════════ */

export function buildSplash(mat: THREE.Material) {
  const group = new THREE.Group();
  group.position.set(LAYOUT.hatchX, HATCH_TOP + 0.02, LAYOUT.truck.z);

  const puddle = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.25, 0.16, 32),
    mat,
  );
  puddle.position.y = 0.03;
  group.add(puddle);

  const CROWN = 14;
  const spikeGeo = new THREE.SphereGeometry(0.2, 10, 8);
  spikeGeo.scale(1, 2.4, 1);
  spikeGeo.translate(0, 0.45, 0);
  const crown = new THREE.InstancedMesh(spikeGeo, mat, CROWN);
  crown.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  crown.frustumCulled = false;
  group.add(crown);

  const DROPS = 12;
  const drops = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.1, 8, 6),
    mat,
    DROPS,
  );
  drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  drops.frustumCulled = false;
  group.add(drops);

  const dummy = new THREE.Object3D();
  dummy.rotation.order = "YXZ";

  const update = (time: number) => {
    for (let i = 0; i < CROWN; i++) {
      const a = (i / CROWN) * Math.PI * 2 + 0.2 * Math.sin(time * 0.8);
      const h = 0.75 + 0.35 * Math.sin(time * 6 + i * 1.7);
      dummy.position.set(Math.cos(a) * 0.95, 0.06, Math.sin(a) * 0.95);
      dummy.rotation.set(0, -a, -0.55);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      crown.setMatrixAt(i, dummy.matrix);
    }
    crown.instanceMatrix.needsUpdate = true;

    dummy.rotation.set(0, 0, 0);
    for (let i = 0; i < DROPS; i++) {
      const p = (time * 0.9 + i / DROPS) % 1;
      const a = i * 2.399;
      const r = 0.9 + 1.5 * p;
      dummy.position.set(
        Math.cos(a) * r,
        0.2 + 7.2 * p * (1 - p) * 0.5,
        Math.sin(a) * r,
      );
      dummy.scale.setScalar(1 - p * 0.6);
      dummy.updateMatrix();
      drops.setMatrixAt(i, dummy.matrix);
    }
    drops.instanceMatrix.needsUpdate = true;
  };
  update(0);

  const setScale = (s: number) => group.scale.setScalar(Math.max(0.001, s));
  setScale(0);
  return { group, update, setScale };
}

/* ═══════════════════════════ CHROME TANKER TRUCK ══════════════════════════ */

export function buildTanker() {
  const { z, x0, x1, r, y } = LAYOUT.truck;
  const group = new THREE.Group();

  const chrome = new THREE.MeshStandardMaterial({
    color: 0xd7d8dc,
    metalness: 1,
    roughness: 0.16,
    envMapIntensity: 1.6,
  });
  const steelDark = new THREE.MeshStandardMaterial({
    color: 0x2a2a2e,
    metalness: 0.7,
    roughness: 0.45,
    envMapIntensity: 0.8,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: 0x0c0c0d,
    roughness: 0.92,
    metalness: 0.02,
  });
  const cabMat = new THREE.MeshStandardMaterial({
    color: 0xe4e4e7,
    metalness: 0.15,
    roughness: 0.38,
    envMapIntensity: 0.5,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x040405,
    metalness: 0.9,
    roughness: 0.08,
    envMapIntensity: 1,
  });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // tank: cylinder along x + two flattened domes
  const len = x1 - x0;
  const tank = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, len, 64, 1, true),
    chrome,
  );
  tank.rotation.z = Math.PI / 2;
  tank.position.set((x0 + x1) / 2, y, z);
  tank.castShadow = true;
  group.add(tank);
  const domeGeo = new THREE.SphereGeometry(
    r,
    40,
    20,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );
  const domeR = new THREE.Mesh(domeGeo, chrome);
  domeR.rotation.z = -Math.PI / 2;
  domeR.scale.y = 0.32;
  domeR.position.set(x1, y, z);
  domeR.castShadow = true;
  const domeL = new THREE.Mesh(domeGeo, chrome);
  domeL.rotation.z = Math.PI / 2;
  domeL.scale.y = 0.32;
  domeL.position.set(x0, y, z);
  domeL.castShadow = true;
  group.add(domeR, domeL);

  // bands
  const BANDS = 6;
  const bandGeo = new THREE.TorusGeometry(r + 0.015, 0.055, 8, 64);
  bandGeo.rotateY(Math.PI / 2);
  const bands = new THREE.InstancedMesh(bandGeo, steelDark, BANDS);
  for (let i = 0; i < BANDS; i++) setInst(bands, i, -8.9 + i * 2.9, y, z);
  group.add(bands);

  // top walkway + hatch the bottle pours into
  addBox(group, 10.5, 0.08, 0.75, steelDark, -4.2, TANK_TOP + 0.04, z);
  const hatch = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.3, 0.34, 36),
    steelDark,
  );
  hatch.position.set(LAYOUT.hatchX, TANK_TOP + 0.12, z);
  hatch.castShadow = true;
  group.add(hatch);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.07, 10, 40),
    chrome,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(LAYOUT.hatchX, HATCH_TOP, z);
  group.add(ring);

  // chassis + rear bumper
  addBox(group, 24.2, 0.3, 1.3, steelDark, 1.2, 0.72, z, true);
  addBox(group, 0.2, 0.3, 2.0, steelDark, -10.8, 0.7, z);

  // tractor cab
  addBox(group, 2.8, 3.0, 2.5, cabMat, 8.4, 2.5, z, true);
  addBox(group, 1.6, 0.7, 2.3, cabMat, 8.0, 4.25, z, true);
  addBox(group, 2.9, 1.55, 2.15, cabMat, 11.25, 1.85, z, true);
  addBox(group, 0.1, 1.35, 1.85, chrome, 12.72, 1.8, z);
  addBox(group, 0.12, 1.15, 1.65, steelDark, 12.74, 1.8, z);
  addBox(group, 0.4, 0.45, 2.45, chrome, 12.9, 0.78, z, true);
  addBox(group, 0.06, 1.35, 2.2, glassMat, 9.82, 3.15, z);
  addBox(group, 1.7, 1.15, 0.05, glassMat, 8.5, 3.2, z + 1.26);
  addBox(group, 1.7, 1.15, 0.05, glassMat, 8.5, 3.2, z - 1.26);
  const headlights = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.08, 0.32, 0.5),
    lightMat,
    2,
  );
  setInst(headlights, 0, 12.78, 2.35, z + 0.8);
  setInst(headlights, 1, 12.78, 2.35, z - 0.8);
  group.add(headlights);

  // exhaust stacks + fuel tanks
  const stacks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.11, 0.11, 4.2, 12),
    chrome,
    2,
  );
  setInst(stacks, 0, 7.2, 2.95, z + 1.45);
  setInst(stacks, 1, 7.2, 2.95, z - 1.45);
  stacks.castShadow = true;
  group.add(stacks);
  const fuel = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.42, 0.42, 1.7, 20),
    chrome,
    2,
  );
  setInst(fuel, 0, 8.4, 1.45, z + 1.6, 1, 1, 1, 0, 0, Math.PI / 2);
  setInst(fuel, 1, 8.4, 1.45, z - 1.6, 1, 1, 1, 0, 0, Math.PI / 2);
  group.add(fuel);

  // wheels: 5 axles x 2 sides, instanced
  const axles = [-9.4, -8.1, 7.5, 8.8, 12.0];
  const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.5, 24);
  wheelGeo.rotateX(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.56, 16);
  hubGeo.rotateX(Math.PI / 2);
  const wheels = new THREE.InstancedMesh(wheelGeo, rubber, axles.length * 2);
  const hubs = new THREE.InstancedMesh(hubGeo, chrome, axles.length * 2);
  axles.forEach((ax, i) => {
    for (let side = 0; side < 2; side++) {
      const zz = z + (side === 0 ? 1.0 : -1.0);
      setInst(wheels, i * 2 + side, ax, 0.55, zz);
      setInst(hubs, i * 2 + side, ax, 0.55, zz);
    }
  });
  wheels.castShadow = true;
  group.add(wheels, hubs);

  return { group, reflective: [chrome, steelDark, cabMat, glassMat] };
}

/* ═══════════════════════════ FLOATING CALLOUTS ════════════════════════════
 * Seven web-dev labels pointing at the bottle. Pure floating text + a thin
 * line (no boxes, no borders), real 3D objects: they move with the camera
 * parallax and bob gently. Cost: 1 instanced draw for all lines, 1 for all
 * dots, 7 sprites. Nothing here touches any other part of the scene.
 *
 * Each line starts on the bottle SURFACE at (yl, theta):
 *   yl    = distance from the bottle's base along its axis (metres)
 *   theta = angle around the axis, 0 = the side facing the camera,
 *           negative = left of it, positive = right of it (degrees)
 * `elbow` and `end` are world x/y of the line bend and the line end; the text
 * sits right after the end (left column: right-aligned, right column: left-aligned).
 * ──────────────────────────────────────────────────────────────────────────── */

interface CalloutDef {
  lines: string[];
  yl: number;
  theta: number;
  elbow: [number, number];
  end: [number, number];
  side: "L" | "R";
}

const CALLOUTS: CalloutDef[] = [
  {
    lines: ["Databases"],
    yl: 3.0,
    theta: -55,
    elbow: [7.2, 18.5],
    end: [5.3, 18.5],
    side: "L",
  },
  {
    lines: ["Deployment"],
    yl: 5.8,
    theta: 60,
    elbow: [10.0, 12.8],
    end: [10.4, 12.8],
    side: "R",
  },
  {
    lines: ["Security"],
    yl: 4.0,
    theta: 62,
    elbow: [11.2, 14.6],
    end: [11.5, 14.6],
    side: "R",
  },
  {
    lines: ["API Intergration"],
    yl: 5.0,
    theta: -38,
    elbow: [6.6, 16.5],
    end: [4.6, 16.5],
    side: "L",
  },
  {
    lines: ["Frontend"],
    yl: 6.6,
    theta: -30,
    elbow: [5.6, 14.9],
    end: [3.9, 14.9],
    side: "L",
  },
  {
    lines: ["Quality Assurance"],
    yl: 2.0,
    theta: 68,
    elbow: [12.9, 16.66],
    end: [13.3, 16.66],
    side: "R",
  },
  {
    lines: ["Backend"],
    yl: 6.5,
    theta: 25,
    elbow: [8.45, 11.5],
    end: [8.9, 11.5],
    side: "R",
  },
];

const CALLOUT_FONT_PX = 72;
const CALLOUT_PAD_PX = 18;
const CALLOUT_LINE_R = 0.03;
const CALLOUT_LIFT = 1.0; // line ends float this far in front of the surface
const CALLOUT_GAP = 0.3; // space between line end and text
const CALLOUT_T0 = 3.0; // seconds after the reveal starts (after the pour)
const CALLOUT_STAGGER = 0.2;

const cEaseOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const cEaseOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const cSeg = (t: number, start: number, dur: number) =>
  Math.min(1, Math.max(0, (t - start) / dur));

export interface CalloutLayout {
  show: boolean;
  /** font size in metres */
  em: number;
  /** furthest world x that is still on screen (right column must end before it) */
  rightLimit: number;
}

export function buildCallouts(cam: THREE.Vector3) {
  const L = LAYOUT;
  const group = new THREE.Group();
  const dir = new THREE.Vector3(
    L.bottleDir.x,
    L.bottleDir.y,
    L.bottleDir.z,
  ).normalize(); // mouth → base
  const base = new THREE.Vector3(
    L.mouth.x,
    L.mouth.y,
    L.mouth.z,
  ).addScaledVector(dir, L.bottleLen);

  const anchorOn = (yl: number, thetaDeg: number) => {
    const P = base.clone().addScaledVector(dir, -yl);
    const V = cam.clone().sub(P).normalize();
    const f = V.clone().addScaledVector(dir, -V.dot(dir)).normalize();
    const s = new THREE.Vector3().crossVectors(dir, f);
    const th = THREE.MathUtils.degToRad(thetaDeg);
    return P.add(
      f
        .multiplyScalar(Math.cos(th) * 2.65)
        .add(s.multiplyScalar(Math.sin(th) * 2.65)),
    );
  };

  const white = (opacity: number) =>
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity,
      toneMapped: false,
      fog: false,
    });

  const N = CALLOUTS.length;
  const lineMat = white(0.92);
  const lines = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(1, 1, 1, 6, 1),
    lineMat,
    N * 2,
  );
  lines.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  lines.frustumCulled = false;
  const dots = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.11, 12, 8),
    white(1),
    N,
  );
  dots.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  dots.frustumCulled = false;
  group.add(lines, dots);

  interface Item {
    def: CalloutDef;
    a: THREE.Vector3;
    e: THREE.Vector3;
    t: THREE.Vector3;
    sprite: THREE.Sprite;
    mat: THREE.SpriteMaterial;
    cw: number; // canvas size in px
    ch: number;
    wEm: number; // text width in em
    emUse: number;
  }
  const items: Item[] = CALLOUTS.map((def) => {
    const a = anchorOn(def.yl, def.theta);
    const e = new THREE.Vector3(def.elbow[0], def.elbow[1], a.z + CALLOUT_LIFT);
    const t = new THREE.Vector3(def.end[0], def.end[1], a.z + CALLOUT_LIFT);

    // text → texture (soft dark shadow keeps it readable on any background)
    const lh = CALLOUT_FONT_PX * 1.2;
    const probe = makeCanvas(8, 8).ctx;
    probe.font = `600 ${CALLOUT_FONT_PX}px ${SANS}`;
    setLetterSpacing(probe, "0.06em");
    const tw = Math.ceil(
      Math.max(...def.lines.map((l) => probe.measureText(l).width)),
    );
    const cw = tw + CALLOUT_PAD_PX * 2;
    const ch = Math.ceil(lh * def.lines.length + CALLOUT_PAD_PX * 2);
    const c = makeCanvas(cw, ch);
    c.ctx.font = `600 ${CALLOUT_FONT_PX}px ${SANS}`;
    setLetterSpacing(c.ctx, "0.06em");
    c.ctx.textBaseline = "middle";
    c.ctx.textAlign = def.side === "L" ? "right" : "left";
    c.ctx.fillStyle = "#ffffff";
    c.ctx.shadowColor = "rgba(0,0,0,0.8)";
    c.ctx.shadowBlur = 12;
    const tx = def.side === "L" ? cw - CALLOUT_PAD_PX : CALLOUT_PAD_PX;
    def.lines.forEach((line, i) => {
      c.ctx.fillText(line, tx, CALLOUT_PAD_PX + lh * (i + 0.5));
    });
    const mat = new THREE.SpriteMaterial({
      map: toTexture(c.canvas, 4),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.center.set(def.side === "L" ? 1 : 0, 0.5);
    sprite.renderOrder = 10;
    group.add(sprite);
    return {
      def,
      a,
      e,
      t,
      sprite,
      mat,
      cw,
      ch,
      wEm: tw / CALLOUT_FONT_PX,
      emUse: 0.7,
    };
  });

  let show = true;
  const setLayout = (lay: CalloutLayout) => {
    show = lay.show;
    group.visible = show;
    // ONE font size for every label: the biggest size at which the right column
    // still ends before the screen edge (so nothing is cropped, nothing is mixed)
    let em = lay.em;
    for (const it of items) {
      if (it.def.side !== "R") continue;
      const avail = lay.rightLimit - (it.t.x + CALLOUT_GAP);
      em = Math.min(em, avail / it.wEm);
    }
    em = Math.max(0.55, em);
    for (const it of items) {
      it.emUse = em;
      it.sprite.scale.set(
        (it.cw / CALLOUT_FONT_PX) * em,
        (it.ch / CALLOUT_FONT_PX) * em,
        1,
      );
    }
  };

  const dummy = new THREE.Object3D();
  const Y = new THREE.Vector3(0, 1, 0);
  const d = new THREE.Vector3();
  const to = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const t2 = new THREE.Vector3();

  const writeSegment = (
    idx: number,
    a: THREE.Vector3,
    b: THREE.Vector3,
    f: number,
  ) => {
    to.copy(a).lerp(b, f);
    d.copy(to).sub(a);
    const len = d.length();
    if (len < 1e-4) {
      dummy.scale.set(0.0001, 0.0001, 0.0001);
      dummy.position.copy(a);
    } else {
      d.divideScalar(len);
      dummy.quaternion.setFromUnitVectors(Y, d);
      dummy.position.copy(a).addScaledVector(d, len / 2);
      dummy.scale.set(CALLOUT_LINE_R, len, CALLOUT_LINE_R);
    }
    dummy.updateMatrix();
    lines.setMatrixAt(idx, dummy.matrix);
    if (len < 1e-4) dummy.quaternion.identity();
  };

  /** t = seconds since the reveal started, time = running clock (idle bob) */
  const update = (t: number, time: number, still: boolean) => {
    if (!show) return;
    items.forEach((it, i) => {
      const t0 = CALLOUT_T0 + i * CALLOUT_STAGGER;
      const bob = still ? 0 : Math.sin(time * 0.9 + i * 1.3) * 0.08;
      e2.copy(it.e);
      t2.copy(it.t);
      e2.y += bob;
      t2.y += bob;

      // dot pops in on the surface, with a tiny breathing pulse
      const pop = Math.max(0.0001, cEaseOutBack(cSeg(t, t0, 0.4)));
      const pulse = still ? 1 : 1 + 0.15 * Math.sin(time * 3 + i);
      dummy.quaternion.identity();
      dummy.position.copy(it.a);
      dummy.scale.setScalar(t < t0 ? 0.0001 : pop * pulse);
      dummy.updateMatrix();
      dots.setMatrixAt(i, dummy.matrix);

      // line draws itself from the dot outward (anchor → elbow → end)
      const g = cEaseOutCubic(cSeg(t, t0 + 0.15, 0.7));
      const l0 = it.a.distanceTo(e2);
      const l1 = e2.distanceTo(t2);
      const vis = g * (l0 + l1);
      writeSegment(i * 2, it.a, e2, Math.min(1, vis / l0));
      writeSegment(
        i * 2 + 1,
        e2,
        t2,
        Math.min(1, Math.max(0, (vis - l0) / l1)),
      );

      // text fades in and slides out a little
      const ta = cSeg(t, t0 + 0.55, 0.5);
      it.mat.opacity = cEaseOutCubic(ta);
      const slide = (1 - cEaseOutCubic(ta)) * 0.4;
      const padW = (CALLOUT_PAD_PX / CALLOUT_FONT_PX) * it.emUse;
      if (it.def.side === "L") {
        it.sprite.position.set(t2.x - CALLOUT_GAP + padW + slide, t2.y, t2.z);
      } else {
        it.sprite.position.set(t2.x + CALLOUT_GAP - padW - slide, t2.y, t2.z);
      }
    });
    lines.instanceMatrix.needsUpdate = true;
    dots.instanceMatrix.needsUpdate = true;
  };

  return { group, update, setLayout };
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
