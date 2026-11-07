import React, { useEffect, useRef, useState } from "react";
import { createDotField } from "./dotField";
import styles from "./PreFooterDots.module.css";

/* Tuning for the wide background (this banner only) */
const FILL_TONE = 0.85; // 0..1 : lower = darker / dimmer image (text reads better)
const FOCUS_X = 0.5; // 0 = keep the left of the image, 1 = keep the right
const FOCUS_Y = 0.35; // 0 = keep the top of the image, 1 = keep the bottom (face is usually higher up)

/* Calm zone: the figure (head + shoulders) and a wide gap around it get NO gravity movement,
   so it is not bent when the cursor goes over it. The dots farther away move as before.
   CALM_AMOUNT: 0..1 -> 1 = no movement at all inside the zones, 0 = feature off.
   CALM_ZONES are ellipses (x, y = center, rx, ry = radius, in px) drawn on a section of
   CALM_REF size. Inside the ellipse there is no movement; the movement fades back in over
   the next ~30% outside it. Bigger rx / ry = bigger calm gap around the figure.
   They are attached to the image, so they follow it on every screen size. */
const CALM_AMOUNT = 1;
const CALM_REF = { w: 1219, h: 520 };
const CALM_ZONES = [
  { x: 680, y: 258, rx: 360, ry: 215 }, // head + wide gap around it
  { x: 676, y: 548, rx: 430, ry: 200 }, // shoulders / body + wide gap
];

interface PreFooterDotsProps {
  /** Prefooter-Background-Image.png (imported in PreFooterBanner.tsx) */
  imageSrc: string;
  /** Ref of the text block, so the portrait stays clear of the text */
  textRef?: { current: HTMLElement | null };
}

/**
 * Background of the PreFooter banner: your portrait made of gray dots, with a
 * soft 3D gravity-wave that follows the cursor / touch.
 * It fills its parent (position: absolute; inset: 0) and never blocks clicks:
 * pointer events are listened to on the surrounding <section>.
 *
 * WebGL context rule (phones allow very few live contexts): the context is only
 * created while this banner is near the screen, and handed back when it is far away.
 */
export const PreFooterDots: React.FC<PreFooterDotsProps> = ({
  imageSrc,
  textRef,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (typeof IntersectionObserver === "undefined") {
      setActive(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        setActive(e.isIntersecting);
      },
      { rootMargin: "600px 0px 600px 0px" },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const host = (root.closest("section") as HTMLElement | null) ?? root;
    const field = createDotField({
      canvas,
      host,
      textEl: textRef?.current ?? null,
      imageSrc,
      // wide background mode (only this banner uses it)
      fill: true,
      fillTone: FILL_TONE,
      fillFocusX: FOCUS_X,
      fillFocusY: FOCUS_Y,
      // gravity waves are weakened over the figure (only this banner uses it)
      calm: {
        refW: CALM_REF.w,
        refH: CALM_REF.h,
        amount: CALM_AMOUNT,
        zones: CALM_ZONES,
      },
    });
    return () => {
      field.destroy();
      /* free the GPU context now; a new canvas element is made next time */
      const g = canvas.getContext("webgl") as WebGLRenderingContext | null;
      g?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [active, imageSrc, textRef]);

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      {active && <canvas ref={canvasRef} className={styles.canvas} />}
    </div>
  );
};

export default PreFooterDots;
