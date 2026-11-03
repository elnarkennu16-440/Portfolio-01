import * as THREE from "three";
import { HATCH_TOP, HATCH_X, MOUTH, BOTTLE } from "./preFooterParts";

/* ────────────────────────────────────────────────────────────────────────────
 * preFooterTools.ts — the "tool rain": 3D tool tiles pour out of the bottle's
 * neck, tumble down and drop into the tanker's hatch (instead of liquid).
 *
 * THE TILES
 *   Each tile is a small dark slab (rounded, bevelled, 3D) with the tool's icon
 *   on its faces, like the tiles in the Capabilities section.
 *
 * WHERE THE ICONS COME FROM
 *   The icons are taken from the Capabilities section that is already on the
 *   page: for every tool name below, the code looks for the label with that
 *   text in #capabilities and copies the icon (<img> or inline <svg>) that sits
 *   next to it, as a white icon. So they are the SAME icons as in Capabilities,
 *   without importing any asset. If one cannot be found it shows a short
 *   monogram instead. To force a specific file for a tool, set its `src`.
 *   Open the site with ?debug3d=1 to see in the console how many were found.
 *
 * PERFORMANCE
 *   Only 7 tile meshes exist (a pool). They are re-used for the whole list,
 *   one at a time, staggered; nothing is allocated per frame, the tiles are
 *   not part of the (frozen) shadow pass, and each icon is a small texture
 *   (192 px, 128 px on phones) that is uploaded when it is first needed.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface ToolDef {
  name: string; // must match the label text used in the Capabilities section
  mono: string; // fallback letters, if the icon cannot be found
  src?: string; // optional: force an image file for this tool
}

/* All tools of the Capabilities section (Vercel appears there twice: listed once). */
export const TOOLS: ToolDef[] = [
  { name: "React", mono: "Re" },
  { name: "Vue.js", mono: "Vu" },
  { name: "Tailwind CSS", mono: "Tw" },
  { name: "Next.js", mono: "Nx" },
  { name: "TypeScript", mono: "TS" },
  { name: "JavaScript", mono: "JS" },
  { name: "Node.js", mono: "No" },
  { name: "Express.js", mono: "Ex" },
  { name: "PHP", mono: "php" },
  { name: "Laravel", mono: "La" },
  { name: "MySQL", mono: "My" },
  { name: "Supabase", mono: "Su" },
  { name: "Firebase", mono: "Fb" },
  { name: "MongoDB", mono: "Mg" },
  { name: "Asana", mono: "As" },
  { name: "Jira", mono: "Ji" },
  { name: "Chrome DevTools", mono: "Dt" },
  { name: "Postman", mono: "Pm" },
  { name: "Gemini", mono: "Ge" },
  { name: "Claude", mono: "Cl" },
  { name: "Manus", mono: "Ma" },
  { name: "Perplexity", mono: "Px" },
  { name: "JWT", mono: "JWT" },
  { name: "GitGuardian", mono: "GG" },
  { name: "Dependabot", mono: "Db" },
  { name: "OWASP ZAP", mono: "ZAP" },
  { name: "Git / GitHub", mono: "Git" },
  { name: "Vercel", mono: "Ve" },
  { name: "Notion", mono: "Nt" },
  { name: "VS Code", mono: "VS" },
  { name: "Vite", mono: "Vi" },
  { name: "npm", mono: "npm" },
  { name: "Cline", mono: "Ci" },
  { name: "Antigravity", mono: "Ag" },
  { name: "Hostinger", mono: "Ho" },
  { name: "Cloudflare", mono: "Cf" },
  { name: "Flutter", mono: "Fl" },
  { name: "React Native", mono: "RN" },
];

/* ═══════════════════════════ TUNING ═══════════════════════════════════════ */
const TILE = 1.15; // tile size in metres
const DEPTH = 0.18; // slab thickness (without the bevel)
const BEVEL = 0.035;
const POOL = 7; // tile meshes that exist at the same time
const GAP = 0.36; // seconds between two tiles leaving the bottle (staggered, not all at once)
const FALL = 1.5; // seconds from the neck to the hatch
const SINK = 0.28; // extra fraction of FALL spent sinking into the hatch
/** Reveal time (s) when the first tile leaves the bottle (the bottle has tipped by then). */
export const TOOLS_START_T = 1.5;

