import React, { useEffect, useRef } from "react";
import { createDotField } from "../PreFooterDots/dotField";
import styles from "./FooterDots.module.css";

/**
 * Background of the Footer: the same 3D gravity-wave dot field as the
 * PreFooter banner, but without the portrait (dots only). It follows the
 * light / dark theme, and shares its waves with the RainWindow so the rain
 * moves together with the dots.
 *
 * It fills the <footer> (position: absolute; inset: 0), never blocks clicks,
 * and listens to the pointer on the <footer> itself.
 */
export const FooterDots: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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
    return () => field.destroy();
  }, []);

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
};

export default FooterDots;
