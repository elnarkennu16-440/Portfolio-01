import React, { useState, useRef, useEffect } from "react";
import { siteContent, CapabilityGroup } from "../../content/siteContent";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import {
  CapabilityIcon,
  CapabilityIconDefs,
  CapabilityIconKey,
} from "./CapabilityIcons";
import styles from "./Capabilities.module.css";

export const Capabilities: React.FC = () => {
  const { capabilities, meta } = siteContent;
  // Layout follows the sketch: columns 1-3, each column stacks its categories
  const columns: CapabilityGroup[][] = [1, 2, 3].map((col) =>
    capabilities.groups.filter((g) => g.column === col),
  );
  let cardIndex = 0; // used only to stagger the reveal animation
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
      {/* Shared gradients for the 3D capability icons (invisible, takes no space) */}
      <CapabilityIconDefs />

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

        {/* 3 columns, each with stacked categories (matches the sketch) */}
        <div className={styles.capabilitiesGrid}>
          {columns.map((column, colIndex) => (
            <div key={colIndex} className={styles.column}>
              {column.map((category) => (
                <div
                  key={category.category}
                  className={styles.categoryCard}
                  style={{ "--i": cardIndex++ } as React.CSSProperties}
                >
                  <div className={styles.categoryHeader}>
                    <h3 className={styles.categoryTitle}>
                      {category.category}
                    </h3>
                  </div>

                  <ul className={styles.iconGrid}>
                    {category.items.map((item) => (
                      <li
                        key={item.name}
                        className={styles.iconTile}
                        tabIndex={0}
                      >
                        <CapabilityIcon
                          iconKey={item.icon as CapabilityIconKey}
                        />
                        <span className={styles.iconLabel}>{item.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
