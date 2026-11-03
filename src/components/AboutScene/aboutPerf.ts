/* ────────────────────────────────────────────────────────────────────────────
 * aboutPerf.ts — the "anti-hang" helpers of the About scene.
 *
 * Nothing here changes how the scene LOOKS. It only decides how hard the GPU /
 * CPU has to work, and it reacts when the device cannot keep up:
 *
 *   1. detectTier()      → starting settings for this device (phone / weak CPU / strong PC)
 *   2. isWeakGpu()       → integrated / mobile GPUs get gentler starting settings
 *   3. QualityGovernor   → watches real frame pacing and steps quality down FAST
 *                          (resolution first, then 30 fps) before the page feels stuck
 *   4. loadImageOnce()   → the GitHub image is decoded BEFORE the boards are drawn,
 *                          so a big texture is never re-uploaded in the middle of the reveal
 *   5. whenFontsReady()  → same for fonts (no redraw + re-upload while the scene plays)
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PerfTier {
  /** phone / tablet / touch-first device */
  small: boolean;
  /** weak CPU (<= 4 cores or <= 4 GB) – same rule the Hero uses for its "lite" scene */
  weakCpu: boolean;
  /** hard cap of the canvas pixel ratio */
  dprCap: number;
  /** max canvas pixels (css w × h × dpr²). Fill-rate is what makes PBR scenes hang. */
  pixelBudget: number;
  shadowSize: number;
  aniso: number;
  dust: number;
  /** index into LADDER to start from */
  startLevel: number;
}

export function detectTier(): PerfTier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const small =
    window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;
  const weakCpu =
    (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  if (small) {
    return {
      small,
      weakCpu,
      dprCap: 1.25,
      pixelBudget: 1_800_000,
      shadowSize: 1024,
      aniso: 4,
      dust: 70,
      // phones: steady 30 fps is plenty for slow ambient motion (the Hero does the same)
      startLevel: 2,
    };
  }
  return {
    small,
    weakCpu,
    dprCap: 1.5,
    pixelBudget: weakCpu ? 2_800_000 : 4_000_000,
    shadowSize: weakCpu ? 1024 : 2048,
    aniso: weakCpu ? 4 : 8,
    dust: weakCpu ? 110 : 180,
    startLevel: weakCpu ? 1 : 0,
  };
}

