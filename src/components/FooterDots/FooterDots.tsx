import React, { useEffect, useRef, useState } from "react";
import { createDotField } from "../PreFooterDots/dotField";
import styles from "./FooterDots.module.css";

/**
 * Background of the Footer: the same 3D gravity-wave dot field as the PreFooter
 * banner, but without the portrait (dots only). It follows the light / dark
 * theme, and shares its waves with the RainWindow so the rain moves together
 * with the dots.
 *
 * It fills the <footer> (position: absolute; inset: 0), never blocks clicks,
 * and listens to the pointer on the <footer> itself.
 *
 * WebGL context rule (phones allow very few live contexts): the context is only
 * created while the footer is near the screen, and handed back when it is far away.
 */
export const FooterDots: React.FC = () => {
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

    const host =
      (root.closest("footer") as HTMLElement | null) ??
      root.parentElement ??
      root;
    const field = createDotField({
      canvas,
      host,
      theme: "auto",
      publishGravity: true,
    });
    return () => {
      field.destroy();
      /* free the GPU context now; a new canvas element is made next time */
      const g = canvas.getContext("webgl") as WebGLRenderingContext | null;
      g?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [active]);

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      {active && <canvas ref={canvasRef} className={styles.canvas} />}
    </div>
  );
};

export default FooterDots;
