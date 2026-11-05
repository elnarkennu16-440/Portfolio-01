/* ────────────────────────────────────────────────────────────────────────────
 * HIGHLIGHT TEXTURES — drawn ONCE on small canvases (same recipe as the hero's
 * textures.ts: concrete + window recesses + a few lit windows + baked shading),
 * then uploaded to the GPU as plain bitmaps. Black / grey / white only.
 * ──────────────────────────────────────────────────────────────────────────── */

import { HL_BARS } from "./highlightConfig";

/** small deterministic random generator, so the windows never change between loads */
function rng(seed: number) {
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

/** let the browser breathe between heavy steps */
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

function grain(c: HTMLCanvasElement, amount: number, seed: number) {
  const g = c.getContext("2d");
  if (!g) return;
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

/* ── wall of a tower ────────────────────────────────────────────────────── */
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
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const r = rng(seed);

  // concrete: lighter at the top, darker at the base
  const bg = g.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, `rgb(${base + 10},${base + 10},${base + 12})`);
  bg.addColorStop(1, `rgb(${base - 22},${base - 22},${base - 20})`);
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);

  for (let row = 0; row < rows; row++) {
    // floor slab (horizontal band)
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
      g.fillStyle = "rgba(0,0,0,0.7)";
      g.fillRect(x, y, w, Math.max(1, 2.5 * d));
      g.fillStyle = "rgba(255,255,255,0.2)";
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

  // baked lighting
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

/** soft dark patch (white in the bitmap, tinted black by the vertex colour) */
function aoTile(): HTMLCanvasElement {
  const c = mk(128, 128);
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.58, "rgba(255,255,255,1)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return c;
}

/** rooftop concrete (tinted per tower by the vertex colour) */
function topTile(): HTMLCanvasElement {
  const S = 256;
  const c = mk(S, S);
  const g = c.getContext("2d") as CanvasRenderingContext2D;
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

export interface HighlightCanvases {
  walls: { right: HTMLCanvasElement; front: HTMLCanvasElement }[];
  top: HTMLCanvasElement;
  ao: HTMLCanvasElement;
}

const cache = new Map<boolean, Promise<HighlightCanvases>>();

/** drawn once (shared if the component re-mounts), in small steps so the page stays smooth */
export function buildHighlightCanvases(
  lite: boolean,
): Promise<HighlightCanvases> {
  let p = cache.get(lite);
  if (!p) {
    p = (async () => {
      const q = lite ? 0.7 : 1;
      const top = topTile();
      const ao = aoTile();
      await tick();
      const walls: HighlightCanvases["walls"] = [];
      for (const b of HL_BARS) {
        const right = facadeCanvas(
          b.d,
          b.h,
          b.seed,
          b.lit,
          Math.round(b.tone[1] * 1.9),
          q,
        );
        await tick();
        const front = facadeCanvas(
          b.w,
          b.h,
          b.seed + 100,
          b.lit * 0.7,
          Math.round(b.tone[2] * 1.9),
          q,
        );
        await tick();
        walls.push({ right, front });
      }
      return { walls, top, ao };
    })();
    cache.set(lite, p);
  }
  return p;
}
