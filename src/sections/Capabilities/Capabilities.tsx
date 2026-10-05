import React from "react";
import { siteContent, CapabilityGroup } from "../../content/siteContent";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import styles from "./Capabilities.module.css";

export const Capabilities: React.FC = () => {
  const { capabilities, meta } = siteContent;
  const { elementRef, isRevealed } = useScrollReveal<HTMLElement>({
    threshold: 0.1,
  });

  return (
    <section
      id="capabilities"
      ref={elementRef}
      className={`${styles.capabilitiesSection} ${isRevealed ? styles.isRevealed : ""}`}
      aria-label="Technical Capabilities"
    >
      {/* Faint Background Watermark */}
      <div className={`ghostWatermark ${styles.watermark}`} aria-hidden="true">
        {capabilities.faintWatermark}
      </div>

      <div className="container">
        {/* Section Header with Left Accent Bar */}
        <div className={styles.headerRow}>
          <div className={styles.sectionHeader}>
            <div className={styles.titleAccentBar} aria-hidden="true" />
            {capabilities.sectionNumber ? (
              <span className={styles.sectionNumber}>
                {capabilities.sectionNumber}
              </span>
            ) : null}
            <h2 className={styles.sectionTitle}>{capabilities.sectionTitle}</h2>
          </div>
          <div className={styles.headerUnderline} aria-hidden="true" />
        </div>

        <div className={styles.introRow}>
          <p className={styles.introText}>{capabilities.intro}</p>

          <a
            href={meta.resumeUrl}
            download="Elnar_Kennu_Resume.docx"
            className={`pillButton ${styles.downloadCvBtn}`}
            aria-label="Download Kennu Elnar CV (.docx)"
          >
            <span>Download CV</span>
            <span className="arrow" aria-hidden="true">
              ↓
            </span>
          </a>
        </div>

        {/* 3-Column Grid */}
        <div className={styles.capabilitiesGrid}>
          {capabilities.groups.map(
            (group: CapabilityGroup, groupIndex: number) => {
              const formattedIndex = String(groupIndex + 1).padStart(2, "0");

              return (
                <div key={group.category} className={styles.categoryCard}>
                  <div className={styles.categoryHeader}>
                    <h3 className={styles.categoryTitle}>{group.category}</h3>
                  </div>

                  <ul className={styles.itemsList}>
                    {group.items.map((item) => (
                      <li key={item.name} className={styles.itemRow}>
                        <div className={styles.itemHeader}>
                          <span className={styles.itemName}>{item.name}</span>
                          <span className={styles.levelBadge}>
                            {item.level}
                          </span>
                        </div>
                        <p className={styles.itemDescription}>
                          {item.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            },
          )}
        </div>
      </div>
    </section>
  );
};
