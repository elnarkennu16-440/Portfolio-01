import React, { useEffect, useRef, useState } from "react";
import { createDotField } from "./dotField";
import styles from "./PreFooterDots.module.css";

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
