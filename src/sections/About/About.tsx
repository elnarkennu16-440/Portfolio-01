import React, { useEffect, useState } from "react";
import { siteContent } from "../../content/siteContent";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { getPlaceholderDebugAttr } from "../../utils/debugContent";
import { AboutScene } from "../../components/AboutScene/AboutScene";
import styles from "./About.module.css";

/* ────────────────────────────────────────────────────────────────────────────
 * ABOUT — a dark 3D street (AboutScene) with a translucent speech bubble
 * (the "comment sign") pointing at the cat. The paragraph types itself in.
 * ──────────────────────────────────────────────────────────────────────────── */

const ABOUT_TEXT =
  "I maintain this platform as an open repository to document my background, practical work, and technical development. Instead of leaving projects confined to private directories, this space serves as an accessible record of my hands-on exploration and steady learning curve. I place high value on structural clarity and consistent routines. Much of my time involves refining interface behavior, addressing edge cases deliberately, and building applications with longevity and clean organization in mind.";

/* Typing timing — palitan kung gusto mong mas mabilis / mas mabagal */
const TYPE_DELAY_MS = 900; // hintay bago magsimula mag-type
const TYPE_SPEED_MS = 30; // ms bawat letra (mas mababa = mas mabilis)

/** Returns how many characters of `text` are currently "typed". */
function useTypewriter(text: string, active: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setCount(text.length);
      return;
    }

    let raf = 0;
    let startedAt = 0;

    const tick = (now: number) => {
      if (!startedAt) startedAt = now;
      const elapsed = now - startedAt - TYPE_DELAY_MS;
      const next = Math.min(
        text.length,
        Math.max(0, Math.floor(elapsed / TYPE_SPEED_MS)),
      );
      setCount(next);
      if (next < text.length) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, text]);

  return count;
}

export const About: React.FC = () => {
  const { about } = siteContent;
  const { elementRef: sectionRef, isRevealed } = useScrollReveal<HTMLElement>({
    threshold: 0.3,
  });

  /* Latch: once revealed, typing starts and is never reset by scrolling away */
  const [hasRevealed, setHasRevealed] = useState(false);
  useEffect(() => {
    if (isRevealed) setHasRevealed(true);
  }, [isRevealed]);

  const typedCount = useTypewriter(ABOUT_TEXT, hasRevealed);
  const isDone = typedCount >= ABOUT_TEXT.length;

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

      {/* Speech bubble (comment sign) pointing at the cat */}
      <div className={`${styles.bubble} ${hasRevealed ? styles.bubbleIn : ""}`}>
        <div className={styles.bubbleBody}>
          {/* Visible, animated copy. The untyped remainder stays in the flow
              (hidden) so the bubble never changes size while typing. */}
          <p className={styles.lead} aria-hidden="true">
            <span>{ABOUT_TEXT.slice(0, typedCount)}</span>
            {!isDone && <span className={styles.caret} />}
            <span className={styles.untyped}>
              {ABOUT_TEXT.slice(typedCount)}
            </span>
          </p>
        </div>
        <span className={styles.bubbleTail} aria-hidden="true" />
      </div>

      {/* Full text for screen readers */}
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
