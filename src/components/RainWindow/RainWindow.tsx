import React, { memo, useEffect, useRef, useState } from "react";
import styles from "./RainWindow.module.css";

/* ────────────────────────────────────────────────────────────────────────────
 * RAIN WINDOW
 * ────────────────────────────────────────────────────────────────────────────
 * A minimalist window with endless rain + a live clock (Philippine time).
 *
 * RAIN (canvas, no React re-renders while it runs)
 *   - 3 depth layers of falling streaks (far = thin + dim, near = thick + bright)
 *   - a few big 3D beads sliding down the glass (now GRAY, shaded, with a soft
 *     highlight and a thin wet trail)
 *   - a static layer of tiny condensation beads (drawn once, only re-drawn on resize)
 *
 * PERFORMANCE
 *   - pauses when the window is off-screen or the browser tab is hidden
 *   - max ~60 fps, delta-time based, devicePixelRatio capped at 1.5
 *   - only ~3 stroke() calls for all streaks + a handful of beads per frame
 *   - prefers-reduced-motion: draws one calm still frame, no animation
 *
 * CLOCK
 *   - Philippine time = UTC+8 (no daylight saving), computed from Date.now(),
 *     updated exactly on every second boundary
 * ──────────────────────────────────────────────────────────────────────────── */

/* ── palettes (RGB triplets so the alpha can change per use) ───────────── */
interface Palette {
  hi: string; // highlights / specular
  sh: string; // shaded rim
  st: string; // falling streaks
  tr: string; // wet trail behind the sliding beads
  g1: string; // gray bead body (lit side)
  g2: string; // gray bead body (shaded side)
}

const PALETTES: Record<"dark" | "light", Palette> = {
  dark: {
    hi: "255,255,255",
    sh: "0,0,0",
    st: "214,220,232",
    tr: "170,174,182",
    g1: "178,182,190",
    g2: "88,92,100",
  },
  light: {
    hi: "255,255,255",
    sh: "30,34,42",
    st: "52,56,66",
    tr: "60,64,72",
    g1: "150,154,162",
    g2: "92,96,104",
  },
};

/* ── scene types ───────────────────────────────────────────────────────── */
interface Streak {
  x: number;
  y: number;
  l: number; // length
  v: number; // speed (px / s)
}

interface Drop {
  x: number;
  y: number;
  r: number;
  state: 0 | 1; // 0 = resting, 1 = sliding
  t: number; // seconds left in the current state
  dur: number; // total duration of the current slide
  vmax: number;
  trailY: number;
  trailA: number;
  seed: number;
}

// 3 depth layers: far -> near
const LAYERS = [
  { share: 0.45, len: [9, 16], speed: [420, 520], width: 0.6, alpha: 0.1 },
  { share: 0.35, len: [16, 26], speed: [620, 740], width: 0.9, alpha: 0.17 },
  { share: 0.2, len: [26, 40], speed: [820, 960], width: 1.25, alpha: 0.28 },
] as const;

