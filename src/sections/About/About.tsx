import React from "react";
import { siteContent } from "../../content/siteContent";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { getPlaceholderDebugAttr } from "../../utils/debugContent";
import { AboutScene } from "../../components/AboutScene/AboutScene";
import { ABOUT_TEXT } from "../../components/AboutScene/aboutSceneParts";
import styles from "./About.module.css";

/* ────────────────────────────────────────────────────────────────────────────
 * ABOUT — a 3D street (AboutScene). The paragraph is no longer a 2D bubble here:
 * it lives on the 3D comment sign floating above the cat (see aboutSceneParts.ts,
 * buildCommentSign). This file only keeps the section, the label, and a hidden
 * copy of the text for screen readers / SEO.
 * ──────────────────────────────────────────────────────────────────────────── */

export const About: React.FC = () => {
  const { about } = siteContent;
  const { elementRef: sectionRef, isRevealed } = useScrollReveal<HTMLElement>({
    threshold: 0.3,
  });

  return (
    <section
      ref={sectionRef}
      className={`${styles.aboutSection} ${isRevealed ? styles.isRevealed : ""}`}
      aria-label="About Kennu Elnar"
      data-debug-content={getPlaceholderDebugAttr(about.status)}
    >
      <AboutScene className={styles.scene} />
      <div className={styles.atmosphere} aria-hidden="true" />

      {/* Screen readers header */}
      <h2 className={styles.srOnly}>About</h2>

      {/* Full text for screen readers (the visible copy is on the 3D sign) */}
      <p className={styles.srOnly}>{ABOUT_TEXT}</p>

      <div className="container">
        <div
          className={`${styles.layer} ${isRevealed ? styles.isRevealed : ""}`}
        >
          <div className={styles.subtitleWrapper}>
            <span className={styles.subtitleLine}></span>
            <span className={styles.subtitleText}>ABOUT — 2026</span>
          </div>
        </div>
      </div>
    </section>
  );
};
