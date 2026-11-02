/* ────────────────────────────────────────────────────────────────────────────
 * TEXTURES — drawn ONCE on small canvases while the loader is running, then
 * used as plain images (blob: URLs). The browser only has to move ready-made
 * bitmaps around while the scene animates, which is what keeps it smooth.
 *
 * (Before, the walls/road used live SVG filters, glows and blurs that were
 *  re-drawn every frame. That was the cause of the lag.)
 * ──────────────────────────────────────────────────────────────────────────── */

import { BUILDINGS, ROAD } from "./sceneConfig";

/** small deterministic random generator, so the windows never change between loads */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mk = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

/** let the browser breathe between heavy steps (keeps the loader animation smooth) */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

/** add random brightness grain to a canvas (asphalt / concrete speckle) */
function grain(c: HTMLCanvasElement, amount: number, seed: number) {
  const g = c.getContext("2d")!;
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const r = rng(seed);
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amount;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
}

function blob(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rgba: string,
) {
  g.save();
  g.translate(x, y);
  g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  gr.addColorStop(0, rgba);
  gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr;
  g.beginPath();
  g.arc(0, 0, rx, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** light streak for traffic (head at the bottom for cars coming toward you) */
function streakTile(head: "down" | "up", strength: number): HTMLCanvasElement {
  const W = 40;
  const H = 256;
  const c = mk(W, H);
  const g = c.getContext("2d")!;
  const img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    const t = head === "down" ? y / (H - 1) : 1 - y / (H - 1);
    const along = Math.pow(t, 1.7);
    for (let x = 0; x < W; x++) {
      const dx = (x - (W - 1) / 2) / 3.2;
      const core = Math.exp(-dx * dx);
      const glow = Math.exp(-(dx * dx) / 14) * 0.38;
      const a = Math.min(1, (core + glow) * along * strength);
      const i = (y * W + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = (a * 255) | 0;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/* ── ground (grid + soft pools of light) ────────────────────────────────── */
export const GROUND = { x0: -1100, x1: 1100, y0: -2700, y1: 900 };

function groundCanvas(d: number): HTMLCanvasElement {
  const W = (GROUND.x1 - GROUND.x0) * d;
  const H = (GROUND.y1 - GROUND.y0) * d;
  const c = mk(W, H);
  const g = c.getContext("2d")!;
  g.fillStyle = "#0c0c0e";
  g.fillRect(0, 0, W, H);
  blob(
    g,
    (0 - GROUND.x0) * d,
    (150 - GROUND.y0) * d,
    900 * d,
    1300 * d,
    "rgba(60,60,66,0.5)",
  );
  g.strokeStyle = "rgba(255,255,255,0.07)";
  g.lineWidth = Math.max(1, 1.4 * d);
  g.beginPath();
  for (let x = Math.ceil(GROUND.x0 / 120) * 120; x <= GROUND.x1; x += 120) {
    g.moveTo((x - GROUND.x0) * d, 0);
    g.lineTo((x - GROUND.x0) * d, H);
  }
  for (let y = Math.ceil(GROUND.y0 / 120) * 120; y <= GROUND.y1; y += 120) {
    g.moveTo(0, (y - GROUND.y0) * d);
    g.lineTo(W, (y - GROUND.y0) * d);
  }
  g.stroke();
  grain(c, 6, 2);
  return c;
}

/* ── street: sidewalks + asphalt + all markings, in ONE image ───────────── */
export const STREET = { x0: -250, x1: 250 }; // sidewalk to sidewalk

function streetCanvas(
  y0: number,
  y1: number,
  d: number,
  seed: number,
): HTMLCanvasElement {
  const W = (STREET.x1 - STREET.x0) * d;
  const H = (y1 - y0) * d;
  const c = mk(W, H);
  const g = c.getContext("2d")!;
  const X = (x: number) => (x - STREET.x0) * d;
  const Y = (y: number) => (y - y0) * d;
  const r = rng(seed);
  const hw = ROAD.halfWidth;

  // sidewalks, then asphalt
  g.fillStyle = "#2a2a2d";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#18181b";
  g.fillRect(X(-hw), 0, hw * 2 * d, H);

  // worn tyre tracks in both lanes
  for (const lane of [-85, 85]) {
    for (const off of [-30, 30]) {
      const gr = g.createLinearGradient(
        X(lane + off - 16),
        0,
        X(lane + off + 16),
        0,
      );
      gr.addColorStop(0, "rgba(255,255,255,0)");
      gr.addColorStop(0.5, "rgba(255,255,255,0.045)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(X(lane + off - 16), 0, 32 * d, H);
    }
  }

  // kerb: dark gap + light edge
  for (const side of [-1, 1]) {
    g.fillStyle = "rgba(0,0,0,0.55)";
    g.fillRect(X(side * hw) - (side > 0 ? 0 : 6 * d), 0, 6 * d, H);
    g.fillStyle = "rgba(255,255,255,0.22)";
    g.fillRect(X(side * (hw + 6)) - (side > 0 ? 0 : 2 * d), 0, 2 * d, H);
  }

  // paving joints on the sidewalks
  g.fillStyle = "rgba(0,0,0,0.35)";
  for (let y = Math.ceil(y0 / 60) * 60; y < y1; y += 60) {
    g.fillRect(0, Y(y), X(-hw - 8), Math.max(1, d));
    g.fillRect(X(hw + 8), Y(y), W - X(hw + 8), Math.max(1, d));
  }

  // road markings
  g.fillStyle = "rgba(255,255,255,0.36)";
  g.fillRect(X(-148), 0, 3 * d, H);
  g.fillRect(X(145), 0, 3 * d, H);
  g.fillStyle = "rgba(255,255,255,0.74)";
  for (let y = Math.floor(y0 / 150) * 150; y < y1; y += 150)
    g.fillRect(X(-3), Y(y), 6 * d, 66 * d);

  // zebra crossing
  if (ROAD.crosswalkY + ROAD.crosswalkLen > y0 && ROAD.crosswalkY < y1) {
    g.fillStyle = "rgba(255,255,255,0.62)";
    for (let x = -hw + 34; x < hw - 34 - 20; x += 42)
      g.fillRect(X(x), Y(ROAD.crosswalkY), 20 * d, ROAD.crosswalkLen * d);
  }

  // oil stains + patches
  for (let i = 0; i < 18; i++) {
    blob(
      g,
      X(-hw + r() * hw * 2),
      r() * H,
      (14 + r() * 40) * d,
      (30 + r() * 90) * d,
      `rgba(0,0,0,${0.18 + r() * 0.2})`,
    );
  }

  grain(c, 17, seed + 1);
  return c;
}

/* ── wall of a building: concrete, window recesses, lit windows, shading ── */
const CELL_W = 30;
const CELL_H = 42;

function facadeCanvas(
  wU: number,
  hU: number,
  seed: number,
  lit: number,
  base: number,
  d: number,
): HTMLCanvasElement {
  const cols = Math.max(2, Math.round(wU / CELL_W));
  const rows = Math.max(2, Math.round(hU / CELL_H));
  const cw = (wU * d) / cols;
  const ch = (hU * d) / rows;
  const c = mk(wU * d, hU * d);
  const g = c.getContext("2d")!;
  const r = rng(seed);

  // concrete: lighter at the top, darker at the base
  const bg = g.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, `rgb(${base + 10},${base + 10},${base + 12})`);
  bg.addColorStop(1, `rgb(${base - 22},${base - 22},${base - 20})`);
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);

  for (let row = 0; row < rows; row++) {
    // floor slab (brutalist horizontal band)
    g.fillStyle = "rgba(0,0,0,0.34)";
    g.fillRect(0, (row + 1) * ch - 4 * d, c.width, 4 * d);
    g.fillStyle = "rgba(255,255,255,0.07)";
    g.fillRect(
      0,
      (row + 1) * ch - 4 * d - Math.max(1, d),
      c.width,
      Math.max(1, d),
    );

    for (let col = 0; col < cols; col++) {
      const x = col * cw + 7 * d;
      const y = row * ch + 10 * d;
      const w = cw - 14 * d;
      const h = ch - 22 * d;

      // recessed opening
      const wg = g.createLinearGradient(0, y, 0, y + h);
      wg.addColorStop(0, "#1f1f22");
      wg.addColorStop(1, "#050506");
      g.fillStyle = wg;
      g.fillRect(x, y, w, h);
      g.fillStyle = "rgba(0,0,0,0.7)"; // shadow under the lintel
      g.fillRect(x, y, w, Math.max(1, 2.5 * d));
      g.fillStyle = "rgba(255,255,255,0.2)"; // sill catching the light
      g.fillRect(x - d, y + h, w + 2 * d, Math.max(1, 1.6 * d));

      const v = r();
      if (v < lit) {
        const bright = v < lit * 0.5;
        g.save();
        g.shadowColor = "rgba(255,255,255,0.55)";
        g.shadowBlur = 7 * d;
        const lg = g.createLinearGradient(0, y, 0, y + h);
        lg.addColorStop(0, bright ? "#f6f6f6" : "#c4c4c8");
        lg.addColorStop(1, bright ? "#bdbdc1" : "#85858a");
        g.fillStyle = lg;
        g.fillRect(x + d, y + d, w - 2 * d, h - 2 * d);
        g.restore();
      }
    }
  }

  // baked lighting: dark at the base (ambient occlusion), light from above, dark corner
  const ao = g.createLinearGradient(0, 0, 0, c.height);
  ao.addColorStop(0, "rgba(255,255,255,0.09)");
  ao.addColorStop(0.3, "rgba(0,0,0,0)");
  ao.addColorStop(1, "rgba(0,0,0,0.58)");
  g.fillStyle = ao;
  g.fillRect(0, 0, c.width, c.height);
  const side = g.createLinearGradient(0, 0, c.width, 0);
  side.addColorStop(0, "rgba(0,0,0,0.34)");
  side.addColorStop(0.22, "rgba(0,0,0,0)");
  g.fillStyle = side;
  g.fillRect(0, 0, c.width, c.height);

  // weathering streaks + concrete grain
  for (let i = 0; i < 14; i++) {
    blob(
      g,
      r() * c.width,
      r() * c.height,
      (20 + r() * 70) * d,
      (40 + r() * 140) * d,
      `rgba(0,0,0,${0.05 + r() * 0.08})`,
    );
  }
  grain(c, 13, seed + 7);
  return c;
}

/* ── small shared canvases ──────────────────────────────────────────────── */
function radialTile(kind: "ao" | "glow"): HTMLCanvasElement {
  const c = mk(128, 128);
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  if (kind === "ao") {
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.58, "rgba(255,255,255,1)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
  } else {
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.38, "rgba(255,255,255,0.35)");
    gr.addColorStop(0.7, "rgba(255,255,255,0)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
  }
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return c;
}

/** rooftop concrete (tinted per building by the shader) */
function topTile(): HTMLCanvasElement {
  const S = 256;
  const c = mk(S, S);
  const g = c.getContext("2d")!;
  g.fillStyle = "rgb(160,160,160)";
  g.fillRect(0, 0, S, S);
  const r = rng(77);
  for (let i = 0; i < 26; i++) {
    const x = r() * S;
    const y = r() * S;
    const rx = 20 + r() * 70;
    const col =
      r() > 0.3
        ? `rgba(0,0,0,${0.08 + r() * 0.14})`
        : `rgba(255,255,255,${0.04 + r() * 0.05})`;
    for (const ox of [-S, 0, S])
      for (const oy of [-S, 0, S])
        blob(g, x + ox, y + oy, rx, rx * (0.5 + r() * 0.7), col);
  }
  grain(c, 30, 78);
  return c;
}

/** the fonts are loaded from Google Fonts; wait a moment for them, never block */
async function fontReady() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('800 56px "Archivo"'),
        document.fonts.load('500 26px "Archivo"'),
      ]),
      new Promise((r) => setTimeout(r, 2200)),
    ]);
  } catch {
    /* fall back to the system font */
  }
}

