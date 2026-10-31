import React, { useEffect, useState } from "react";
import { siteContent } from "../../content/siteContent";
import { HeroScene } from "../../components/HeroScene/HeroScene";

import styles from "./Hero.module.css";

interface HeroProps {
  isIntroDone?: boolean;
}

/** The longest wave-reveal is 3s delay + 2s animation; after this nothing animates any more. */
const REVEAL_TOTAL_MS = 5600;

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

/**
 * Layers (back → front):
 *   1. HeroScene   — the 3D street: KENNU monoliths, road + ELNAR, buildings, billboard
 *   2. atmosphere  — vignette + film grain (CSS only)
 *   3. text layer  — intro sentence, links, scroll cue (real HTML: selectable, accessible)
 *
 * The billboard shows the "Focusing on…" sentence inside the 3D scene. On phones the
 * billboard is hidden and the same sentence is shown as normal text instead.
 */
export const Hero: React.FC<HeroProps> = ({ isIntroDone = true }) => {
  const { hero, meta } = siteContent;

  // PERF: once the text reveal has finished, drop its clip-path / will-change layers
  // (they otherwise stay on top of the animated 3D canvas for the whole visit).
  const [revealDone, setRevealDone] = useState(false);
  useEffect(() => {
    if (!isIntroDone) return;
    const id = window.setTimeout(() => setRevealDone(true), REVEAL_TOTAL_MS);
    return () => window.clearTimeout(id);
  }, [isIntroDone]);

  return (
    <section
      id="hero"
      className={`${styles.heroSection} ${isIntroDone ? styles.introReady : ""} ${
        revealDone ? styles.revealDone : ""
      }`}
      aria-label="Introduction"
    >
      <HeroScene isIntroDone={isIntroDone} className={styles.scene} />
      <div className={styles.atmosphere} aria-hidden="true" />

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
