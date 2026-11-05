/* ────────────────────────────────────────────────────────────────────────────
 * SKYLINE TEXTURES — drawn ONCE on a tiny canvas, then used as plain
 * background images. Nothing here runs per frame (same idea as textures.ts of
 * the Hero scene: pre-drawn bitmaps, not live effects).
 * ──────────────────────────────────────────────────────────────────────────── */
import { SKY_BUILDINGS, SkyTheme } from "./skylineConfig";

export interface SkyTextures {
  front: string[]; // facade facing the road end (the wide, left side on screen)
  right: string[]; // facade facing the road side (right side on screen)
  ground: string;
}

/** small seeded random so every building keeps its own window pattern */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CELL_W = 30;
const CELL_H = 32;

function facade(
  wU: number,
  hU: number,
  seed: number,
  lit: number,
  base: number,
  theme: SkyTheme,
  d: number,
): string {
  const cols = Math.max(2, Math.round(wU / CELL_W));
  const rows = Math.max(2, Math.round(hU / CELL_H));
  const cw = (wU * d) / cols;
  const ch = (hU * d) / rows;
  const c = document.createElement("canvas");
  c.width = Math.round(wU * d);
  c.height = Math.round(hU * d);
  const g = c.getContext("2d");
  if (!g) return "";
  const r = rng(seed);
  const light = theme === "light";

  // concrete: lighter at the top, darker at the base
  const bg = g.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, `rgb(${base + 10},${base + 10},${base + 12})`);
  bg.addColorStop(1, `rgb(${base - 22},${base - 22},${base - 20})`);
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);

  for (let row = 0; row < rows; row++) {
    // floor slab (horizontal band)
    g.fillStyle = "rgba(0,0,0,0.34)";
    g.fillRect(0, (row + 1) * ch - 3 * d, c.width, 3 * d);
    g.fillStyle = "rgba(255,255,255,0.07)";
    g.fillRect(
      0,
      (row + 1) * ch - 3 * d - Math.max(1, d),
      c.width,
      Math.max(1, d),
    );

    for (let col = 0; col < cols; col++) {
      const x = col * cw + 6 * d;
      const y = row * ch + 8 * d;
      const w = cw - 12 * d;
      const h = ch - 18 * d;

      // recessed opening
      const wg = g.createLinearGradient(0, y, 0, y + h);
      wg.addColorStop(0, light ? "#2a2a2e" : "#1f1f22");
      wg.addColorStop(1, light ? "#101012" : "#050506");
      g.fillStyle = wg;
      g.fillRect(x, y, w, h);
      g.fillStyle = "rgba(0,0,0,0.7)";
      g.fillRect(x, y, w, Math.max(1, 2 * d));
      g.fillStyle = "rgba(255,255,255,0.2)";
      g.fillRect(x - d, y + h, w + 2 * d, Math.max(1, 1.4 * d));

      const v = r();
      if (v < lit) {
        const bright = v < lit * 0.5;
        g.save();
        g.shadowColor = "rgba(255,255,255,0.5)";
        g.shadowBlur = 6 * d;
        const lg = g.createLinearGradient(0, y, 0, y + h);
        lg.addColorStop(0, bright ? "#f6f6f6" : "#c4c4c8");
        lg.addColorStop(1, bright ? "#bdbdc1" : "#85858a");
        g.fillStyle = lg;
        g.fillRect(x + d, y + d, w - 2 * d, h - 2 * d);
        g.restore();
      }
    }
  }

  // baked lighting: light from above, dark at the foot (ambient occlusion)
  const ao = g.createLinearGradient(0, 0, 0, c.height);
  ao.addColorStop(0, "rgba(255,255,255,0.09)");
  ao.addColorStop(0.3, "rgba(0,0,0,0)");
  ao.addColorStop(1, "rgba(0,0,0,0.5)");
  g.fillStyle = ao;
  g.fillRect(0, 0, c.width, c.height);

  // grain, so big walls do not look like flat vector colour
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`;
    g.fillRect(r() * c.width, r() * c.height, 1 + r() * 2 * d, 1 + r() * 2 * d);
  }
  return c.toDataURL("image/png");
}

/** ground: a faint grid that fades out towards the edges (alpha only, so it works on any page colour) */
function ground(theme: SkyTheme): string {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  if (!g) return "";
  const light = theme === "light";
  const cells = 28;
  const step = S / cells;

  g.fillStyle = light ? "rgba(0,0,0,0.035)" : "rgba(26,26,29,0.7)";
  g.fillRect(0, 0, S, S);

  for (let i = 0; i <= cells; i++) {
    const major = i % 4 === 0;
    g.strokeStyle = light
      ? `rgba(0,0,0,${major ? 0.11 : 0.06})`
      : `rgba(255,255,255,${major ? 0.1 : 0.05})`;
    g.lineWidth = major ? 1.6 : 1.1;
    g.beginPath();
    g.moveTo(i * step, 0);
    g.lineTo(i * step, S);
    g.moveTo(0, i * step);
    g.lineTo(S, i * step);
    g.stroke();
  }

  // fade to nothing at the border of the plane
  g.globalCompositeOperation = "destination-in";
  const rg = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  rg.addColorStop(0, "rgba(0,0,0,1)");
  rg.addColorStop(0.34, "rgba(0,0,0,0.9)");
  rg.addColorStop(0.68, "rgba(0,0,0,0.3)");
  rg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = rg;
  g.fillRect(0, 0, S, S);
  return c.toDataURL("image/png");
}

/** brightness of the concrete per theme (light mode lifts it, like the Hero does) */
const BASE: Record<SkyTheme, { front: number; right: number }> = {
  dark: { front: 50, right: 76 },
  light: { front: 74, right: 112 },
};

export function buildSkyTextures(
  theme: SkyTheme,
  density: number,
): SkyTextures {
  const b = BASE[theme];
  return {
    front: SKY_BUILDINGS.map((s) =>
      facade(s.w, s.h, s.seed, s.lit, b.front, theme, density),
    ),
    right: SKY_BUILDINGS.map((s) =>
      facade(s.d, s.h, s.seed + 100, s.lit, b.right, theme, density),
    ),
    ground: ground(theme),
  };
}