const FONT = '"Archivo", "Helvetica Neue", Arial, sans-serif';

/** billboard: the board itself (no text) and the text layer (transparent) */
function boardCanvases(len: number, h: number, s: number) {
  const W = len * s;
  const H = h * s;
  const base = mk(W, H);
  const g = base.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#101012");
  bg.addColorStop(1, "#060607");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.save();
  g.translate(W / 2, -0.12 * H);
  g.scale(1, 0.55 / 0.8);
  const cone = g.createRadialGradient(0, 0, 0, 0, 0, W * 0.4);
  cone.addColorStop(0, "rgba(255,255,255,0.22)");
  cone.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = cone;
  g.fillRect(-W, -H, W * 2, H * 3);
  g.restore();
  g.strokeStyle = "#212124";
  g.lineWidth = 18 * s;
  g.strokeRect(9 * s, 9 * s, W - 18 * s, H - 18 * s);
  grain(base, 9, 91);

  const text = mk(W, H);
  const t = text.getContext("2d") as CanvasRenderingContext2D & {
    letterSpacing?: string;
    fontStretch?: string;
  };
  const lines: [string, boolean, number][] = [
    ["Software quality", true, 1],
    ["User flows", false, 0.58],
    ["Dependable web", true, 1],
    ["applications", true, 1],
  ];
  const labelSize = 26 * s;
  const lineSize = 56 * s;
  const lineH = lineSize * 1.04;
  const block = labelSize * 1.2 + 12 * s + lineH * lines.length;
  let y = 9 * s + (H - 18 * s - block) / 2;
  const x = 55 * s;
  t.textBaseline = "alphabetic";
  t.fillStyle = "rgba(255,255,255,0.62)";
  t.font = `500 ${labelSize}px ${FONT}`;
  if ("letterSpacing" in t) t.letterSpacing = "0px";
  t.fillText("Focusing on", x, y + labelSize * 0.95);
  y += labelSize * 1.2 + 12 * s;
  for (const [str, mark, alpha] of lines) {
    t.font = `800 ${lineSize}px ${FONT}`;
    if ("fontStretch" in t) t.fontStretch = "semi-expanded";
    if ("letterSpacing" in t)
      t.letterSpacing = `${(-0.035 * lineSize).toFixed(2)}px`;
    t.fillStyle = `rgba(255,255,255,${alpha})`;
    const base0 = y + lineSize * 0.86;
    t.fillText(str, x, base0);
    if (mark) {
      const wTxt = t.measureText(str).width;
      t.fillRect(x, base0 + lineSize * 0.12, wTxt, lineSize * 0.07);
    }
    y += lineH;
  }
  return { base, text };
}

