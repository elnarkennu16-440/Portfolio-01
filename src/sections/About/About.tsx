import React from "react";
import { siteContent } from "../../content/siteContent";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { getPlaceholderDebugAttr } from "../../utils/debugContent";
import { AboutScene } from "../../components/AboutScene/AboutScene";
import styles from "./About.module.css";

/* ────────────────────────────────────────────────────────────────────────────
 * ABOUT — a dark 3D street (AboutScene) with clean paragraph text on top.
 * ──────────────────────────────────────────────────────────────────────────── */

export const About: React.FC = () => {
  const { about } = siteContent;
  const { elementRef: sectionRef, isRevealed } = useScrollReveal<HTMLElement>({
    threshold: 0.3,
  });

  return (
    <section
      id="about"
      ref={sectionRef}
      className={`${styles.aboutSection} ${isRevealed ? styles.isRevealed : ""}`}
      aria-label="About Kennu Elnar"
      data-debug-content={getPlaceholderDebugAttr(about.status)}
    >
      <AboutScene className={styles.scene} />
      <div className={styles.atmosphere} aria-hidden="true" />

      {/* Screen readers header */}
      <h2 className={styles.srOnly}>About</h2>

      <div className="container">
        <div
          className={`${styles.layer} ${isRevealed ? styles.isRevealed : ""}`}
        >
          <div className={styles.subtitleWrapper}>
            <span className={styles.subtitleLine}></span>
            <span className={styles.subtitleText}>ABOUT — 2026</span>
          </div>
          <div className={styles.textCard}>
            <p className={styles.lead}>
              I maintain this platform as an open repository to document my
              background, practical work, and technical development. Instead of
              leaving projects confined to private directories, this space
              serves as an accessible record of my hands-on exploration and
              steady learning curve. I place high value on structural clarity
              and consistent routines. Much of my time involves refining
              interface behavior, addressing edge cases deliberately, and
              building applications with longevity and clean organization in
              mind.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