const WIND = 0.14; // horizontal drift per vertical px (rain leans "/")

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** One shaded gray bead (used for the big sliding drops AND the tiny static ones). */
const drawBead = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  stretch: number,
  p: Palette,
  a: number,
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, stretch);

  // body: soft gray ball (lit top-left, darker bottom-right)
  const body = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.05, 0, 0, r);
  body.addColorStop(0, `rgba(${p.g1},${0.85 * a})`);
  body.addColorStop(0.6, `rgba(${p.g2},${0.78 * a})`);
  body.addColorStop(1, `rgba(${p.sh},${0.4 * a})`);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  const lw = Math.max(0.6, r * 0.14);
  ctx.lineWidth = lw;

  // shaded rim (top-left)
  ctx.strokeStyle = `rgba(${p.sh},${0.45 * a})`;
  ctx.beginPath();
  ctx.arc(0, 0, r - lw / 2, Math.PI * 0.9, Math.PI * 1.65);
  ctx.stroke();

  // faint gray edge light (bottom-right) — muted, no bright refraction
  ctx.strokeStyle = `rgba(${p.g1},${0.3 * a})`;
  ctx.beginPath();
  ctx.arc(0, 0, r - lw / 2, Math.PI * 0.05, Math.PI * 0.62);
  ctx.stroke();

  // soft specular highlight
  ctx.fillStyle = `rgba(${p.hi},${0.5 * a})`;
  ctx.beginPath();
  ctx.ellipse(-r * 0.34, -r * 0.38, r * 0.2, r * 0.13, -0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

const makeStreak = (
  layer: number,
  w: number,
  h: number,
  initial: boolean,
): Streak => {
  const L = LAYERS[layer];
  const l = rand(L.len[0], L.len[1]);
  return {
    l,
    v: rand(L.speed[0], L.speed[1]),
    x: rand(0, w + h * WIND + 30),
    y: initial ? rand(-h, h) : -l - rand(0, 40),
  };
};

const makeDrop = (
  w: number,
  h: number,
  scale: number,
  initial: boolean,
): Drop => ({
  x: rand(w * 0.06, w * 0.94),
  y: initial ? rand(-h * 0.05, h * 0.95) : rand(-h * 0.08, h * 0.12),
  r: rand(3.8, 8.6) * scale,
  state: 0,
  t: rand(0.2, 3),
  dur: 1,
  vmax: 40,
  trailY: 0,
  trailA: 0,
  seed: rand(0, 6.28),
});

/* ──────────────────────────────────────────────────────────────────────────
 * RAIN CANVAS
 * ────────────────────────────────────────────────────────────────────────── */
const RainCanvas = memo(function RainCanvas() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // theme (the site toggles data-theme on an ancestor)
    const themeEl =
      (wrap.closest("[data-theme]") as HTMLElement | null) ??
      document.documentElement;
    const readPalette = () =>
      themeEl.getAttribute("data-theme") === "light"
        ? PALETTES.light
        : PALETTES.dark;
    let pal = readPalette();

    // scene state
    let w = 0;
    let h = 0;
    let dpr = 1;
    let scale = 1;
    let layers: Streak[][] = [[], [], []];
    let drops: Drop[] = [];
    let stat: HTMLCanvasElement | null = null;

    const buildStatic = () => {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w * dpr));
      c.height = Math.max(1, Math.round(h * dpr));
      const g = c.getContext("2d");
      if (!g) {
        stat = null;
        return;
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = clamp(Math.round((w * h) / 2200), 60, 220);
      for (let i = 0; i < count; i++) {
        drawBead(g, rand(0, w), rand(0, h), rand(0.8, 2.4), 1, pal, 0.7);
      }
      stat = c;
    };

    const buildScene = () => {
      scale = clamp(Math.min(w, h) / 360, 0.75, 1.25);
      const total = clamp(Math.round((w * h) / 5500), 36, 120);
      layers = LAYERS.map((L, i) => {
        const n = Math.max(6, Math.round(total * L.share));
        return Array.from({ length: n }, () => makeStreak(i, w, h, true));
      });
      const dropCount = clamp(Math.round((w * h) / 26000), 5, 14);
      drops = Array.from({ length: dropCount }, () =>
        makeDrop(w, h, scale, true),
      );
      buildStatic();
    };

    /* ── update ─────────────────────────────────────────────────────────── */
    const update = (dt: number) => {
      for (let li = 0; li < layers.length; li++) {
        const layer = layers[li];
        for (let i = 0; i < layer.length; i++) {
          const s = layer[i];
          s.y += s.v * dt;
          s.x -= s.v * WIND * dt;
          if (s.y - s.l > h) {
            layer[i] = makeStreak(li, w, h, false);
          }
        }
      }

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        if (d.state === 0) {
          d.t -= dt;
          if (d.t <= 0) {
            d.state = 1;
            d.dur = rand(0.6, 1.9);
            d.t = d.dur;
            d.vmax = rand(26, 70) * scale;
            if (d.trailA <= 0.02) d.trailY = d.y;
            d.trailA = 1;
          } else {
            d.trailA = Math.max(0, d.trailA - dt * 0.28);
          }
        } else {
          d.t -= dt;
          const prog = clamp(1 - d.t / d.dur, 0, 1);
          const sp = d.vmax * (0.25 + 0.75 * Math.sin(Math.PI * prog));
          d.y += sp * dt;
          d.x += Math.sin(d.y * 0.07 + d.seed) * sp * dt * 0.06;
          if (d.t <= 0) {
            d.state = 0;
            d.t = rand(0.6, 3.2);
          }
        }
        if (d.y - d.r * 1.4 > h) {
          drops[i] = makeDrop(w, h, scale, false);
        }
      }
    };

    /* ── draw ───────────────────────────────────────────────────────────── */
    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      if (stat) ctx.drawImage(stat, 0, 0, w, h);

      // falling streaks: one stroke() per depth layer
      ctx.lineCap = "round";
      for (let li = 0; li < layers.length; li++) {
        const L = LAYERS[li];
        ctx.lineWidth = L.width;
        ctx.strokeStyle = `rgba(${pal.st},${L.alpha})`;
        ctx.beginPath();
        const layer = layers[li];
        for (let i = 0; i < layer.length; i++) {
          const s = layer[i];
          ctx.moveTo(s.x + s.l * WIND, s.y - s.l);
          ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();
      }

      // wet trails behind the sliding beads
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        if (d.trailA > 0.01 && d.y - d.trailY > 1) {
          const g = ctx.createLinearGradient(0, d.trailY, 0, d.y);
          g.addColorStop(0, `rgba(${pal.tr},0)`);
          g.addColorStop(1, `rgba(${pal.tr},${0.12 * d.trailA})`);
          ctx.strokeStyle = g;
          ctx.lineWidth = Math.max(1, d.r * 0.36);
          ctx.beginPath();
          ctx.moveTo(d.x, d.trailY);
          ctx.lineTo(d.x, d.y);
          ctx.stroke();
        }
      }

      // the gray beads (a little taller while sliding)
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        drawBead(ctx, d.x, d.y, d.r, d.state === 1 ? 1.22 : 1.06, pal, 1);
      }
    };

    /* ── sizing ─────────────────────────────────────────────────────────── */
    const setup = (cssW: number, cssH: number) => {
      if (cssW < 10 || cssH < 10) return;
      w = cssW;
      h = cssH;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5); // rain is soft, 1.5x is plenty (and much lighter)
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildScene();
      draw();
    };

    /* ── animation loop (runs only while visible) ───────────────────────── */
    let raf = 0;
    let running = false;
    let last = 0;

    const frame = (ts: number) => {
      raf = window.requestAnimationFrame(frame);
      const elapsed = ts - last;
      if (elapsed < 15) return; // cap ~60 fps (also on 120 / 144 Hz screens)
      last = ts;
      update(Math.min(elapsed, 50) / 1000);
      draw();
    };

    const start = () => {
      if (running || reduceMotion || w === 0) return;
      running = true;
      last = performance.now();
      raf = window.requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      window.cancelAnimationFrame(raf);
    };

    let inView = false;
    const sync = () => {
      if (inView && !document.hidden) start();
      else stop();
    };

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? false;
        sync();
      },
      { threshold: 0 },
    );
    io.observe(wrap);

    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (!r) return;
      setup(r.width, r.height);
      sync();
    });
    ro.observe(wrap);

    const onVisibility = () => sync();
    document.addEventListener("visibilitychange", onVisibility);

    // light / dark switch: re-colour the static beads and redraw
    const mo = new MutationObserver(() => {
      const next = readPalette();
      if (next === pal) return;
      pal = next;
      if (w > 0) {
        buildStatic();
        draw();
      }
    });
    mo.observe(themeEl, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={wrapRef} className={styles.canvasWrap} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
});

