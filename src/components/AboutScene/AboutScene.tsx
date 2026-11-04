import React, { useEffect, useRef, useState } from "react";
import styles from "./AboutScene.module.css";
import { AboutController, AboutInput, createAboutScene } from "./aboutGl";

interface AboutSceneProps {
  className?: string;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** light theme = default (no data-theme="dark"), same rule as ThemeToggle */
const isDark = () =>
  document.documentElement.getAttribute("data-theme") === "dark";

/**
 * ABOUT — the 3D street at eye level. Drawn on one <canvas> with WebGL (see
 * aboutGl.ts), so the page only sees a single flat image. The camera follows the
 * scroll: as About slides in under the Hero, it dollies from the Hero's high
 * view down into this street-level POV.
 */
export const AboutScene: React.FC<AboutSceneProps> = ({ className = "" }) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /* phones and weaker devices get the "lite" scene: same look, fewer pieces */
  const [lite] = useState(() => {
    if (typeof window === "undefined") return false;
    const nav = navigator as Navigator & { deviceMemory?: number };
    return (
      window.innerWidth < 992 ||
      (nav.hardwareConcurrency ?? 8) <= 4 ||
      (nav.deviceMemory ?? 8) <= 4
    );
  });

  const inputRef = useRef<AboutInput>({
    mx: 0,
    my: 0,
    progress: 0,
    dark: true,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = rootRef.current?.parentElement;
    if (!canvas || !section) return;

    inputRef.current.dark = isDark();
    const scene: AboutController | null = createAboutScene(canvas, {
      lite,
      input: inputRef,
    });

    /* scroll → how far About has slid into place (0 → 1) */
    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = section.getBoundingClientRect();
      inputRef.current.progress = clamp(
        1 - r.top / Math.max(1, window.innerHeight),
        0,
        1,
      );
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    /* pointer parallax (mouse only) */
    const mouse = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      inputRef.current.mx = clamp(
        ((e.clientX - r.left) / r.width - 0.5) * 2,
        -1,
        1,
      );
      inputRef.current.my = clamp(
        ((e.clientY - r.top) / r.height - 0.5) * 2,
        -1,
        1,
      );
    };
    const onLeave = () => {
      inputRef.current.mx = 0;
      inputRef.current.my = 0;
    };
    if (mouse && !reduce) {
      section.addEventListener("pointermove", onMove, { passive: true });
      section.addEventListener("pointerleave", onLeave);
    }

    /* light / dark toggle */
    const mo = new MutationObserver(() => {
      inputRef.current.dark = isDark();
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      mo.disconnect();
      scene?.dispose();
    };
  }, [lite]);

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
};

export default AboutScene;
