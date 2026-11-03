/* ────────────────────────────────────────────────────────────────────────────
 * aboutQuality.ts — picks the render quality of the About scene for THIS device.
 *
 * This is the same idea as the hero's `lite` flag (Hero.tsx) + its pixel budget
 * (glScene.ts): phones and weaker laptops get a lighter render, strong desktops
 * keep the full one. The LOOK is the same everywhere (same scene, same lights,
 * same textures); only resolution, frame rate and a few GPU extras change.
 * Tune the numbers here.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface AboutQuality {
  /** phone / touch screen */
  small: boolean;
  /** phone, tablet or weaker laptop (same test as the hero's `lite`) */
  lite: boolean;
  /** MSAA. Expensive on a big canvas, and dense screens do not need it. */
  antialias: boolean;
  /** highest devicePixelRatio the canvas may use */
  dprMax: number;
  /** the canvas never gets more pixels than this (4K / retina protection) */
  pixelBudget: number;
  /** frame-rate cap (phones: 30, like the hero) */
  fps: number;
  /** shadow map size (the map is baked during the reveal, then frozen) */
  shadowMap: number;
  /** re-bake the shadow map every Nth frame during the reveal */
  shadowStep: number;
  /** floating dust motes */
  dust: number;
  /** texture sharpness at grazing angles */
  aniso: number;
}

export function detectQuality(): AboutQuality {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const deviceDpr = window.devicePixelRatio || 1;
  const small =
    window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;
  const lite =
    small ||
    window.innerWidth < 992 ||
    (nav.hardwareConcurrency ?? 8) <= 4 ||
    (nav.deviceMemory ?? 8) <= 4;

  if (small) {
    return {
      small,
      lite,
      antialias: false,
      dprMax: 1.25,
      pixelBudget: 1_900_000,
      fps: 30,
      shadowMap: 1024,
      shadowStep: 8,
      dust: 90,
      aniso: 4,
    };
  }
  if (lite) {
    return {
      small,
      lite,
      antialias: deviceDpr < 1.25,
      dprMax: 1.25,
      pixelBudget: 2_600_000,
      fps: 60,
      shadowMap: 1536,
      shadowStep: 6,
      dust: 120,
      aniso: 4,
    };
  }
  return {
    small,
    lite,
    antialias: deviceDpr < 1.25,
    dprMax: 1.5,
    pixelBudget: 3_600_000,
    fps: 60,
    shadowMap: 2048,
    shadowStep: 4,
    dust: 180,
    aniso: 8,
  };
}
