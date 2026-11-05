/**
 * holeBridge.ts
 * Link between the Highlight 3D scene and the dot background behind it.
 * The scene publishes its camera + the shape of its "land" (the ground grid);
 * the dot field uses it to hide its dots exactly over the land (in the same 3D
 * view), so the land keeps its own waves and the dots live only around it.
 */

export interface LandHole {
  /** the 3D stage element (the hole only exists inside it) */
  stage: HTMLElement;
  /** camera maths of the scene for the ground plane (same as the scene's vertex shader) */
  a: [number, number, number, number]; // 2x2 matrix, column-major: M0, M1, M4, M5
  b: [number, number];
  c: [number, number];
  e: number;
  persp: number;
  ax: number;
  ay: number;
  /** the land: an ellipse on the ground (scene units) */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** 0..1, grows while the land fades in */
  strength: number;
}

/** fired when the hole changes while nothing is animating (reduced motion) */
export const LAND_HOLE_EVENT = "kennu:landhole";

let current: LandHole | null = null;

export const setLandHole = (hole: LandHole | null): void => {
  current = hole;
};

export const getLandHole = (): LandHole | null => current;