/** "ELNAR" painted on the asphalt (stretched along the road like real markings) */
function roadTextCanvas(): HTMLCanvasElement {
  const W = 1600;
  const H = 240;
  const c = mk(W, H);
  const g = c.getContext("2d") as CanvasRenderingContext2D & {
    letterSpacing?: string;
  };
  g.font = `800 200px ${FONT}`;
  if ("letterSpacing" in g) g.letterSpacing = "16px";
  const wTxt = g.measureText("ELNAR").width || 1;
  g.fillStyle = "rgba(255,255,255,0.9)";
  g.textBaseline = "alphabetic";
  g.save();
  g.scale(1500 / wTxt, 1);
  g.fillText("ELNAR", 0, 205);
  g.restore();
  return c;
}

/* ── everything the scene needs (canvases, ready to upload to the GPU) ──── */
export interface SceneCanvases {
  ground: HTMLCanvasElement;
  streetNear: HTMLCanvasElement;
  streetFar: HTMLCanvasElement;
  walls: { right: HTMLCanvasElement; front: HTMLCanvasElement }[];
  top: HTMLCanvasElement;
  ao: HTMLCanvasElement;
  glow: HTMLCanvasElement;
  streakIn: HTMLCanvasElement;
  streakOut: HTMLCanvasElement;
  board: HTMLCanvasElement;
  boardText: HTMLCanvasElement;
  roadText: HTMLCanvasElement;
}

