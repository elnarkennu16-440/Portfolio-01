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
  const gridRef = useRef<HTMLDivElement>(null);

  // Per-card scroll reveal: each card animates when IT enters the viewport
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const cards = Array.from(
      grid.querySelectorAll<HTMLElement>("[data-reveal-card]"),
    );
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      cards.forEach((card) => card.setAttribute("data-revealed", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "true");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

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
                aria-label="Download Resume options"
              >
                <a
                  href={meta.resumeDocxUrl || "/resume/Elnar-Kennu-Resume.docx"}
                  download="Elnar-Kennu-Resume.docx"
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
                  href={meta.resumePdfUrl || "/resume/Elnar-Kennu-Resume.pdf"}
                  download="Elnar-Kennu-Resume.pdf"
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
        <div className={styles.capabilitiesGrid} ref={gridRef}>
          {columns.map((column, colIndex) => (
            <div key={colIndex} className={styles.column}>
              {column.map((category, rowIndex) => (
                <div
                  key={category.category}
                  className={styles.categoryCard}
                  data-reveal-card
                  style={
                    {
                      "--i": cardIndex++,
                      "--c": colIndex,
                      // desktop: row N of every column lines up across the 3 columns
                      gridColumn: colIndex + 1,
                      gridRow: rowIndex + 1,
                    } as React.CSSProperties
                  }
                >
                  <div className={styles.categoryHeader}>
                    <h3
                      className={styles.categoryTitle}
                      aria-label={category.category}
                    >
                      {/* split per letter (grouped by word) for the wave rise */}
                      {(() => {
                        let ch = 0;
                        return category.category
                          .split(" ")
                          .map((word, wi, words) => (
                            <React.Fragment key={wi}>
                              <span
                                className={styles.titleWord}
                                aria-hidden="true"
                              >
                                {Array.from(word).map((letter, li) => (
                                  <span
                                    key={li}
                                    className={styles.titleChar}
                                    style={
                                      { "--ch": ch++ } as React.CSSProperties
                                    }
                                  >
                                    {letter}
                                  </span>
                                ))}
                              </span>
                              {wi < words.length - 1 ? (ch++, " ") : null}
                            </React.Fragment>
                          ));
                      })()}
                    </h3>
                  </div>

                  <ul className={styles.iconGrid}>
                    {category.items.map((item, itemIndex) => (
                      <li
                        key={item.name}
                        className={styles.iconTile}
                        tabIndex={0}
                        style={
                          {
                            // wave position inside the 4-column icon grid
                            "--col": itemIndex % 4,
                            "--row": Math.floor(itemIndex / 4),
                          } as React.CSSProperties
                        }
                      >
                        <span className={styles.tileInner}>
                          <CapabilityIcon
                            iconKey={item.icon as CapabilityIconKey}
                          />
                          <span className={styles.iconLabel}>{item.name}</span>
                        </span>
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
