import React, { useState, useRef, useEffect } from "react";
import { siteContent, CapabilityGroup } from "../../content/siteContent";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import styles from "./Capabilities.module.css";

export const Capabilities: React.FC = () => {
  const { capabilities, meta } = siteContent;
  const { elementRef, isRevealed } = useScrollReveal<HTMLElement>({
    threshold: 0.1,
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleItemClick = () => {
    // Small delay ensures native browser download starts before unmounting menu
    setTimeout(() => {
      setIsMenuOpen(false);
    }, 150);
  };

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

          {/* Download CV with DOCX and PDF Format Options */}
          <div className={styles.downloadWrapper} ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`pillButton ${styles.downloadCvBtn}`}
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
              aria-label="Download CV options"
            >
              <span>Download CV</span>
              <span
                className={`${styles.downloadArrow} ${isMenuOpen ? styles.downloadArrowOpen : ""}`}
                aria-hidden="true"
              >
                ↓
              </span>
            </button>

            {isMenuOpen && (
              <div
                className={styles.downloadMenu}
                role="menu"
                aria-label="Download CV options"
              >
                <a
                  href={meta.resumeDocxUrl || "/resume/Elnar_Kennu_Resume.docx"}
                  download="Elnar_Kennu_Resume.docx"
                  role="menuitem"
                  className={styles.menuItem}
                  onClick={handleItemClick}
                >
                  <span className={styles.fileBadge}>DOCX</span>
                  <span className={styles.menuLabel}>Download DOCX</span>
                  <span className={styles.menuArrow} aria-hidden="true">
                    ↓
                  </span>
                </a>

                <a
                  href={meta.resumePdfUrl || "/resume/Kennu-Elnar-Resume.pdf"}
                  download="Kennu-Elnar-Resume.pdf"
                  role="menuitem"
                  className={styles.menuItem}
                  onClick={handleItemClick}
                >
                  <span className={styles.fileBadge}>PDF</span>
                  <span className={styles.menuLabel}>Download PDF</span>
                  <span className={styles.menuArrow} aria-hidden="true">
                    ↓
                  </span>
                </a>
              </div>
            )}
          </div>
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
