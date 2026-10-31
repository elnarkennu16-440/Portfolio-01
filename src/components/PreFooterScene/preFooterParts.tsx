import * as THREE from "three";

/* ────────────────────────────────────────────────────────────────────────────
 * preFooterParts.ts — every object of the PreFooterBanner scene.
 *
 * Scene (based on the reference photo): a roadside billboard, a giant bottle that
 * tips out of the board and pours into the hatch of a long chrome tanker truck
 * parked right below it. Pure gray / black, same lighting language as HeroScene.
 *
 * Units are "metres". x = right, y = up, z = toward the camera.
 * The camera (see PreFooterScene.tsx) looks at the scene from the +z side.
 *
 * This file is fully self-contained (it imports nothing from HeroScene), so
 * changing the hero can never break the banner and vice versa.
 *
 * PERFORMANCE NOTES
 *   • repeated things are InstancedMeshes (tyres, hubs, bands, rungs, posts,
 *     trees, palm fronds, splash spikes / droplets);
 *   • only ~50 draw calls in total, nothing is allocated per frame;
 *   • all canvas textures are small (≤ 2048 px) and drawn once.
 * ──────────────────────────────────────────────────────────────────────────── */

export type Rand = () => number;
export type TexStore = THREE.Texture[];
/** [material, envMapIntensity] — the scene feeds these the PMREM environment. */
export type EnvUser = [THREE.MeshStandardMaterial, number];

const SANS = `"Helvetica Neue", Helvetica, Arial, sans-serif`;
const MONO = `ui-monospace, "SF Mono", Menlo, Consolas, monospace`;

/* ═══════════════════════════ TUNING (change freely) ═══════════════════════ */

/** The box the camera tries to fit on screen (centre + size, in metres). */
export const SCENE = { cx: 1.9, cy: 6.4, w: 18.8, h: 14.4 };

/** Billboard face: width, height, height of its centre above the ground. */
export const PANEL = { w: 13, h: 6.4, y: 8.6 };
const WALK_Y = 5.3; // catwalk height under the board

const BOTTLE_R = 1.6; // body radius of the giant bottle
export const BOTTLE = {
  z: 1.85, // depth: just in front of the board
  pivot: 2.8, // distance base → pivot (the body centre), along the bottle
  mouth: 6.9, // distance base → mouth
  angle: THREE.MathUtils.degToRad(124), // final "pouring" angle (z rotation)
  startAngle: THREE.MathUtils.degToRad(38), // where it starts before tipping over
};

/** Where the liquid leaves the bottle, and where it lands on the truck. */
export const MOUTH = new THREE.Vector3(0.55, 6.5, BOTTLE.z);
export const HATCH_TOP = 4.05;
const STREAM_DX = -0.54; // the stream bends a little toward -x while falling
export const HATCH_X = MOUTH.x + STREAM_DX;
const TRUCK_Z = BOTTLE.z;

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
  store: TexStore,
  canvas: HTMLCanvasElement,
  repeat = false,
  anisotropy = 8,
) => {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }
  store.push(tex);
  return tex;
};

const setSpacing = (ctx: CanvasRenderingContext2D, px: number) => {
  (ctx as unknown as { letterSpacing?: string }).letterSpacing = `${px}px`;
};

const box = (
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  shadow = false,
) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  return m;
};

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

/* ═══════════════════════════ TEXTURES ═════════════════════════════════════ */

function makeAsphalt(store: TexStore, rand: Rand, k = 1) {
  const S = 512;
  const { canvas, ctx } = makeCanvas(S, S);
  ctx.fillStyle = "#18181b";
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < Math.round(22000 * k); i++) {
    const v = 30 + Math.floor(rand() * 70);
    ctx.fillStyle = `rgba(${v},${v},${v + 3},${0.18 + rand() * 0.4})`;
    const size = rand() < 0.08 ? 2 : 1;
    ctx.fillRect(Math.floor(rand() * S), Math.floor(rand() * S), size, size);
  }
  for (let i = 0; i < 8; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const r = 40 + rand() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(0,0,0,${0.18 + rand() * 0.2})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return toTexture(store, canvas, true);
}

