import React from "react";
import { REAL_TECH_ITEMS } from "./RealTechIcons";
import styles from "./TechMarquee.module.css";

// Wave offset between neighbouring icons. Scaled together with the spin duration
// in the CSS (3.2s -> 4.8s, so 0.28s -> 0.42s) to keep the exact same wave look, just slower.
const WAVE_STEP_SECONDS = 0.42;

export const TechMarquee: React.FC = () => {
  return (
    <section
      className={styles.techMarqueeSection}
      aria-label="Technology Stack Sliding Ribbon"
    >
      <div className={styles.marqueeTrack}>
        {/* Primary Set */}
        <div className={styles.marqueeGroup}>
          {REAL_TECH_ITEMS.map((item, index) => (
            <div
              key={`g1-${item.id}-${index}`}
              className={styles.marqueeItem}
              style={{
                animationDelay: `${(index % REAL_TECH_ITEMS.length) * WAVE_STEP_SECONDS}s`,
              }}
              title={item.name}
            >
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
              style={{
                animationDelay: `${(index % REAL_TECH_ITEMS.length) * WAVE_STEP_SECONDS}s`,
              }}
              title={item.name}
            >
              {item.icon}
              <span className={styles.srOnly}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
