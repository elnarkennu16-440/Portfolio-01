import React, { useEffect, useRef, useState } from "react";
import { createDotField } from "../PreFooterDots/dotField";
import styles from "./SectionDots.module.css";

interface SectionDotsProps {
  /**
   * "fill"     the dots fill the parent (use it inside a pinned / viewport-sized stage,
   *            e.g. the sticky stage of Professional Overview).
   * "viewport" the parent is a TALL section (Works, Capabilities): the dots live on a
   *            screen-sized sticky layer, so they stay light and smooth however long
   *            the section is.
   * "scroller" the parent is a full-screen sub page that scrolls INSIDE itself
   *            (position: fixed + overflow-y: auto, like Resume / All Works). The
   *            dots stay in view while the content scrolls, and the page behind
   *            pauses while the sub page is open.
   * Put <SectionDots /> as the FIRST child of the section / stage / sub page.
   */
  mode?: "fill" | "viewport" | "scroller";
  /** Highlight section only: hide the dots over the 3D scene's land (see holeBridge.ts). */
  landHole?: boolean;
}

/**
 * Background only: the same 3D gravity-wave dots as the PreFooter / Footer.
 * - sits behind everything (z-index -1), never blocks clicks or scrolling
 * - the big faint background word (the element marked with `data-dot-mask`)
 *   is drawn as dots and waves together with the field
 * - follows the light / dark theme
 */
export const SectionDots: React.FC<SectionDotsProps> = ({
  mode = "viewport",
  landHole = false,
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* A phone browser allows only a handful of live WebGL contexts at once (about 8 on
     Android Chrome); when a new one is created beyond that, the OLDEST context is
     killed. The oldest one is the hero, so its 3D street went blank. Every dot field
     used to open its context at page load. Now it only holds one while its section is
     near the screen, and gives it back when it is far away. */
  const [active, setActive] = useState(false);
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
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
    io.observe(outer);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const outer = outerRef.current;
    const area = areaRef.current;
    const canvas = canvasRef.current;
    if (!outer || !area || !canvas) return;

    const host = outer.parentElement;
    if (!host) return;

    const field = createDotField({
      canvas,
      host,
      area,
      theme: "auto",
      mask: true,
      maxDpr: 1.5,
      overlay: mode === "scroller",
      landHole,
    });
    return () => {
      field.destroy();
      /* free the GPU context right now (not "some day" when the canvas is garbage
         collected). The canvas element is thrown away, a new one is made next time. */
      const g = canvas.getContext("webgl") as WebGLRenderingContext | null;
      g?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [active, mode, landHole]);

  if (mode === "fill" || mode === "scroller") {
    return (
      <div
        ref={outerRef}
        className={mode === "scroller" ? styles.scroller : styles.fill}
        aria-hidden="true"
      >
        <div ref={areaRef} className={styles.fillArea}>
          {active && <canvas ref={canvasRef} className={styles.canvas} />}
        </div>
      </div>
    );
  }

  return (
    <div ref={outerRef} className={styles.wrap} aria-hidden="true">
      <div ref={areaRef} className={styles.sticky}>
        {active && <canvas ref={canvasRef} className={styles.canvas} />}
      </div>
    </div>
  );
};

export default SectionDots;