function makeHillTexture(store: TexStore, rand: Rand, k = 1) {
  const S = 512;
  const { canvas, ctx } = makeCanvas(S, S);
  ctx.fillStyle = "#2f3034";
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < Math.round(16000 * k); i++) {
    const v = 55 + Math.floor(rand() * 70);
    ctx.fillStyle = `rgba(${v},${v},${v + 4},${0.15 + rand() * 0.3})`;
    ctx.fillRect(rand() * S, rand() * S, 1 + rand() * 2, 1 + rand() * 2);
  }
  ctx.strokeStyle = "rgba(15,15,17,0.28)";
  for (let i = 0; i < 70; i++) {
    ctx.lineWidth = 1 + rand() * 2;
    ctx.beginPath();
    const x = rand() * S;
    const y = rand() * S;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 30, y + 8 + rand() * 26);
    ctx.stroke();
  }
  return toTexture(store, canvas, true);
}

function makePanelTexture(store: TexStore, small = false) {
  const W = 2048;
  const H = Math.round((W * PANEL.h) / PANEL.w);
  const sc = small ? 0.5 : 1; // phones get a half-size board texture (drawn scaled)
  const { canvas, ctx } = makeCanvas(Math.round(W * sc), Math.round(H * sc));
  ctx.scale(sc, sc);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#151517");
  g.addColorStop(1, "#0a0a0c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  for (let y = 0; y < H; y += 8) ctx.fillRect(0, y, W, 1);
  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.lineWidth = 3;
  ctx.strokeRect(34, 34, W - 68, H - 68);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(214,216,222,0.92)";
  ctx.font = `700 36px ${SANS}`;
  setSpacing(ctx, 3);
  ctx.fillText(
    "WE BUILD OUR WEB APPS CAREFULLY. PLEASE ENJOY THEM THAT WAY.",
    96,
    H - 124,
  );
  ctx.fillStyle = "rgba(214,216,222,0.42)";
  ctx.font = `500 21px ${MONO}`;
  setSpacing(ctx, 2);
  ctx.fillText("© 2026 KENNU ELNAR — QA ENGINEER & WEB DEVELOPER", 96, H - 82);
  return toTexture(store, canvas);
}

function makePlateTexture(store: TexStore) {
  const W = 512;
  const H = 150;
  const { canvas, ctx } = makeCanvas(W, H);
  ctx.fillStyle = "#d9dbe0";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#1b1c1f";
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, W - 12, H - 12);
  ctx.fillStyle = "#141416";
  ctx.font = `900 92px "Arial Black", Impact, ${SANS}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  setSpacing(ctx, 4);
  ctx.fillText("KENNU", W / 2, H / 2 + 6);
  return toTexture(store, canvas);
}

function makeChainTexture(store: TexStore) {
  const S = 64;
  const { canvas, ctx } = makeCanvas(S, S);
  ctx.clearRect(0, 0, S, S);
  ctx.strokeStyle = "#8a8d94";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(S / 2, -2);
  ctx.lineTo(S + 2, S / 2);
  ctx.lineTo(S / 2, S + 2);
  ctx.lineTo(-2, S / 2);
  ctx.closePath();
  ctx.stroke();
  return toTexture(store, canvas, true);
}

function makeGlowTexture(store: TexStore) {
  const S = 128;
  const { canvas, ctx } = makeCanvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.55)");
  g.addColorStop(0.5, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return toTexture(store, canvas, false, 1);
}

function makeLabelTexture(store: TexStore) {
  const W = 640;
  const H = 512;
  const { canvas, ctx } = makeCanvas(W, H);
  ctx.clearRect(0, 0, W, H);
  // paper with a scalloped top edge (alpha-tested on the material)
  ctx.fillStyle = "#dcdde1";
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, 46);
  const n = 14;
  const sw = W / n;
  for (let i = 0; i < n; i++)
    ctx.arc(sw * i + sw / 2, 46, sw / 2, Math.PI, 0, false);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#2a2b2f";
  ctx.lineWidth = 3;
  ctx.strokeRect(26, 92, W - 52, H - 128);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#4a4c52";
  ctx.font = `600 24px ${SANS}`;
  setSpacing(ctx, 5);
  ctx.fillText("ELNAR · EST. 2026", W / 2, 152);
  ctx.fillStyle = "#15161a";
  ctx.font = `800 128px Georgia, "Times New Roman", serif`;
  setSpacing(ctx, 2);
  ctx.fillText("KENNU", W / 2, 272);
  ctx.fillStyle = "#2a2b2f";
  ctx.fillRect(W / 2 - 150, 296, 300, 3);
  ctx.fillStyle = "#4a4c52";
  ctx.font = `600 25px ${SANS}`;
  setSpacing(ctx, 4);
  ctx.fillText("QUALITY ASSURANCE · WEB", W / 2, 340);
  // wax seal
  ctx.fillStyle = "#17181b";
  ctx.beginPath();
  ctx.arc(W / 2, 410, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d9dbe0";
  ctx.font = `700 40px ${SANS}`;
  setSpacing(ctx, 0);
  ctx.fillText("★", W / 2, 424);
  return toTexture(store, canvas);
}

function makeFlowTexture(store: TexStore) {
  const W = 256;
  const H = 64;
  const { canvas, ctx } = makeCanvas(W, H);
  ctx.fillStyle = "#c8cbd1";
  ctx.fillRect(0, 0, W, H);
  const bands = [
    [20, 14, 0.3, 255],
    [62, 22, 0.22, 90],
    [104, 10, 0.34, 255],
    [138, 26, 0.2, 90],
    [182, 12, 0.3, 255],
    [216, 20, 0.24, 90],
  ];
  for (const [x, w, a, v] of bands) {
    ctx.fillStyle = `rgba(${v},${v},${v},${a})`;
    ctx.fillRect(x, 0, w, H);
  }
  return toTexture(store, canvas, true);
}

/* ═══════════════════════ GROUND, HILL, TREES ══════════════════════════════ */

/** Height of the hillside behind the billboard. */
export const hillH = (x: number, z: number) => {
  const u = Math.min(1, Math.max(0, (-z - 6) / 52));
  const s = u * u * (3 - 2 * u);
  const noise =
    Math.sin(x * 0.21 + z * 0.13) * 1.5 +
    Math.sin(x * 0.07 - z * 0.19) * 2.2 +
    Math.sin(x * 0.52) * 0.35;
  return s * 30 + noise * s;
};

export function buildGround(store: TexStore, rand: Rand, small = false) {
  const group = new THREE.Group();

  const groundTex = makeAsphalt(store, rand, small ? 0.55 : 1);
  groundTex.repeat.set(70, 70);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 700),
    new THREE.MeshStandardMaterial({
      map: groundTex,
      color: 0xb4b4ba,
      roughness: 0.92,
      metalness: 0,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  // drawn last: everything nearer is already in the depth buffer (cheaper)
  ground.renderOrder = 10;
  group.add(ground);

  const hillTex = makeHillTexture(store, rand, small ? 0.55 : 1);
  hillTex.repeat.set(26, 10);
  const hillGeo = new THREE.PlaneGeometry(190, 80, 76, 32);
  hillGeo.rotateX(-Math.PI / 2);
  hillGeo.translate(0, 0, -46);
  const pos = hillGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, hillH(pos.getX(i), pos.getZ(i)));
  }
  hillGeo.computeVertexNormals();
  const hill = new THREE.Mesh(
    hillGeo,
    new THREE.MeshStandardMaterial({
      map: hillTex,
      color: 0xb0b0b6,
      roughness: 1,
      metalness: 0,
    }),
  );
  hill.receiveShadow = true;
  group.add(hill);

  // dark tree clumps on the slope (one draw call)
  const COUNT = 90;
  const trees = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 7, 5),
    new THREE.MeshStandardMaterial({ color: 0x1a1b1e, roughness: 1 }),
    COUNT,
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  for (let i = 0; i < COUNT; i++) {
    const z = -10 - rand() * 48;
    const x = (rand() - 0.5) * 110;
    const r = 1.6 + rand() * 3.2;
    p.set(x, hillH(x, z) + r * 0.55, z);
    s.set(r, r * (0.8 + rand() * 0.35), r);
    m.compose(p, q, s);
    trees.setMatrixAt(i, m);
  }
  group.add(trees);

  return { group };
}

/* ═══════════════════════════ BILLBOARD ════════════════════════════════════ */

export function buildBillboard(store: TexStore, small = false) {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({
    color: 0x1b1b1e,
    metalness: 0.8,
    roughness: 0.4,
  });
  const steel = new THREE.MeshStandardMaterial({
    color: 0x2a2b2f,
    metalness: 0.7,
    roughness: 0.5,
  });

  // board: frame + printed face
  const panelTex = makePanelTexture(store, small);
  const frame = box(
    PANEL.w + 0.3,
    PANEL.h + 0.3,
    0.3,
    metal,
    0,
    PANEL.y,
    0,
    true,
  );
  group.add(frame);
  const panelMat = new THREE.MeshStandardMaterial({
    map: panelTex,
    emissiveMap: panelTex,
    emissive: 0xffffff,
    emissiveIntensity: 0,
    color: 0x8a8a8a,
    roughness: 0.6,
  });
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(PANEL.w, PANEL.h),
    panelMat,
  );
  face.position.set(0, PANEL.y, 0.156);
  group.add(face);

  // pole + catwalk under the board
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.5, WALK_Y + 0.1, 14),
    steel,
  );
  pole.position.set(-4.6, (WALK_Y + 0.1) / 2, 0.55);
  pole.castShadow = true;
  group.add(pole);
  group.add(box(PANEL.w + 0.2, 0.28, 0.5, steel, 0, WALK_Y - 0.2, 0.55, true));
  group.add(box(PANEL.w + 0.4, 0.08, 1.3, metal, 0, WALK_Y, 0.82, true));
  group.add(box(PANEL.w + 0.4, 0.06, 0.06, metal, 0, 6.2, 1.45));
  group.add(box(PANEL.w + 0.4, 0.05, 0.05, metal, 0, 5.75, 1.45));

  const POSTS = 12;
  const posts = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.06, 0.88, 0.06),
    metal,
    POSTS,
  );
  const pm = new THREE.Matrix4();
  for (let i = 0; i < POSTS; i++) {
    const x = -PANEL.w / 2 + 0.3 + (i * (PANEL.w - 0.6)) / (POSTS - 1);
    posts.setMatrixAt(i, pm.makeTranslation(x, WALK_Y + 0.48, 1.45));
  }
  group.add(posts);

  // "KENNU" plate on the rail (like the small sign in the photo)
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.76),
    new THREE.MeshStandardMaterial({
      map: makePlateTexture(store),
      roughness: 0.6,
      emissive: 0x1a1a1c,
    }),
  );
  plate.position.set(-3.2, WALK_Y + 0.62, 1.54);
  group.add(plate);
  group.add(box(2.7, 0.86, 0.1, metal, -3.2, WALK_Y + 0.62, 1.48));

  // flood lamps along the catwalk, aimed at the board
  const LAMPS = 5;
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xf4f4f7 });
  const lamps = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.55, 0.22, 0.4),
    lampMat,
    LAMPS,
  );
  const lq = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.55, 0, 0));
  const lp = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  const glowMat = new THREE.SpriteMaterial({
    map: makeGlowTexture(store),
    color: 0xdfe3ea,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (let i = 0; i < LAMPS; i++) {
    const x = -5.2 + i * 2.6;
    lp.set(x, WALK_Y + 0.5, 1.2);
    lamps.setMatrixAt(i, pm.compose(lp, lq, one));
    const glow = new THREE.Sprite(glowMat);
    glow.position.set(x, WALK_Y + 0.62, 1.3);
    glow.scale.setScalar(3.2);
    group.add(glow);
  }
  group.add(lamps);

  const spot = new THREE.SpotLight(0xe8ebf0, 0, 40, 0.85, 0.75, 2);
  spot.position.set(0, WALK_Y + 0.7, 4.6);
  const target = new THREE.Object3D();
  target.position.set(0, PANEL.y - 0.4, 0.2);
  group.add(target);
  spot.target = target;
  group.add(spot);

  // a tiny worker on the catwalk, touching the bottle (scale gag from the photo)
  const worker = new THREE.Group();
  worker.position.set(5.25, WALK_Y + 0.04, 1.0);
  const vest = new THREE.MeshStandardMaterial({
    color: 0xc9cbd0,
    roughness: 0.8,
  });
  const pants = new THREE.MeshStandardMaterial({
    color: 0x2c2d31,
    roughness: 0.9,
  });
  const skin = new THREE.MeshStandardMaterial({
    color: 0x8d8f95,
    roughness: 0.8,
  });
  worker.add(
    box(0.17, 0.8, 0.18, pants, -0.12, 0.4, 0),
    box(0.17, 0.8, 0.18, pants, 0.12, 0.4, 0),
    box(0.5, 0.7, 0.28, vest, 0, 1.15, 0),
    box(0.12, 0.6, 0.12, vest, -0.31, 1.05, 0),
  );
  const armUp = box(0.12, 0.72, 0.12, vest, 0.34, 1.55, 0);
  armUp.rotation.z = -0.32;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), skin);
  head.position.set(0, 1.68, 0);
  worker.add(armUp, head);
  group.add(worker);

  return { group, panelMat, spot, glowMat };
}

/* ═══════════════════════════ GIANT BOTTLE ═════════════════════════════════ */

export function buildBottle(store: TexStore) {
  // rig  = fixed position (the body centre)
  // pivot = what the reveal rotates (the bottle tips over)
  // local = the bottle itself, base at its own origin, +y toward the mouth
  const rig = new THREE.Group();
  const pivot = new THREE.Group();
  const local = new THREE.Group();
  local.position.y = -BOTTLE.pivot;
  rig.add(pivot);
  pivot.add(local);

  const reach = BOTTLE.mouth - BOTTLE.pivot;
  rig.position.set(
    MOUTH.x + Math.sin(BOTTLE.angle) * reach,
    MOUTH.y - Math.cos(BOTTLE.angle) * reach,
    BOTTLE.z,
  );

  const v = (pts: number[][]) => pts.map(([r, y]) => new THREE.Vector2(r, y));

  // liquid inside (light gray, slightly self-lit so it reads on the dark scene)
  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0xc4c7cd,
    roughness: 0.25,
    metalness: 0.1,
    emissive: 0x4a4c52,
    emissiveIntensity: 0.6,
  });
  local.add(
    new THREE.Mesh(
      new THREE.LatheGeometry(
        v([
          [0, 0.1],
          [1.12, 0.1],
          [1.44, 0.22],
          [1.52, 0.55],
          [1.52, 3.25],
          [1.45, 3.7],
          [1.12, 4.24],
          [0.78, 4.72],
          [0.58, 5.15],
          [0.55, 5.7],
          [0.55, 6.3],
          [0, 6.3],
        ]),
        32,
      ),
      liquidMat,
    ),
  );

  // glass shell (smoked gray, translucent)
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x34363b,
    roughness: 0.08,
    metalness: 0.2,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
  });
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(
      v([
        [0, 0],
        [1.15, 0],
        [1.5, 0.12],
        [BOTTLE_R, 0.5],
        [BOTTLE_R, 3.3],
        [1.52, 3.78],
        [1.18, 4.32],
        [0.84, 4.8],
        [0.66, 5.2],
        [0.63, 5.7],
        [0.63, 6.3],
      ]),
      40,
    ),
    glassMat,
  );
  glass.castShadow = true;
  local.add(glass);

  // label (scalloped paper, faces +z so it always looks at the camera)
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(
      BOTTLE_R + 0.025,
      BOTTLE_R + 0.025,
      2.5,
      28,
      1,
      true,
      -0.95,
      1.9,
    ),
    new THREE.MeshStandardMaterial({
      map: makeLabelTexture(store),
      alphaTest: 0.5,
      roughness: 0.7,
      emissive: 0x202024,
    }),
  );
  label.position.y = 2.3;
  local.add(label);

  // black wax cap with drips + a metal lip at the mouth
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x0d0d0f,
    roughness: 0.22,
    metalness: 0.35,
  });
  local.add(
    new THREE.Mesh(
      new THREE.LatheGeometry(
        v([
          [0, 5.9],
          [0.8, 5.9],
          [0.85, 6.05],
          [0.82, 6.5],
          [0.74, 6.78],
          [0.7, 6.88],
          [0, 6.88],
        ]),
        28,
      ),
      capMat,
    ),
  );
  const lip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.72, 0.1, 24),
    new THREE.MeshStandardMaterial({
      color: 0x9a9ca3,
      metalness: 0.9,
      roughness: 0.3,
    }),
  );
  lip.position.y = 6.9;
  local.add(lip);

  const DRIPS = 9;
  const drips = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.15, 8, 6),
    capMat,
    DRIPS,
  );
  const dm = new THREE.Matrix4();
  const dq = new THREE.Quaternion();
  const dp = new THREE.Vector3();
  const ds = new THREE.Vector3();
  for (let i = 0; i < DRIPS; i++) {
    const a = (i / DRIPS) * Math.PI * 2 + 0.3;
    const len = 1.6 + (((i * 37) % 7) / 7) * 2;
    dp.set(Math.cos(a) * 0.82, 5.95 - len * 0.12, Math.sin(a) * 0.82);
    ds.set(0.85, len, 0.85);
    drips.setMatrixAt(i, dm.compose(dp, dq, ds));
  }
  local.add(drips);

  const envMats: EnvUser[] = [
    [glassMat, 1.3],
    [capMat, 0.9],
  ];
  return { rig, pivot, envMats };
}

/* ═══════════════════════════ TANKER TRUCK ═════════════════════════════════ */

export function buildTruck() {
  const group = new THREE.Group();
  // local x = 0 is the hatch, so the stream always lands exactly on it
  group.position.set(HATCH_X, 0, TRUCK_Z);

  const chrome = new THREE.MeshStandardMaterial({
    color: 0xc4c7ce,
    metalness: 1,
    roughness: 0.2,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x131315,
    roughness: 0.7,
    metalness: 0.3,
  });
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0x55575e,
    metalness: 0.9,
    roughness: 0.35,
  });
  const cabMat = new THREE.MeshStandardMaterial({
    color: 0xd2d4da,
    roughness: 0.42,
    metalness: 0.2,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x050506,
    metalness: 0.9,
    roughness: 0.08,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: 0x0c0c0e,
    roughness: 0.9,
  });
  const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // tank: a lathe around the x axis with domed ends (x from -3.2 to 6.1)
  const R = 1.3;
  const D = 0.55;
  const HALF = 4.1;
  const STEPS = 10;
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const a = (i / STEPS) * (Math.PI / 2);
    prof.push(new THREE.Vector2(R * Math.sin(a), -HALF - D * Math.cos(a)));
  }
  for (let i = STEPS; i >= 0; i--) {
    const a = (i / STEPS) * (Math.PI / 2);
    prof.push(new THREE.Vector2(R * Math.sin(a), HALF + D * Math.cos(a)));
  }
  const tank = new THREE.Mesh(new THREE.LatheGeometry(prof, 36), chrome);
  tank.rotation.z = Math.PI / 2;
  tank.position.set(1.45, 2.45, 0);
  tank.castShadow = true;
  tank.receiveShadow = true;
  group.add(tank);

  // dark bands around the tank
  const bandXs = [-2.6, -1.3, 1.3, 2.6, 3.9, 5.2];
  const bandGeo = new THREE.TorusGeometry(R + 0.02, 0.05, 6, 36);
  bandGeo.rotateY(Math.PI / 2);
  const bands = new THREE.InstancedMesh(bandGeo, bandMat, bandXs.length);
  const mm = new THREE.Matrix4();
  bandXs.forEach((x, i) =>
    bands.setMatrixAt(i, mm.makeTranslation(x, 2.45, 0)),
  );
  group.add(bands);

  // hatch collar where the liquid lands
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.52, 0.3, 18),
    dark,
  );
  collar.position.set(0, 3.85, 0);
  group.add(collar);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.05, 6, 22),
    chrome,
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, HATCH_TOP - 0.05, 0);
  group.add(rim);

  // ladder on the tank side
  group.add(
    box(0.05, 2.5, 0.05, bandMat, 4.75, 2.35, 1.4),
    box(0.05, 2.5, 0.05, bandMat, 5.2, 2.35, 1.4),
  );
  const RUNGS = 9;
  const rungs = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.45, 0.04, 0.04),
    bandMat,
    RUNGS,
  );
  for (let i = 0; i < RUNGS; i++) {
    rungs.setMatrixAt(i, mm.makeTranslation(4.975, 1.25 + i * 0.27, 1.42));
  }
  group.add(rungs);

  // chassis
  group.add(
    box(8.6, 0.3, 1.5, dark, 1.1, 1.0, 0, true),
    box(5.0, 0.3, 1.4, dark, 7.9, 0.95, 0, true),
  );

  // cab, hood, bumper, grille, window, roof deflector, exhaust, fuel tank, mirror
  group.add(
    box(1.95, 2.3, 2.35, cabMat, 7.45, 2.25, 0, true),
    box(1.9, 1.3, 2.1, cabMat, 9.35, 1.8, 0, true),
    box(0.25, 0.45, 2.35, chrome, 10.42, 0.95, 0),
    box(0.06, 0.9, 1.4, dark, 10.32, 1.75, 0),
    box(0.5, 0.7, 2.0, cabMat, 6.85, 3.75, 0, true),
    box(0.1, 0.5, 0.25, dark, 8.3, 2.8, 1.38),
  );
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8), glass);
  win.position.set(7.45, 2.9, 1.18);
  group.add(win);
  const stack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 2.3, 10),
    chrome,
  );
  stack.position.set(6.3, 2.75, 1.0);
  group.add(stack);
  const fuel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 1.5, 14),
    chrome,
  );
  fuel.rotation.z = Math.PI / 2;
  fuel.position.set(7.4, 0.85, 1.25);
  group.add(fuel);

  // headlights (ramped on during the reveal)
  const headGeo = new THREE.BoxGeometry(0.08, 0.25, 0.4);
  for (const sz of [-1, 1]) {
    const h = new THREE.Mesh(headGeo, headMat);
    h.position.set(10.31, 1.6, sz * 0.8);
    group.add(h);
  }

  // wheels: 10 tyres + 10 hubs in two draw calls
  const axles: Array<[number, number]> = [
    [-2.2, 0.95],
    [-1.0, 0.95],
    [6.1, 1.05],
    [7.3, 1.05],
    [9.5, 1.05],
  ];
  const tyreGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.34, 18);
  tyreGeo.rotateX(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.38, 10);
  hubGeo.rotateX(Math.PI / 2);
  const tyres = new THREE.InstancedMesh(tyreGeo, rubber, axles.length * 2);
  const hubs = new THREE.InstancedMesh(hubGeo, bandMat, axles.length * 2);
  let wi = 0;
  for (const [x, z] of axles) {
    for (const s of [-1, 1]) {
      mm.makeTranslation(x, 0.55, s * z);
      tyres.setMatrixAt(wi, mm);
      hubs.setMatrixAt(wi, mm);
      wi++;
    }
  }
  group.add(tyres, hubs);

  const envMats: EnvUser[] = [[chrome, 1.6]];
  return { group, headMat, envMats };
}

/* ═══════════════════════════ STREAM + SPLASH ══════════════════════════════ */

export function buildStream(store: TexStore) {
  const H = MOUTH.y - HATCH_TOP;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    pts.push(
      new THREE.Vector3(
        MOUTH.x + STREAM_DX * (1 - (1 - t) * (1 - t)),
        MOUTH.y - H * (0.35 * t + 0.65 * t * t),
        MOUTH.z,
      ),
    );
  }
  const SEGS = 28;
  const RAD = 10;
  const geo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pts),
    SEGS,
    0.28,
    RAD,
    false,
  );
  geo.setDrawRange(0, 0);
  const tex = makeFlowTexture(store);
  tex.repeat.set(4, 1);
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.14,
    metalness: 0.15,
    emissive: 0x2c2e33,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;

  /** 0 → 1: the stream grows from the mouth down to the hatch. */
  const setGrowth = (g: number) =>
    geo.setDrawRange(
      0,
      Math.floor(Math.min(1, Math.max(0, g)) * SEGS) * RAD * 6,
    );
  /** Scrolls the stripes downward so the liquid looks like it is moving. */
  const flow = (dt: number) => {
    tex.offset.x = (tex.offset.x - dt * 1.6) % 1;
  };
  return { mesh, setGrowth, flow };
}

export function buildSplash() {
  const group = new THREE.Group();
  group.position.set(HATCH_X, HATCH_TOP, TRUCK_Z);
  group.visible = false;

  const mat = new THREE.MeshStandardMaterial({
    color: 0xd4d7dd,
    roughness: 0.15,
    metalness: 0.15,
    emissive: 0x30323a,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.1, 8, 24), mat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.1;
  ring.scale.z = 0.8;
  const pool = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    mat,
  );
  pool.scale.y = 0.5;
  pool.position.y = 0.05;

  const SP = 11;
  const DROPS = 26;
  const spikeGeo = new THREE.ConeGeometry(0.075, 0.6, 6);
  spikeGeo.translate(0, 0.3, 0);
  const spikes = new THREE.InstancedMesh(spikeGeo, mat, SP);
  const tips = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.1, 8, 6),
    mat,
    SP,
  );
  const drops = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.06, 6, 5),
    mat,
    DROPS,
  );
  for (const im of [spikes, tips, drops]) {
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    im.frustumCulled = false;
  }
  group.add(ring, pool, spikes, tips, drops);

  const up = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const m4 = new THREE.Matrix4();

  /** time in seconds, k = 0 → 1 pop-in scale (0 hides the whole splash). */
  const update = (time: number, k: number) => {
    group.visible = k > 0.001;
    if (!group.visible) return;
    group.scale.setScalar(Math.max(0.001, k));

    for (let i = 0; i < SP; i++) {
      const a = (i / SP) * Math.PI * 2;
      const s = 0.8 + 0.3 * Math.sin(time * 6.5 + i * 1.9);
      dir.set(Math.cos(a) * 0.42, 0.91, Math.sin(a) * 0.42).normalize();
      pos.set(Math.cos(a) * 0.46, 0.1, Math.sin(a) * 0.46);
      q.setFromUnitVectors(up, dir);
      sc.set(1, s, 1);
      spikes.setMatrixAt(i, m4.compose(pos, q, sc));
      pos.addScaledVector(dir, 0.6 * s + 0.02);
      sc.set(1, 1, 1);
      tips.setMatrixAt(i, m4.compose(pos, q, sc));
    }
    q.identity();
    for (let i = 0; i < DROPS; i++) {
      const ph = (time * 0.9 + i / DROPS) % 1;
      const a = i * 2.399;
      const hv = 0.7 + (((i * 53) % 10) / 10) * 1.2;
      const vy = 2.4 + (((i * 31) % 10) / 10) * 1.8;
      const tt = ph * 0.6;
      const r = 0.4 + hv * tt;
      pos.set(Math.cos(a) * r, 0.15 + vy * tt - 4.9 * tt * tt, Math.sin(a) * r);
      sc.setScalar(1 - ph * 0.5);
      drops.setMatrixAt(i, m4.compose(pos, q, sc));
    }
    spikes.instanceMatrix.needsUpdate = true;
    tips.instanceMatrix.needsUpdate = true;
    drops.instanceMatrix.needsUpdate = true;
  };
  return { group, update };
}

/* ═══════════════════════════ PROPS: fence, palms, wires ═══════════════════ */

export function buildProps(store: TexStore, rand: Rand) {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({
    color: 0x2a2b2f,
    metalness: 0.7,
    roughness: 0.5,
  });
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();

  // chain-link fence in front of the truck
  const FZ = 8.5;
  const X0 = -26;
  const X1 = 30;
  const len = X1 - X0;
  const chain = makeChainTexture(store);
  chain.repeat.set(len / 0.8, 2.1 / 0.8);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(len, 2.1),
    new THREE.MeshStandardMaterial({
      map: chain,
      alphaTest: 0.4,
      side: THREE.DoubleSide,
      roughness: 0.6,
      metalness: 0.5,
      color: 0xb4b4ba,
    }),
  );
  mesh.position.set((X0 + X1) / 2, 1.3, FZ);
  group.add(mesh);
  group.add(box(len, 0.07, 0.07, metal, (X0 + X1) / 2, 2.38, FZ));
  group.add(box(len, 0.07, 0.07, metal, (X0 + X1) / 2, 0.22, FZ));
  const POSTS = Math.floor(len / 3) + 1;
  const posts = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.1, 2.4, 0.1),
    metal,
    POSTS,
  );
  for (let i = 0; i < POSTS; i++) {
    posts.setMatrixAt(i, m.makeTranslation(X0 + i * 3, 1.2, FZ));
  }
  group.add(posts);

  // two dark palms (trunks + 20 instanced fronds)
  const palmMat = new THREE.MeshStandardMaterial({
    color: 0x1b1c1f,
    roughness: 0.95,
  });
  const palms: Array<{ x: number; z: number; h: number; tilt: number }> = [
    { x: -10.5, z: 3.5, h: 7.6, tilt: 0.07 },
    { x: 13.8, z: -2.5, h: 8.6, tilt: -0.06 },
  ];
  const FR = 10;
  const frondGeo = new THREE.ConeGeometry(0.32, 3.4, 4, 1);
  frondGeo.translate(0, 1.7, 0);
  const fronds = new THREE.InstancedMesh(frondGeo, palmMat, FR * palms.length);
  const qy = new THREE.Quaternion();
  const qz = new THREE.Quaternion();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const zAxis = new THREE.Vector3(0, 0, 1);
  let fi = 0;
  for (const pl of palms) {
    const dx = Math.sin(pl.tilt);
    const dy = Math.cos(pl.tilt);
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.3, pl.h, 7),
      palmMat,
    );
    trunk.position.set(pl.x + (dx * pl.h) / 2, (dy * pl.h) / 2, pl.z);
    trunk.rotation.z = -pl.tilt;
    trunk.castShadow = true;
    group.add(trunk);
    const top = new THREE.Vector3(pl.x + dx * pl.h, dy * pl.h, pl.z);
    for (let i = 0; i < FR; i++) {
      qy.setFromAxisAngle(yAxis, (i / FR) * Math.PI * 2 + rand() * 0.3);
      qz.setFromAxisAngle(zAxis, -(0.95 + rand() * 0.5));
      q.copy(qy).multiply(qz);
      s.set(1, 0.85 + rand() * 0.4, 0.14);
      fronds.setMatrixAt(fi++, m.compose(top, q, s));
    }
  }
  group.add(fronds);

  // utility pole + three sagging wires crossing the top of the frame
  const PX = -9.2;
  const PZ = -5;
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.26, 14, 8),
    palmMat,
  );
  pole.position.set(PX, 7, PZ);
  group.add(pole);
  group.add(box(3.4, 0.18, 0.18, palmMat, PX, 13.2, PZ));
  const wireMat = new THREE.LineBasicMaterial({ color: 0x5a5c62 });
  for (let i = 0; i < 3; i++) {
    const sx = PX - 1.4 + i * 1.4;
    const y0 = 13.3;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx, y0, PZ),
      new THREE.Vector3(sx + 24, y0 - 1.5 - i * 0.2, PZ - 0.5 + i * 0.4),
      new THREE.Vector3(sx + 52, y0 - 0.2, PZ - 1 + i * 0.8),
    ]);
    const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
    group.add(new THREE.Line(g, wireMat));
  }

  return { group };
}
