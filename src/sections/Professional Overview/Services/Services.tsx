import React, { useEffect, useRef } from "react";
import { siteContent } from "../../../content/siteContent";
import { ThemeToggle } from "../../../components/ThemeToggle/ThemeToggle";
import type { Theme } from "../../../hooks/useTheme";
import logoImg from "../../../assets/logo/KE-LOGO-.png";
import styles from "./Services.module.css";

export interface ServicesProps {
  onBack: () => void;
  theme: Theme;
  onToggleTheme: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenContact?: () => void;
}

export const Services: React.FC<ServicesProps> = ({
  onBack,
  theme,
  onToggleTheme,
  onOpenContact,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { professionalOverview, meta } = siteContent;
  const services = professionalOverview.services;

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

  const handleInquire = () => {
    if (onOpenContact) {
      onOpenContact();
    }
  };

  return (
    <div ref={containerRef} className={styles.pageContainer}>
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
              aria-label="Close Services page"
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
            <h1 className={styles.pageTitle}>Services</h1>
          </div>
          <p className={styles.pageDescription}>
            Focused technical capabilities available for client projects,
            freelance collaborations, front-end implementation, and systematic
            software testing.
          </p>
        </div>

        {/* Services Catalogue */}
        <section
          aria-label="Services catalogue"
          className={styles.servicesList}
        >
          {services.map((service) => (
            <article key={service.number} className={styles.serviceCard}>
              {/* Header */}
              <div className={styles.serviceHeader}>
                <div className={styles.headerLeft}>
                  <span className={styles.serviceNumber}>{service.number}</span>
                  <div className={styles.titleArea}>
                    <span className={styles.serviceCategory}>
                      {service.category}
                    </span>
                    <h2 className={styles.serviceTitle}>{service.title}</h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleInquire}
                  className={styles.inquireButton}
                  aria-label={`Inquire about ${service.title}`}
                >
                  <span>Inquire</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>

              {/* Summary Description */}
              <p className={styles.serviceSummary}>{service.summary}</p>

              {/* 2-Column Split: Scope of Work vs Deliverables */}
              <div className={styles.serviceDetailsGrid}>
                {/* Scope */}
                <div className={styles.detailCol}>
                  <span className={styles.colHeading}>Scope of Work</span>
                  <ul className={styles.scopeList}>
                    {service.scope.map((item, idx) => (
                      <li key={idx} className={styles.scopeItem}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Deliverables */}
                <div className={styles.detailCol}>
                  <span className={styles.colHeading}>
                    Guaranteed Deliverables
                  </span>
                  <div className={styles.deliverablesList}>
                    {service.deliverables.map((del, idx) => (
                      <div key={idx} className={styles.deliverableRow}>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={styles.checkIcon}
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{del}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tools footer */}
              <div className={styles.toolsFooter}>
                <span className={styles.toolsLabel}>Tooling:</span>
                {service.tools.map((tool) => (
                  <span key={tool} className={styles.toolPill}>
                    {tool}
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
            © 2026 {meta.name} • Professional Services & Technical Offerings
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

export default Services;
