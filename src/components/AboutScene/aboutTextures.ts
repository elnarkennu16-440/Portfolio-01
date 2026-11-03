/* ────────────────────────────────────────────────────────────────────────────
 * ABOUT TEXTURES — drawn once on canvases (while you scroll toward the section),
 * then uploaded to the GPU. Nothing here runs per frame.
 * ──────────────────────────────────────────────────────────────────────────── */

import { rng } from "./aboutGlUtils";
import { ABOUT_TEXT, BILLBOARD, BUILDINGS, SIGN, STREET } from "./aboutSceneConfig";

const mk = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = Math.max(2, Math.round(w));
  c.height = Math.max(2, Math.round(h));
  return c;
};
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

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

function blob(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rgba: string) {
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

/** the site's own font (so the sign matches the rest of the page) */
function siteFont(): string {
  try {
    const f = getComputedStyle(document.body).fontFamily;
    if (f) return `${f}, "Helvetica Neue", Arial, sans-serif`;
  } catch {
    /* ignore */
  }
  return '"Helvetica Neue", Arial, sans-serif';
}

/* ── ground: sidewalks, road, lane lines, zebra crossing ────────────────── */
function groundCanvas(ppm: number): HTMLCanvasElement {
  const S = STREET;
  const W = (S.x1 - S.x0) * ppm;
  const H = (S.z1 - S.z0) * ppm;
  const c = mk(W, H);
  const g = c.getContext("2d")!;
  const X = (x: number) => (x - S.x0) * ppm;
  const Z = (z: number) => (z - S.z0) * ppm;
  const r = rng(31);

  // sidewalks
  g.fillStyle = "#2b2b2e";
  g.fillRect(0, 0, W, H);
  // paving slabs: slight brightness change per slab + joints
  const slab = 1.6;
  for (let x = Math.floor(S.x0 / slab) * slab; x < S.x1; x += slab) {
    for (let z = Math.floor(S.z0 / slab) * slab; z < S.z1; z += slab) {
      const v = r();
      g.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.07})` : `rgba(0,0,0,${(0.5 - v) * 0.16})`;
      g.fillRect(X(x), Z(z), slab * ppm, slab * ppm);
    }
  }
  g.fillStyle = "rgba(0,0,0,0.5)";
  for (let x = Math.floor(S.x0 / slab) * slab; x < S.x1; x += slab) g.fillRect(X(x), 0, Math.max(1, 0.05 * ppm), H);
  for (let z = Math.floor(S.z0 / slab) * slab; z < S.z1; z += slab) g.fillRect(0, Z(z), W, Math.max(1, 0.05 * ppm));

  // asphalt
  g.fillStyle = "#161618";
  g.fillRect(0, Z(S.roadFar), W, (S.roadNear - S.roadFar) * ppm);
  // tyre tracks
  for (const lane of [-3.1, 1.2]) {
    for (const off of [-0.7, 0.7]) {
      const gr = g.createLinearGradient(0, Z(lane + off - 0.45), 0, Z(lane + off + 0.45));
      gr.addColorStop(0, "rgba(255,255,255,0)");
      gr.addColorStop(0.5, "rgba(255,255,255,0.05)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(0, Z(lane + off - 0.45), W, 0.9 * ppm);
    }
  }
  // kerbs
  g.fillStyle = "rgba(255,255,255,0.28)";
  g.fillRect(0, Z(S.roadFar) - 0.12 * ppm, W, 0.12 * ppm);
  g.fillRect(0, Z(S.roadNear), W, 0.12 * ppm);
  g.fillStyle = "rgba(0,0,0,0.6)";
  g.fillRect(0, Z(S.roadFar), W, 0.14 * ppm);
  g.fillRect(0, Z(S.roadNear) - 0.14 * ppm, W, 0.14 * ppm);

  // lane lines: solid near the kerbs, dashed in the middle
  g.fillStyle = "rgba(255,255,255,0.5)";
  g.fillRect(0, Z(-4.55), W, 0.12 * ppm);
  g.fillRect(0, Z(2.05), W, 0.12 * ppm);
  g.fillStyle = "rgba(255,255,255,0.8)";
  const mid = (S.roadFar + S.roadNear) / 2;
  for (let x = S.x0; x < S.x1; x += 7) g.fillRect(X(x), Z(mid) - 0.07 * ppm, 3.2 * ppm, 0.14 * ppm);

  // zebra crossing (bars run across the road)
  g.fillStyle = "rgba(255,255,255,0.82)";
  for (let x = S.crossX0; x < S.crossX1; x += 0.95) g.fillRect(X(x), Z(S.roadFar + 0.5), 0.5 * ppm, (S.roadNear - S.roadFar - 1) * ppm);

  // stains + gutter drains
  for (let i = 0; i < 40; i++) {
    blob(g, X(S.x0 + r() * (S.x1 - S.x0)), Z(S.roadFar + r() * (S.roadNear - S.roadFar)), (0.6 + r() * 1.6) * ppm, (0.4 + r() * 0.9) * ppm, `rgba(0,0,0,${0.2 + r() * 0.2})`);
  }
  g.fillStyle = "#050506";
  for (let x = -30; x < 40; x += 16) g.fillRect(X(x), Z(S.roadNear) - 0.4 * ppm, 1.2 * ppm, 0.3 * ppm);

  grain(c, 14, 33);
  return c;
}

/* ── building wall: big square windows, some lit ────────────────────────── */
function facadeCanvas(wM: number, hM: number, ppm: number, seed: number, lit: number, base: number): HTMLCanvasElement {
  const cw = 2.4;
  const ch = 3.0;
  const cols = Math.max(2, Math.round(wM / cw));
  const rows = Math.max(2, Math.round(hM / ch));
  const cellW = (wM * ppm) / cols;
  const cellH = (hM * ppm) / rows;
  const c = mk(wM * ppm, hM * ppm);
  const g = c.getContext("2d")!;
  const r = rng(seed);

  const bg = g.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, `rgb(${base + 8},${base + 8},${base + 10})`);
  bg.addColorStop(1, `rgb(${base - 8},${base - 8},${base - 6})`);
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);

  for (let row = 0; row < rows; row++) {
    g.fillStyle = "rgba(0,0,0,0.3)";
    g.fillRect(0, (row + 1) * cellH - 0.22 * ppm, c.width, 0.22 * ppm);
    for (let col = 0; col < cols; col++) {
      const x = col * cellW + 0.4 * ppm;
      const y = row * cellH + 0.55 * ppm;
      const w = cellW - 0.8 * ppm;
      const h = cellH - 1.25 * ppm;
      const wg = g.createLinearGradient(0, y, 0, y + h);
      wg.addColorStop(0, "#1c1c1f");
      wg.addColorStop(1, "#08080a");
      g.fillStyle = wg;
      g.fillRect(x, y, w, h);
      g.fillStyle = "rgba(0,0,0,0.65)";
      g.fillRect(x, y, w, 0.12 * ppm);
      g.fillStyle = "rgba(255,255,255,0.16)";
      g.fillRect(x - 0.05 * ppm, y + h, w + 0.1 * ppm, 0.09 * ppm);
      const v = r();
      if (v < lit) {
        g.save();
        g.shadowColor = "rgba(255,255,255,0.5)";
        g.shadowBlur = 0.5 * ppm;
        g.fillStyle = v < lit * 0.55 ? "#f4f4f5" : "#b9b9bd";
        g.fillRect(x + 0.06 * ppm, y + 0.06 * ppm, w - 0.12 * ppm, h - 0.12 * ppm);
        g.restore();
      }
    }
  }
  const ao = g.createLinearGradient(0, 0, 0, c.height);
  ao.addColorStop(0, "rgba(255,255,255,0.05)");
  ao.addColorStop(0.5, "rgba(0,0,0,0)");
  ao.addColorStop(1, "rgba(0,0,0,0.5)");
  g.fillStyle = ao;
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 10; i++) blob(g, r() * c.width, r() * c.height, (1 + r() * 3) * ppm, (3 + r() * 7) * ppm, `rgba(0,0,0,${0.05 + r() * 0.07})`);
  grain(c, 11, seed + 5);
  return c;
}

/* ── the GitHub billboard ───────────────────────────────────────────────── */
function loadImage(urls: string[], timeout = 3500): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    let i = 0;
    let done = false;
    const finish = (v: HTMLImageElement | null) => {
      if (!done) {
        done = true;
        resolve(v);
      }
    };
    const timer = window.setTimeout(() => finish(null), timeout);
    const next = () => {
      if (i >= urls.length) {
        window.clearTimeout(timer);
        finish(null);
        return;
      }
      const im = new Image();
      im.onload = () => {
        window.clearTimeout(timer);
        finish(im);
      };
      im.onerror = next;
      im.src = urls[i++];
    };
    next();
  });
}

function billboardCanvas(ppm: number, img: HTMLImageElement | null, font: string): HTMLCanvasElement {
  const W = BILLBOARD.w * ppm;
  const H = BILLBOARD.h * ppm;
  const c = mk(W, H);
  const g = c.getContext("2d")!;
  const u = H / 100; // 1% of the height

  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#111113");
  bg.addColorStop(1, "#0a0a0b");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,0.1)";
  g.lineWidth = Math.max(1, 0.4 * u);
  g.strokeRect(2.2 * u, 2.2 * u, W - 4.4 * u, H - 4.4 * u);

  g.textBaseline = "alphabetic";
  g.fillStyle = "rgba(255,255,255,0.4)";
  g.font = `500 ${3.1 * u}px ${font}`;
  g.fillText("GitHub repository activity", 5 * u, 8.2 * u);
  g.textAlign = "right";
  g.fillText("last 12 months", W - 5 * u, 8.2 * u);
  g.textAlign = "left";

  if (img) {
    // the picture from /public, contained and turned grey (black + grey theme)
    const x0 = 4 * u;
    const y0 = 12 * u;
    const bw = W - 8 * u;
    const bh = H - 16.5 * u;
    const s = Math.min(bw / img.width, bh / img.height);
    const dw = img.width * s;
    const dh = img.height * s;
    const dx = x0 + (bw - dw) / 2;
    const dy = y0 + (bh - dh) / 2;
    const tmp = mk(Math.ceil(dw), Math.ceil(dh));
    const tg = tmp.getContext("2d")!;
    tg.drawImage(img, 0, 0, tmp.width, tmp.height);
    const d = tg.getImageData(0, 0, tmp.width, tmp.height);
    for (let i = 0; i < d.data.length; i += 4) {
      const l = d.data[i] * 0.3 + d.data[i + 1] * 0.59 + d.data[i + 2] * 0.11;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = Math.min(255, l * 1.08);
    }
    tg.putImageData(d, 0, 0);
    g.drawImage(tmp, dx, dy, dw, dh);
  } else {
    // drawn fallback: big number + a grey calendar
    g.fillStyle = "#f2f2f3";
    g.font = `800 ${25 * u}px ${font}`;
    g.fillText(String(BILLBOARD.contributions), 5 * u, 36 * u);
    g.font = `700 ${7.6 * u}px ${font}`;
    g.fillText("contributions", 44 * u, 27 * u);
    g.fillStyle = "rgba(255,255,255,0.45)";
    g.font = `500 ${3.4 * u}px ${font}`;
    g.fillText("in the last year", 44 * u, 33 * u);
    const r2 = rng(7);
    const cols = 53;
    const gx = 5 * u;
    const gy = 48 * u;
    const cell = (W - 10 * u) / cols;
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < 7; row++) {
        const v = r2();
        const a = v < 0.5 ? 0.08 : v < 0.75 ? 0.25 : v < 0.9 ? 0.5 : 0.85;
        g.fillStyle = `rgba(255,255,255,${a})`;
        g.fillRect(gx + col * cell, gy + row * cell, cell * 0.8, cell * 0.8);
      }
    }
  }
  grain(c, 6, 12);
  return c;
}

/* ── comment sign text (wrapped to fit, with per-character positions for typing) ── */
export interface SignLayout {
  canvas: HTMLCanvasElement;
  /** per line: the text and the x (0–1 of the canvas width) after each character */
  lines: { text: string; ends: number[] }[];
  x0: number; // where the text starts (0–1 of width)
  topUV: number; // where the first line starts (0–1 of height)
  lineHUV: number; // line height (0–1 of height)
  total: number; // number of characters
}

function signTextCanvas(wM: number, hM: number, ppm: number, font: string): SignLayout {
  const W = Math.round(wM * ppm);
  const H = Math.round(hM * ppm);
  const c = mk(W, H);
  const g = c.getContext("2d")!;
  const padX = 0.5 * ppm;
  const padY = 0.42 * ppm;
  const maxW = W - padX * 2;
  const words = ABOUT_TEXT.split(" ");

  // the biggest font size that still fits inside the bubble
  let size = 0.36 * ppm;
  let lines: string[] = [];
  let lineH = 0;
  for (; size > 10; size -= 1) {
    g.font = `400 ${size}px ${font}`;
    lineH = size * 1.42;
    lines = [];
    let cur = "";
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (g.measureText(t).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else cur = t;
    }
    if (cur) lines.push(cur);
    if (lines.length * lineH <= H - padY * 2) break;
  }

  g.fillStyle = "#ececee";
  g.textBaseline = "alphabetic";
  g.font = `400 ${size}px ${font}`;
  const top = padY + (H - padY * 2 - lines.length * lineH) / 2;
  const out: SignLayout["lines"] = [];
  let total = 0;
  lines.forEach((ln, i) => {
    const y = top + i * lineH + size * 1.02;
    g.fillText(ln, padX, y);
    const ends: number[] = [];
    for (let k = 1; k <= ln.length; k++) ends.push((padX + g.measureText(ln.slice(0, k)).width) / W);
    out.push({ text: ln, ends });
    total += ln.length + 1;
  });
  return { canvas: c, lines: out, x0: padX / W, topUV: top / H, lineHUV: lineH / H, total };
}

/* ── small soft tiles ───────────────────────────────────────────────────── */
function radialTile(): HTMLCanvasElement {
  const c = mk(128, 128);
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.35, "rgba(255,255,255,0.45)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return c;
}

/** the bright wet-road reflection under the street lamp (long, fades out) */
function reflectionTile(): HTMLCanvasElement {
  const W = 128;
  const H = 256;
  const c = mk(W, H);
  const g = c.getContext("2d")!;
  const img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    const along = Math.pow(Math.sin((y / (H - 1)) * Math.PI * 0.92 + 0.08), 1.6);
    for (let x = 0; x < W; x++) {
      const dx = (x / (W - 1) - 0.5) * 2;
      const across = Math.pow(Math.max(0, 1 - dx * dx), 1.4);
      const a = across * along;
      const i = (y * W + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = (a * 255) | 0;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/* ── everything the scene needs ─────────────────────────────────────────── */
export interface AboutCanvases {
  ground: HTMLCanvasElement;
  walls: { front: HTMLCanvasElement; side: HTMLCanvasElement }[];
  board: HTMLCanvasElement;
  sign: SignLayout;
  glow: HTMLCanvasElement;
  reflection: HTMLCanvasElement;
}

const cache = new Map<string, Promise<AboutCanvases>>();

export function buildAboutCanvases(lite: boolean, portrait: boolean): Promise<AboutCanvases> {
  const key = `${lite}-${portrait}`;
  let p = cache.get(key);
  if (!p) {
    p = (async () => {
      const q = lite ? 0.68 : 1;
      const font = siteFont();
      const img = await loadImage([`/${BILLBOARD.image}`, BILLBOARD.image]);
      const glow = radialTile();
      const reflection = reflectionTile();
      await tick();
      const ground = groundCanvas(30 * q);
      await tick();
      const board = billboardCanvas(150 * q, img, font);
      await tick();
      const sw = portrait ? SIGN.portrait.w : SIGN.w;
      const sh = portrait ? SIGN.portrait.h : SIGN.h;
      const sign = signTextCanvas(sw, sh, (portrait ? 150 : 215) * q, font);
      await tick();
      const walls: AboutCanvases["walls"] = [];
      for (const b of BUILDINGS.filter((bb) => !(lite && bb.skipOnLite))) {
        const front = facadeCanvas(b.w, b.h, 46 * q, b.seed, b.lit, b.base);
        await tick();
        const side = facadeCanvas(b.d, b.h, 30 * q, b.seed + 50, b.lit * 0.7, b.base - 6);
        await tick();
        walls.push({ front, side });
      }
      return { ground, walls, board, sign, glow, reflection };
    })();
    cache.set(key, p);
  }
  return p;
}
