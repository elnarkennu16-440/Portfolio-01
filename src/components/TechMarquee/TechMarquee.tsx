import React, { useEffect, useRef, useState } from "react";
import { REAL_TECH_ITEMS } from "./RealTechIcons";
import styles from "./TechMarquee.module.css";

// Wave offset between neighbouring icons. Scaled together with the spin duration
// in the CSS (3.2s -> 4.8s, so 0.28s -> 0.42s) to keep the exact same wave look, just slower.
const WAVE_STEP_SECONDS = 0.42;

export const TechMarquee: React.FC = () => {
  // Wave reveal: starts once, when the ribbon scrolls into view
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`${styles.techMarqueeSection} ${isRevealed ? styles.isRevealed : ""}`}
      aria-label="Technology Stack Sliding Ribbon"
    >
      <div className={styles.marqueeTrack}>
        {/* Primary Set */}
        <div className={styles.marqueeGroup}>
          {REAL_TECH_ITEMS.map((item, index) => (
            <div
              key={`g1-${item.id}-${index}`}
              className={styles.marqueeItem}
              style={
                {
                  animationDelay: `${(index % REAL_TECH_ITEMS.length) * WAVE_STEP_SECONDS}s`,
                  // the icon INSIDE the slab uses this delay for the same wave
                  "--wd": `${(index % REAL_TECH_ITEMS.length) * WAVE_STEP_SECONDS}s`,
                  // position in the reveal wave (only the first ones are on screen)
                  "--ri": Math.min(index, 12),
                  // zigzag formation: -1 = up, 1 = down
                  "--zz": index % 2 === 0 ? -1 : 1,
                } as React.CSSProperties
              }
              title={item.name}
            >
              <span className={styles.stripes} aria-hidden="true" />
              {/* soft shadow of the icon on the slab (shown on hover) */}
              <span className={styles.iconShadow} aria-hidden="true">
                {item.icon}
              </span>
              {item.icon}
              <span className={styles.srOnly}>{item.name}</span>
            </div>
          ))}
        </div>

        {/* Duplicate Set for Seamless Continuous Loop */}
        <div className={styles.marqueeGroup} aria-hidden="true">
          {REAL_TECH_ITEMS.map((item, index) => (
            <div
              key={`g2-${item.id}-${index}`}
              className={styles.marqueeItem}
              style={
                {
                  animationDelay: `${(index % REAL_TECH_ITEMS.length) * WAVE_STEP_SECONDS}s`,
                  "--wd": `${(index % REAL_TECH_ITEMS.length) * WAVE_STEP_SECONDS}s`,
                  // position in the reveal wave (only the first ones are on screen)
                  "--ri": Math.min(index, 12),
                  // zigzag continues across the seam between the two sets
                  "--zz": (index + REAL_TECH_ITEMS.length) % 2 === 0 ? -1 : 1,
                } as React.CSSProperties
              }
              title={item.name}
            >
              <span className={styles.stripes} aria-hidden="true" />
              {/* soft shadow of the icon on the slab (shown on hover) */}
              <span className={styles.iconShadow} aria-hidden="true">
                {item.icon}
              </span>
              {item.icon}
              <span className={styles.srOnly}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