const SANS = `"Helvetica Neue", Helvetica, Arial, sans-serif`;

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

const DEBUG = (() => {
  try {
    return (
      /[?&]debug3d(=|&|$)/.test(window.location.search) ||
      window.localStorage.getItem("debug3d") === "1"
    );
  } catch {
    return false;
  }
})();

/* ═══════════════════════════ ICON SOURCES ═════════════════════════════════ */

const normalize = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/** Finds, in the Capabilities section, the icon element that sits next to each tool label. */
function scanCapabilities(): Map<string, Element> {
  const found = new Map<string, Element>();
  const root =
    document.getElementById("capabilities") ??
    document.querySelector("[data-section='capabilities']") ??
    document.body;
  const wanted = new Set(TOOLS.map((t) => normalize(t.name)));
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    const key = normalize(node.nodeValue ?? "");
    if (wanted.has(key) && !found.has(key)) {
      // the smallest ancestor that contains exactly one icon = this tool's tile
      let el: Element | null = node.parentElement;
      for (let up = 0; el && up < 5; up++, el = el.parentElement) {
        const icons = el.querySelectorAll("img, svg");
        if (icons.length === 1) {
          found.set(key, icons[0]);
          break;
        }
        if (icons.length > 1) break;
      }
    }
    node = walker.nextNode();
  }
  return found;
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    const timer = window.setTimeout(() => resolve(null), 5000);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    img.decoding = "async";
    if (/^https?:/i.test(src) && !src.startsWith(window.location.origin)) {
      img.crossOrigin = "anonymous";
    }
    img.src = src;
  });

const svgToDataUrl = (svg: SVGElement) => {
  const clone = svg.cloneNode(true) as SVGElement;
  const box = svg.getBoundingClientRect();
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (!clone.getAttribute("viewBox")) {
    clone.setAttribute("viewBox", `0 0 ${box.width || 24} ${box.height || 24}`);
  }
  clone.setAttribute("width", "256");
  clone.setAttribute("height", "256");
  const color = getComputedStyle(svg).color || "#ffffff";
  const xml = new XMLSerializer()
    .serializeToString(clone)
    .replace(/currentColor/g, color);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
};

/** The CSS filter the page applies to an icon (e.g. "brightness(0) invert(1)"), if any. */
const pageFilter = (el: Element) => {
  const own = getComputedStyle(el).filter;
  if (own && own !== "none") return own;
  const parent = el.parentElement
    ? getComputedStyle(el.parentElement).filter
    : "none";
  return parent && parent !== "none" ? parent : "none";
};

/** Draws one icon into a 256 px canvas as a white icon on transparency (or null). */
async function makeIconCanvas(
  tool: ToolDef,
  el: Element | undefined,
): Promise<HTMLCanvasElement | null> {
  let src: string | null = tool.src ?? null;
  let filter = "none";
  if (!src && el) {
    if (el instanceof HTMLImageElement) src = el.currentSrc || el.src;
    else if (el instanceof SVGElement) src = svgToDataUrl(el);
    filter = pageFilter(el);
  }
  if (!src) return null;
  const img = await loadImage(src);
  if (!img) return null;

  const S = 256;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const iw = img.naturalWidth || img.width || S;
  const ih = img.naturalHeight || img.height || S;
  const k = Math.min(S / iw, S / ih);
  if (filter !== "none") ctx.filter = filter;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, (S - iw * k) / 2, (S - ih * k) / 2, iw * k, ih * k);
  ctx.filter = "none";

  // is there really an icon, and is it light enough to show on the dark tile?
  const data = ctx.getImageData(0, 0, S, S).data; // throws if the image taints the canvas
  let opaque = 0;
  let lum = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 40) {
      opaque++;
      lum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    }
  }
  if (opaque < S * S * 0.015) return null;
  if (lum / opaque / 255 < 0.5) {
    // a dark icon would vanish on the dark tile: print it as a white silhouette
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, S, S);
    ctx.globalCompositeOperation = "source-over";
  }
  return c;
}

/* ═══════════════════════════ THE TILES ════════════════════════════════════ */

