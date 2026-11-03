import * as THREE from "three";
import { BOARD_A, BOARD_B, CAT, SIGN_LAYOUTS } from "./aboutSceneParts";

/* ────────────────────────────────────────────────────────────────────────────
 * aboutSceneConfig.ts — every tunable number of the About street scene in ONE
 * place (camera, reveal timing, tour, theme looks). Same idea as the hero's
 * sceneConfig.ts. The engine that uses these is aboutEngine.ts.
 * Device-dependent quality (resolution, fps, MSAA ...) lives in aboutQuality.ts.
 * ──────────────────────────────────────────────────────────────────────────── */

export const GITHUB_IMAGE_SRC = "/images/Github-Contribution.png";

/* ═══════════════════════════ TUNING ═══════════════════════════════════════ */
export const FOG_COLOR = 0x121214;
export const FOG_DENSITY = 0.017;
export const FOG_START_DENSITY = 0.085;
export const START_POS = new THREE.Vector3(-34, 15, 36);
export const START_TARGET = new THREE.Vector3(4, 1.5, -8);
export const END_POS = new THREE.Vector3(-15, 1.8, 11);
export const END_TARGET = new THREE.Vector3(5, 2.7, -9);
export const PARALLAX_X = 0.8;
export const PARALLAX_Y = 0.3;
export const REDUCED_T = 100;

export const TOUR_MS = 5200;
export const TOUR_TAN_V = Math.tan(THREE.MathUtils.degToRad(23));
// Phone tour order: the cat + comment sign FIRST (it needs the longest time), then the
// GitHub board, then "this platform". The index of a shot = its position in this list.
export const SHOTS = ["The cat", "GitHub activity", "This platform"] as const;
export const SHOT_COUNT = SHOTS.length;
export const CAT_SHOT = 0; // index of "The cat" in SHOTS
export const BOARD_A_SHOT = 1; // index of "GitHub activity" in SHOTS
export const CAT_SHOT_MS = 16000; // phone tour: the cat shot stays longer so the sign can be read
export const SIGN_SHOW_T = 3.7; // seconds after the reveal starts: the sign pops out of the cat
export const TYPE_STEP = 0.03; // seconds per typed letter (desktop)
export const TYPE_STEP_TOUR = 0.016; // phone tour: a bit faster
// PERF: the scene is built quietly in the background this long after the page has
// loaded (instead of while the visitor scrolls into About). Set to -1 to turn off.
export const PREBUILD_AFTER_LOAD_MS = 1200;
// REVEAL: how fast the intro plays (1 = the old speed). Only the reveal ramps are
// sped up; traffic, cat idle, lamps etc. keep their normal speed afterwards.
export const REVEAL_SPEED = 1.6;
// REVEAL: it starts as soon as this much of the section is on screen (was 20 %), so
// the first (almost empty) moments happen while the section is still scrolling in.
export const REVEAL_RATIO = 0.1;
// phone tour: the cat is the FIRST shot, so it (and its sign) come out much earlier
export const TOUR_CAT_POP_T = 1.0;
export const SIGN_SHOW_TOUR_T = 2.3;

export const MIN_DPR = 1;
export const SHADOW_FREEZE_T = 4.4;
export const VISIBLE_RATIO = 0.08; // the loop runs only when >= 8% of the section is on screen
// PERF: while About is only half on screen (still scrolling in, the hero is drawing too)
// it draws at 30 fps; from this share on it uses its full frame rate.
export const FULL_RATE_RATIO = 0.5;

// Automatic quality governor (see aboutEngine.ts). A window = this many drawn frames.
export const ADAPT_AFTER_T = 2; // seconds after the reveal started (the first bakes are spiky)
export const ADAPT_WINDOW = 30;
export const SLOW_FACTOR = 1.35; // a window is "slow" when avg frame > target frame × this
export const DPR_STEP = 0.82; // every slow window lowers the resolution by 18 %

// FIX (blank / never appears): compileAsync had no time limit. If a phone GPU driver never
// reports "done", the build waited forever and the canvas stayed empty until a refresh.
export const COMPILE_TIMEOUT_MS = 10000;
// FIX (hang on the next section): while Works rises over About, About is still on screen
// for IntersectionObserver, so it kept drawing at full rate behind the cover.
// 0 = Works not touching About, 1 = About fully covered.
export const COVER_SLOW_AT = 0.4; // from here on About draws at 30 fps (it is dimming anyway)
export const COVER_PAUSE_AT = 0.995; // fully covered: no drawing at all
// FIX (blank): a build step that throws used to be swallowed silently (blank for good).
export const BOOT_RETRIES = 3;

