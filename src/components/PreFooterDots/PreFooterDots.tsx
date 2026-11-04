import React, { useEffect, useRef } from "react";
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
 */
export const PreFooterDots: React.FC<PreFooterDotsProps> = ({
  imageSrc,
  textRef,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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
    return () => field.destroy();
  }, [imageSrc, textRef]);

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
};

export default PreFooterDots;