function makeTileGeometry() {
  const h = TILE / 2;
  const r = 0.17;
  const shape = new THREE.Shape();
  shape.moveTo(-h + r, -h);
  shape.lineTo(h - r, -h);
  shape.quadraticCurveTo(h, -h, h, -h + r);
  shape.lineTo(h, h - r);
  shape.quadraticCurveTo(h, h, h - r, h);
  shape.lineTo(-h + r, h);
  shape.quadraticCurveTo(-h, h, -h, h - r);
  shape.lineTo(-h, -h + r);
  shape.quadraticCurveTo(-h, -h, -h + r, -h);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 2,
    curveSegments: 6,
  });
  geo.translate(0, 0, -DEPTH / 2);
  geo.rotateX(-Math.PI / 2); // the big faces now look up / down
  return geo;
}

export interface ToolRain {
  group: THREE.Group;
  /** t = seconds since the reveal started */
  update: (t: number) => void;
  /** shows every tile once (invisible) so shaders compile / buffers upload early */
  warm: (on: boolean) => void;
  /** copies the icons from the Capabilities section (runs in the background) */
  loadIcons: () => Promise<void>;
  /** uploads the textures of the first tiles to the GPU right away */
  prime: (init: (tex: THREE.Texture) => void, count: number) => void;
  dispose: () => void;
}