/** integrated / mobile / software GPUs: start gentler, the governor does the rest */
export function isWeakGpu(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
): boolean {
  try {
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return false;
    const name = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
    if (/swiftshader|llvmpipe|basic render|software/i.test(name)) return true;
    if (/mali|adreno|powervr|videocore/i.test(name)) return true;
    // Intel integrated (UHD / HD / Iris) – but not the dedicated Arc cards
    if (/intel/i.test(name) && !/arc/i.test(name)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/* ═══════════════════════════ QUALITY LADDER ═══════════════════════════════ */

/** From best to cheapest. `scale` multiplies the canvas pixel ratio. */
export const LADDER: ReadonlyArray<{ scale: number; fps: number }> = [
  { scale: 1.0, fps: 60 },
  { scale: 0.85, fps: 60 },
  { scale: 1.0, fps: 30 },
  { scale: 0.8, fps: 30 },
  { scale: 0.62, fps: 30 },
];

const WINDOW = 30; // animation frames per decision (~0.5 s)
const WARMUP = 20; // frames ignored after the loop (re)starts
const COOLDOWN_MS = 900; // after a change (the canvas was re-allocated)
const UPGRADE_CLEAN_WINDOWS = 24; // ~12 s of perfectly smooth frames
const MIN_PERIOD = 4;
const MAX_PERIOD = 34;

/**
 * Judges smoothness from the raw requestAnimationFrame rhythm, NOT from our own
 * (throttled) draw rate. So it works the same on 60 / 120 / 144 Hz screens and
 * while we deliberately draw at 30 fps: if the browser starts missing vsyncs, the
 * GPU or the main thread is overloaded and the quality steps down.
 */
export class QualityGovernor {
  level: number;
  private minLevel = 0; // levels above this failed before: do not try them again
  private period = MAX_PERIOD; // display refresh period (ms), learned
  private last = 0;
  private seen = 0;
  private n = 0;
  private late = 0;
  private long = 0;
  private slowStreak = 0;
  private cleanStreak = 0;
  private cooldownUntil = 0;
  private lastChangeAt = 0;
  private lastWasUpgrade = false;

  constructor(
    start: number,
    private readonly onChange: (level: number) => void,
  ) {
    this.level = Math.min(LADDER.length - 1, Math.max(0, start));
  }

  get scale() {
    return LADDER[this.level].scale;
  }
  get frameMs() {
    return 1000 / LADDER[this.level].fps;
  }

  /** call when the loop (re)starts, or after any deliberate pause */
  resetTiming() {
    this.last = 0;
    this.seen = 0;
    this.n = this.late = this.long = 0;
  }

  /** call on EVERY animation frame (also the ones we skip drawing) */
  tick(now: number) {
    const dt = this.last ? now - this.last : 0;
    this.last = now;
    if (!dt) return;
    if (dt > 400) {
      // tab was hidden / big stall that is not a trend
      this.n = this.late = this.long = 0;
      this.seen = 0;
      return;
    }
    if (++this.seen <= WARMUP || now < this.cooldownUntil) return;

    if (dt >= MIN_PERIOD && dt < this.period) {
      this.period = Math.min(MAX_PERIOD, Math.max(MIN_PERIOD, dt));
    }
    this.n++;
    if (dt > this.period * 1.6) this.late++;
    if (dt > 100) this.long++;
    if (this.n < WINDOW) return;

    const lateFrac = this.late / this.n;
    const severe = lateFrac > 0.5 || this.long >= 3;
    const slow = lateFrac > 0.25;
    this.n = this.late = this.long = 0;

    if (slow || severe) {
      this.cleanStreak = 0;
      this.slowStreak++;
      if (severe || this.slowStreak >= 2) {
        this.slowStreak = 0;
        this.step(+1, now);
      }
    } else {
      this.slowStreak = 0;
      if (lateFrac < 0.03) {
        // a long run of smooth windows: carefully try one level better
        if (
          ++this.cleanStreak >= UPGRADE_CLEAN_WINDOWS &&
          this.level > this.minLevel &&
          now - this.lastChangeAt > 20000
        ) {
          this.cleanStreak = 0;
          this.step(-1, now);
        }
      } else {
        this.cleanStreak = 0;
      }
    }
  }

  private step(dir: 1 | -1, now: number) {
    const next = Math.min(LADDER.length - 1, Math.max(0, this.level + dir));
    if (next === this.level) return;
    if (dir > 0 && this.lastWasUpgrade && now - this.lastChangeAt < 30000) {
      this.minLevel = next; // the better level did not hold: never try it again
    }
    this.lastWasUpgrade = dir < 0;
    this.level = next;
    this.lastChangeAt = now;
    this.cooldownUntil = now + COOLDOWN_MS;
    this.n = this.late = this.long = 0;
    this.onChange(next);
  }
}

/* ═══════════════════════════ LOAD ONCE, BEFORE DRAWING ════════════════════ */

const sleep = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** decoded image, or null when it is missing / too slow (the board then shows its grid) */
export async function loadImageOnce(
  src: string,
  timeoutMs = 2500,
): Promise<HTMLImageElement | null> {
  const img = new Image();
  img.decoding = "async";
  const done = new Promise<HTMLImageElement | null>((resolve) => {
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
  img.src = src;
  const result = await Promise.race([done, sleep(timeoutMs).then(() => null)]);
  if (!result) return null;
  try {
    await img.decode();
  } catch {
    /* already usable */
  }
  return img;
}

/** waits (max `timeoutMs`) until the fonts the boards / the sign use are ready */
export async function whenFontsReady(timeoutMs = 2200): Promise<boolean> {
  if (!document.fonts) return true;
  const ready = Promise.all([
    document.fonts.load('76px "Kaushan Script"').catch(() => []),
    document.fonts.ready,
  ]).then(() => true);
  return Promise.race([ready, sleep(timeoutMs).then(() => false)]);
}
