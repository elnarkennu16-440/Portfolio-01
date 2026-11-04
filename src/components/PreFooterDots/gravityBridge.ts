/**
 * gravityBridge.ts
 * Tiny shared link between the footer dot field and the RainWindow.
 * The dot field publishes "how much is the sheet bent at this screen point";
 * the RainWindow reads it so the rain streaks and drops move with the gravity
 * waves. If no dot field is mounted, nothing happens.
 */

export interface GravitySample {
  /** sideways shift in px (already points toward the cursor "well") */
  x: number;
  /** vertical shift in px */
  y: number;
  /** wave height in px (negative = pulled away from the viewer) */
  h: number;
}

export interface GravityBridge {
  /** true only while the waves are moving (idle = zero cost for the rain) */
  active: boolean;
  /** fills `out` for a point given in viewport (client) coordinates */
  sample: (clientX: number, clientY: number, out: GravitySample) => void;
}

let current: GravityBridge | null = null;

export const setGravityBridge = (bridge: GravityBridge | null): void => {
  current = bridge;
};

export const getGravityBridge = (): GravityBridge | null => current;