export const STREET_SPLIT = -900; // near piece: y > split, far piece: y < split

const cache = new Map<boolean, Promise<SceneCanvases>>();

/** drawn once (shared if the component re-mounts), in small steps so the loader stays smooth */
export function buildCanvases(
  lite: boolean,
  boardLen: number,
  boardH: number,
): Promise<SceneCanvases> {
  let p = cache.get(lite);
  if (!p) {
    p = (async () => {
      const q = lite ? 0.72 : 1;
      await fontReady();
      const top = topTile();
      await tick();
      const ao = radialTile("ao");
      const glow = radialTile("glow");
      const streakIn = streakTile("down", 1);
      const streakOut = streakTile("up", 0.62);
      const roadText = roadTextCanvas();
      const { base: board, text: boardText } = boardCanvases(
        boardLen,
        boardH,
        lite ? 2 : 3,
      );
      await tick();
      const ground = groundCanvas(0.4 * q);
      await tick();
      const streetNear = streetCanvas(STREET_SPLIT, ROAD.yNear, 1.15 * q, 21);
      await tick();
      const streetFar = streetCanvas(ROAD.yFar, STREET_SPLIT + 4, 0.5 * q, 22);
      await tick();
      const walls: SceneCanvases["walls"] = [];
      for (const b of BUILDINGS.filter((bb) => !(lite && bb.skipOnLite))) {
        const right = facadeCanvas(
          b.d,
          b.h,
          b.seed,
          b.lit,
          Math.round(b.tone[1] * 1.9),
          1.0 * q,
        );
        await tick();
        const front = facadeCanvas(
          b.w,
          b.h,
          b.seed + 100,
          b.lit * 0.7,
          Math.round(b.tone[2] * 1.9),
          1.0 * q,
        );
        await tick();
        walls.push({ right, front });
      }
      return {
        ground,
        streetNear,
        streetFar,
        walls,
        top,
        ao,
        glow,
        streakIn,
        streakOut,
        board,
        boardText,
        roadText,
      };
    })();
    cache.set(lite, p);
  }
  return p;
}
