import React, { useEffect, useRef } from "react";
import { siteContent } from "../../../content/siteContent";
import { ThemeToggle } from "../../../components/ThemeToggle/ThemeToggle";
import type { Theme } from "../../../hooks/useTheme";
import logoImg from "../../../assets/logo/KE-LOGO-.png";
import styles from "./Experience.module.css";

export interface ExperienceProps {
  onBack: () => void;
  theme: Theme;
  onToggleTheme: (e?: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Experience: React.FC<ExperienceProps> = ({
  onBack,
  theme,
  onToggleTheme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { professionalOverview, meta } = siteContent;
  const experiences = professionalOverview.experiences;

  // Lock body scroll while subpage is open & handle Escape key
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onBack]);

  const handleScrollTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div ref={containerRef} className={styles.pageContainer}>
      {/* Background atmosphere */}
      <div className={styles.backgroundAtmosphere} aria-hidden="true" />

      {/* Top Navigation Bar:
          Left: KE Logo button (calls onBack)
          Right: Dark/Light Mode Toggle + 'X' Close Button
      */}
      <header className={styles.topNav}>
        <div className={styles.topNavInner}>
          <button
            type="button"
            onClick={onBack}
            className={styles.brandMark}
            aria-label="Return to portfolio overview"
            title="Return to portfolio"
          >
            <img
              src={logoImg}
              alt="KE Logo"
              className={styles.brandLogoSmall}
              width={28}
              height={28}
            />
          </button>

          <div className={styles.topNavActions}>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button
              type="button"
              onClick={onBack}
              className={styles.navCloseBtn}
              aria-label="Close Experience page"
              title="Close (Esc)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Subheader */}
        <div className={styles.subHeaderRow}>
          <div className={styles.titleRow}>
            <span className={styles.titleAccentBar} aria-hidden="true" />
            <h1 className={styles.pageTitle}>Experience</h1>
          </div>
          <p className={styles.pageDescription}>
            A documented chronological timeline of professional software
            development, enterprise IT support, and accredited academic systems
            engineering.
          </p>
        </div>

        {/* Minimalist Architectural Scroll Timeline Stream */}
        <section
          aria-label="Experience timeline"
          className={styles.timelineStream}
        >
          {experiences.map((item) => (
            <article key={item.id} className={styles.timelineItem}>
              {/* Timeline Axis Node */}
              <div className={styles.timelineNode} aria-hidden="true" />

              {/* Item Header */}
              <div className={styles.itemHeader}>
                <div className={styles.itemMetaRow}>
                  <span className={styles.periodMono}>{item.period}</span>
                  <span className={styles.typeBadge}>{item.type}</span>
                </div>
                <h2 className={styles.roleTitle}>{item.role}</h2>
                <div className={styles.companyRow}>
                  <span className={styles.companyName}>{item.company}</span>
                  {item.institution && item.institution !== item.company && (
                    <>
                      <span
                        className={styles.companyDivider}
                        aria-hidden="true"
                      >
                        ·
                      </span>
                      <span>{item.institution}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Narrative Context */}
              <p className={styles.itemNarrative}>{item.narrative}</p>

              {/* Key Responsibilities */}
              <div className={styles.responsibilitiesBlock}>
                <span className={styles.blockHeading}>
                  Key Responsibilities
                </span>
                <ul className={styles.responsibilitiesList}>
                  {item.responsibilities.map((resp, idx) => (
                    <li key={idx} className={styles.responsibilityItem}>
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Highlights Strip */}
              <div className={styles.highlightsBox}>
                <span className={styles.blockHeading}>Notable Outcomes</span>
                {item.keyHighlights.map((highlight, idx) => (
                  <div key={idx} className={styles.highlightItem}>
                    <span className={styles.highlightDot} aria-hidden="true" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>

              {/* Skills / Tech Used */}
              <div
                className={styles.skillsRow}
                aria-label="Relevant technologies"
              >
                {item.skills.map((skill) => (
                  <span key={skill} className={styles.skillPill}>
                    {skill}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>

      {/* Page Footer */}
      <footer className={styles.pageFooter}>
        <div className={styles.footerInner}>
          <span className={styles.footerText}>
            © 2026 {meta.name} • Experience & Career Timeline
          </span>
          <button
            type="button"
            onClick={handleScrollTop}
            className={styles.footerBackTop}
          >
            <span>Back to top</span>
            <span aria-hidden="true">↑</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Experience;