export function buildToolRain(small: boolean): ToolRain {
  const group = new THREE.Group();
  let alive = true;

  /* one small texture per tool: dark slab + white icon (monogram until the icon is found) */
  const FACE = small ? 128 : 192;
  const faces = TOOLS.map((tool) => {
    const canvas = document.createElement("canvas");
    canvas.width = FACE;
    canvas.height = FACE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas is not available");
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    // the extruded cap's uv are its shape coordinates: map them onto 0..1
    tex.repeat.set(1 / TILE, 1 / TILE);
    tex.offset.set(0.5, 0.5);
    return { canvas, ctx, tex, tool };
  });

  const paintFace = (i: number, icon: HTMLCanvasElement | null) => {
    const { ctx, tex, tool } = faces[i];
    const s = FACE;
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, "#3b3d43");
    g.addColorStop(1, "#1b1c1f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = Math.max(2, s * 0.014);
    ctx.strokeRect(s * 0.06, s * 0.06, s * 0.88, s * 0.88);
    if (icon) {
      const k = s * 0.58;
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = s * 0.04;
      ctx.shadowOffsetY = s * 0.015;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(icon, (s - k) / 2, (s - k) / 2, k, k);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${s * (tool.mono.length > 2 ? 0.24 : 0.32)}px ${SANS}`;
      ctx.fillText(tool.mono, s / 2, s / 2 + s * 0.015);
    }
    tex.needsUpdate = true;
  };
  faces.forEach((_, i) => paintFace(i, null));

  /* the order they pour in: a fixed shuffle, every tool once before any repeats */
  const order = TOOLS.map((_, i) => i).sort(
    (a, b) => hash(a + 1) - hash(b + 1),
  );

  /* the pool */
  const geo = makeTileGeometry();
  const sideMat = new THREE.MeshStandardMaterial({
    color: 0x2a2b2f,
    metalness: 0.55,
    roughness: 0.38,
  });
  interface Slot {
    mesh: THREE.Mesh;
    mat: THREE.MeshStandardMaterial;
    n: number; // which tile of the sequence this mesh is showing
  }
  const slots: Slot[] = [];
  for (let j = 0; j < POOL; j++) {
    const first = faces[order[j % order.length]].tex;
    const mat = new THREE.MeshStandardMaterial({
      map: first,
      emissiveMap: first,
      emissive: 0xffffff,
      emissiveIntensity: 0.5, // the white icon glows a little, the dark slab stays dark
      roughness: 0.5,
      metalness: 0.15,
    });
    const mesh = new THREE.Mesh(geo, [mat, sideMat]);
    mesh.visible = false;
    mesh.frustumCulled = false;
    group.add(mesh);
    slots.push({ mesh, mat, n: -1 });
  }

  /* path: the same curve the liquid used to take, from the neck to the hatch */
  const dx = HATCH_X - MOUTH.x;
  const drop = MOUTH.y - HATCH_TOP;
  const qSpin = new THREE.Quaternion();
  const qTilt = new THREE.Quaternion();
  const qRoll = new THREE.Quaternion();
  const AX_X = new THREE.Vector3(1, 0, 0);
  const AX_Y = new THREE.Vector3(0, 1, 0);

  const update = (t: number) => {
    const T = t - TOOLS_START_T;
    for (let j = 0; j < POOL; j++) {
      const slot = slots[j];
      const mesh = slot.mesh;
      if (T < 0) {
        mesh.visible = false;
        continue;
      }
      // the latest tile of this mesh that has already left the bottle
      const m = Math.floor((T - j * GAP) / (POOL * GAP));
      const n = j + POOL * m;
      if (n < 0) {
        mesh.visible = false;
        continue;
      }
      const ts = n * GAP + (hash(n) - 0.5) * 0.12; // a little jitter: never a regular beat
      const tau = (T - ts) / FALL;
      if (tau < 0 || tau > 1 + SINK) {
        mesh.visible = false;
        continue;
      }
      if (slot.n !== n) {
        slot.n = n;
        const tex = faces[order[n % order.length]].tex;
        slot.mat.map = tex;
        slot.mat.emissiveMap = tex;
      }

      let p: number;
      let sink = 0;
      if (tau <= 1)
        p = Math.pow(tau, 1.5); // slides out of the neck, then falls faster
      else {
        p = 1;
        sink = (tau - 1) / SINK; // drops into the hatch
      }
      const wob = Math.sin(tau * 5 + n) * 0.06;
      mesh.position.set(
        MOUTH.x + dx * (1 - (1 - p) * (1 - p)) + wob,
        MOUTH.y - drop * (0.35 * p + 0.65 * p * p) - sink * 0.9,
        BOTTLE.z + Math.cos(tau * 4 + n * 2) * 0.05,
      );

      // it grows out of the neck, and shrinks as it sinks into the hatch
      const emerge = 0.35 + 0.65 * easeOutCubic(Math.min(1, tau / 0.22));
      mesh.scale.setScalar(emerge * (1 - 0.5 * sink));

      // tumbling: tilted toward the camera, turning a little so the icon stays readable
      const tilt = 0.95 + (hash(n + 3) - 0.5) * 0.35;
      const spin =
        (hash(n + 7) - 0.5) * 3.0 * (Math.min(tau, 1) - 0.5) +
        (hash(n + 11) - 0.5) * 0.4;
      const roll = (hash(n + 13) - 0.5) * 0.6 * Math.min(tau, 1);
      qSpin.setFromAxisAngle(AX_Y, spin);
      qTilt.setFromAxisAngle(AX_X, tilt);
      qRoll.setFromAxisAngle(AX_Y, roll);
      mesh.quaternion.copy(qSpin).multiply(qTilt).multiply(qRoll);
      mesh.visible = true;
    }
  };

  const warm = (on: boolean) => {
    for (const slot of slots) {
      slot.mesh.visible = on;
      slot.mesh.position.set(MOUTH.x, MOUTH.y, BOTTLE.z);
      slot.mesh.scale.setScalar(1);
      slot.mesh.quaternion.set(0, 0, 0, 1);
    }
  };

  const loadIcons = async () => {
    let real = 0;
    const found = scanCapabilities();
    for (let k = 0; k < order.length; k++) {
      if (!alive) return;
      const i = order[k];
      const tool = TOOLS[i];
      try {
        const icon = await makeIconCanvas(
          tool,
          found.get(normalize(tool.name)),
        );
        if (!alive) return;
        if (icon) {
          paintFace(i, icon);
          real++;
        }
      } catch {
        /* keep the monogram for this tool */
      }
      if (k % 3 === 2) await new Promise<void>((r) => window.setTimeout(r, 0));
    }
    if (DEBUG) {
      console.log(
        `[prefooter tools] icons copied from the page: ${real} / ${TOOLS.length}` +
          (real < TOOLS.length ? " (the others show a monogram)" : ""),
      );
    }
  };

  const prime = (init: (tex: THREE.Texture) => void, count: number) => {
    for (let k = 0; k < Math.min(count, order.length); k++)
      init(faces[order[k]].tex);
  };

  const dispose = () => {
    alive = false;
    faces.forEach((f) => f.tex.dispose());
    geo.dispose();
  };

  return { group, update, warm, loadIcons, prime, dispose };
}
