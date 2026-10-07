import React from "react";
import { REAL_TECH_ITEMS } from "./RealTechIcons";
import styles from "./TechMarquee.module.css";

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
                animationDelay: `${(index % REAL_TECH_ITEMS.length) * 0.28}s`,
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
                animationDelay: `${(index % REAL_TECH_ITEMS.length) * 0.28}s`,
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
