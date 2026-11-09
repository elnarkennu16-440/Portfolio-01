import React, { useEffect, useRef, useState } from "react";
import { createDotField } from "./dotField";
import styles from "./PreFooterDots.module.css";

/* Tuning for the wide background (this banner only) */
const FILL_TONE = 0.85; // 0..1 : lower = darker / dimmer image (text reads better)
const FOCUS_X = 0.5; // 0 = keep the left of the image, 1 = keep the right
const FOCUS_Y = 0.35; // 0 = keep the top of the image, 1 = keep the bottom (face is usually higher up)

/* The dot picture is STILL (no gravity waves / cursor movement). Reveal speed:
   0 = the picture is simply there, complete, before it scrolls into view (no delay);
   e.g. 0.8 = a short fade-in. */
const REVEAL_SECONDS = 0;

/* The image is requested + decoded as soon as the page mounts (not only when the banner is
   near the screen), so the dots do not wait for the download when you scroll here.
   Kept in memory so the browser does not drop it. */
const preloaded = new Map<string, HTMLImageElement>();
const preloadImage = (src: string) => {
  if (!src || preloaded.has(src)) return;
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  preloaded.set(src, img);
  img.decode?.().catch(() => undefined);
};

interface PreFooterDotsProps {
  /** Prefooter-Background-Image.png (imported in PreFooterBanner.tsx) */
  imageSrc: string;
  /** Ref of the text block, so the portrait stays clear of the text */
  textRef?: { current: HTMLElement | null };
}

/**
 * Background of the PreFooter banner: your portrait made of gray dots (a still picture,
 * no cursor / touch movement).
 * It fills its parent (position: absolute; inset: 0) and never blocks clicks.
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
    preloadImage(imageSrc);
  }, [imageSrc]);

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
      // still picture: no gravity waves, no cursor / touch movement (only this banner uses it)
      still: true,
      revealSeconds: REVEAL_SECONDS,
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