export const BASE_TAN_V = Math.tan(THREE.MathUtils.degToRad(20));
export const TAN_H = BASE_TAN_V * (16 / 9);

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const seg = (t: number, start: number, dur: number) =>
  clamp01((t - start) / dur);
export const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeOutExpo = (x: number) =>
  x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
export const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export const FLICKER = [0, 0.9, 0.15, 1, 0.35, 1, 0.1, 1];
export const flicker = (t: number, start: number) => {
  const x = t - start;
  if (x < 0) return 0;
  if (x > 0.9) return 1;
  return FLICKER[
    Math.min(FLICKER.length - 1, Math.floor((x / 0.9) * FLICKER.length))
  ];
};

/* ═══════════════════════════ THEME (light / dark) ═════════════════════════
 * The scene used to be hard-coded dark. It now follows the site theme: the
 * "dark" look below is EXACTLY the old one; "light" matches the Hero's light mode
 * (cars, cat and billboards stay dark). Tune the light look here.
 * IMPORTANT: LOOKS.light.bg must equal --about-bg (light) in About.module.css. */
export type ThemeName = "dark" | "light";
export interface Look {
  bg: number; // sky + fog colour
  hemiSky: number;
  hemiGround: number;
  hemiI: number;
  keyColor: number;
  keyI: number;
  rimColor: number;
  rimI: number;
  exposure: number;
  glow: number; // 1 = lamp glow / lit windows / dust on, 0 = off (invisible on light)
}
export const LOOKS: Record<ThemeName, Look> = {
  dark: {
    bg: FOG_COLOR,
    hemiSky: 0x59606c,
    hemiGround: 0x0a0a0b,
    hemiI: 0.55,
    keyColor: 0xcfd5df,
    keyI: 2.4,
    rimColor: 0x8e95a3,
    rimI: 1.1,
    exposure: 0.95,
    glow: 1,
  },
  light: {
    bg: 0xe6e6e9,
    hemiSky: 0xffffff,
    hemiGround: 0xb4b4ba,
    hemiI: 1.5,
    keyColor: 0xffffff,
    keyI: 2.6,
    rimColor: 0xffffff,
    rimI: 0.6,
    exposure: 1.0,
    glow: 0,
  },
};

/** Same string as in ThemeToggle.tsx (it announces every theme change). */
export const THEME_EVENT = "kennu:themechange";

/** The site theme = the nearest data-theme attribute (the toggle's own contract).
 *  No attribute (or "light") = light mode, exactly like ThemeToggle.module.css. */
export const readTheme = (from: Element | null): ThemeName => {
  const holder = from?.closest("[data-theme]") ?? document.documentElement;
  return holder.getAttribute("data-theme") === "dark" ? "dark" : "light";
};

export function poseForShot(
  shot: number,
  aspect: number,
  pos: THREE.Vector3,
  target: THREE.Vector3,
) {
  if (shot === CAT_SHOT) {
    // frame the cat AND the 3D comment sign above it (sign ≈ 90 % of the screen width)
    const dist = THREE.MathUtils.clamp(
      SIGN_LAYOUTS.tall.bodyW / (0.9 * 2 * TOUR_TAN_V * aspect),
      4.6,
      10.5,
    );
    pos.set(CAT.x + dist * 0.147, 1.15, CAT.z + dist);
    target.set(CAT.x, 1.65, CAT.z);
    return;
  }
  const b = shot === BOARD_A_SHOT ? BOARD_A : BOARD_B;
  const cy = b.postH + b.h / 2;
  const nx = Math.sin(b.yaw);
  const nz = Math.cos(b.yaw);
  const rx = Math.cos(b.yaw);
  const rz = -Math.sin(b.yaw);
  const dist = Math.max(14, ((b.w / 2) * 1.14) / (TOUR_TAN_V * aspect));
  pos.set(
    b.x + nx * dist + rx * dist * 0.17,
    1.9,
    b.z + nz * dist + rz * dist * 0.17,
  );
  target.set(b.x, cy - 0.16 * 2 * TOUR_TAN_V * dist, b.z);
}
