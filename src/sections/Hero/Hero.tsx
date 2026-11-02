import React, { useEffect, useRef, useState } from "react";
import { siteContent } from "../../content/siteContent";
import { HeroScene } from "../../components/HeroScene/HeroScene";
import type { SceneInput } from "../../components/HeroScene/glScene";

import styles from "./Hero.module.css";

interface HeroProps {
  isIntroDone?: boolean;
}

/** How fast the text wave plays (1 = base speed). Same wave as your old hero. */
const REVEAL_SPEED = 1.6;
/** Longest wave = biggest --d in Hero.module.css (5.4s) + 2s animation, ÷ speed.
 *  After this nothing in the text layer animates anymore. */
const REVEAL_TOTAL_MS = Math.round(((5.4 + 2) / REVEAL_SPEED) * 1000) + 600;

/**
 * Same "line + arrow" connector as the VIEW ALL PROJECTS button in Works.tsx:
 * one continuous stroke — a horizontal line that bends upward into an arrow head (↗).
 */
const ConnectorArrow: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.1"
    strokeLinecap="butt"
    strokeLinejoin="miter"
    aria-hidden="true"
  >
    <path d="M0 15.5H3.5L13.5 5.5" />
    <path d="M6.5 5.5H13.5V12.5" />
  </svg>
);

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/**
 * Layers (back → front):
 *   1. stage   — the WebGL 3D street (HeroScene) + one static shade layer
 *   2. text    — kicker, statement (phones), intro, links (real HTML)
 *
 * The billboard shows the "Focusing on…" sentence inside the 3D scene. On phones the
 * sentence is shown as normal brush-script text instead (same as your old hero).
 */
export const Hero: React.FC<HeroProps> = ({ isIntroDone = true }) => {
  const { hero, meta } = siteContent;
  const sectionRef = useRef<HTMLElement | null>(null);

  /* true the moment the 3D reveal really begins (textures are ready) */
  const [started, setStarted] = useState(false);
  const introReady = isIntroDone && started;

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

  /* Pointer + scroll are only written into this plain object. The scene reads
     it every frame: no React re-render, no DOM writes. */
  const inputRef = useRef<SceneInput>({ mx: 0, my: 0, sc: 0 });

  /* PERF: once the text reveal has finished, drop its clip-path / will-change layers */
  const [revealDone, setRevealDone] = useState(false);
  useEffect(() => {
    if (!introReady) return;
    const id = window.setTimeout(() => setRevealDone(true), REVEAL_TOTAL_MS);
    return () => window.clearTimeout(id);
  }, [introReady]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const mouse = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    if (reduce) return;

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
    const onScroll = () => {
      const r = section.getBoundingClientRect();
      inputRef.current.sc = clamp(-r.top / Math.max(1, r.height), 0, 1);
    };

    if (mouse) {
      section.addEventListener("pointermove", onMove, { passive: true });
      section.addEventListener("pointerleave", onLeave);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className={`${styles.heroSection} ${introReady ? styles.introReady : ""} ${
        revealDone ? styles.revealDone : ""
      }`}
      aria-label="Introduction"
      style={{ "--reveal-speed": REVEAL_SPEED } as React.CSSProperties}
      // read by AboutScene: it builds its 3D scene only after the hero has settled
      data-reveal-done={revealDone ? "true" : "false"}
    >
      {/* 3D street */}
      <div className={styles.stage} aria-hidden="true">
        <HeroScene
          ready={isIntroDone}
          lite={lite}
          inputRef={inputRef}
          onStart={() => setStarted(true)}
        />
        <div className={styles.shade} />
      </div>

      {/* The big 3D letters are drawn in WebGL, so the real heading lives here */}
      <h1 className={styles.srOnly}>Kennu Elnar</h1>

      <div className="container">
        <div className={styles.layer}>
          <div className={styles.copy}>
            <p className={`${styles.reveal} ${styles.kicker}`}>
              Portfolio — 2026
            </p>

            <p className={`${styles.reveal} ${styles.statement}`}>
              Focusing on{" "}
              <span className={styles.underlinedEmphasis}>
                Software Quality
              </span>
              , User Flows, and{" "}
              <span className={styles.underlinedEmphasis}>
                Dependable Web Applications
              </span>
              .
            </p>

            <p className={`${styles.reveal} ${styles.intro}`}>
              Hi, I&apos;m Kennu. I Build Dependable Web Applications. Open for
              Commissions and Freelance work.
            </p>

            <div className={`${styles.reveal} ${styles.links}`}>
              <a href="#works" className={styles.ctaLink}>
                <span className={styles.ctaLabel}>{hero.ctaWorks}</span>
                <ConnectorArrow className={styles.ctaArrow} />
              </a>

              <a
                href={meta.githubUrl || "https://github.com/elnarkennu16-440"}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaLink}
                aria-label="Kennu Elnar GitHub Profile"
              >
                <span className={styles.ctaLabel}>
                  <svg
                    className={styles.ctaGithub}
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  GitHub
                </span>
                <ConnectorArrow className={styles.ctaArrow} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