/* ──────────────────────────────────────────────────────────────────────────
 * LIVE CLOCK — Philippine time (UTC+8, no daylight saving)
 * ────────────────────────────────────────────────────────────────────────── */
const PH_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
const pad2 = (n: number) => String(n).padStart(2, "0");

const manilaParts = (ms: number) => {
  const d = new Date(ms + PH_OFFSET_MS); // read with getUTC* = Manila wall clock
  const h24 = d.getUTCHours();
  return {
    hh: pad2(h24 % 12 || 12),
    mm: pad2(d.getUTCMinutes()),
    ss: pad2(d.getUTCSeconds()),
    period: h24 >= 12 ? "PM" : "AM",
    day: DAYS[d.getUTCDay()],
    date: pad2(d.getUTCDate()),
    month: MONTHS[d.getUTCMonth()],
    year: d.getUTCFullYear(),
  };
};

const LiveClock = memo(function LiveClock() {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    let timer = 0;

    // re-sync on every second boundary so the seconds never drift
    const tick = () => {
      const t = Date.now();
      setNow(t);
      timer = window.setTimeout(tick, 1000 - (t % 1000) + 4);
    };
    tick();

    // when the tab comes back, show the correct time immediately
    const onVisible = () => {
      if (!document.hidden) {
        window.clearTimeout(timer);
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const p = manilaParts(now);

  return (
    <>
      {/* "LIVE" text removed — only the small pulsing dot stays next to the place */}
      <div className={styles.hudTop}>
        <span className={styles.place}>
          <span className={styles.liveDot} aria-hidden="true" />
        </span>
      </div>

      <div className={styles.hudBottom}>
        <time
          className={styles.time}
          dateTime={new Date(now).toISOString()}
          aria-label={`${p.hh}:${p.mm}:${p.ss} ${p.period}, Philippine time`}
        >
          <span className={styles.timeMain}>
            {p.hh}:{p.mm}
          </span>
          <span className={styles.timeSec}>:{p.ss}</span>
          <span className={styles.timePeriod}>{p.period}</span>
        </time>
        <span className={styles.date}>
          {p.day} · {p.date} {p.month} {p.year} · GMT+8
        </span>
      </div>
    </>
  );
});

/* ──────────────────────────────────────────────────────────────────────────
 * WINDOW
 * ────────────────────────────────────────────────────────────────────────── */
export const RainWindow: React.FC = () => (
  <div
    className={styles.window}
    role="group"
    aria-label="Rain falling on a window, with the current time in the Philippines"
  >
    <RainCanvas />
    <div className={styles.glass} aria-hidden="true" />
    <div className={styles.frame} aria-hidden="true" />
    <LiveClock />
  </div>
);
