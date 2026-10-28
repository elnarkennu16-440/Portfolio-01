import React, { useEffect, useLayoutEffect, useRef } from "react";
import { siteContent } from "../../../content/siteContent";
import { ThemeToggle } from "../../../components/ThemeToggle/ThemeToggle";
import type { Theme } from "../../../hooks/useTheme";
import logoImg from "../../../assets/logo/KE-LOGO-.png";
import styles from "./Services.module.css";
import { initPageTurn } from "../pageTurnEngine";
import { FlowLineThree } from "./FlowlineThree";

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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const goToRef = useRef<((i: number) => void) | null>(null);

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

  /* Page turn engine (one scroll / swipe = one page).
     All the animation code lives in ../pageTurnEngine.ts (shared by
     Experience, Workflows and Services). Speed / distance settings are at the
     top of that file. */
  useLayoutEffect(() => {
    const root = containerRef.current;
    const header = headerRef.current;
    const stage = stageRef.current;
    const stack = slidesRef.current;
    const nav = navRef.current;
    const dots = dotsRef.current;
    const marker = markerRef.current;
    if (!root || !header || !stage || !stack || !nav || !dots || !marker)
      return;

    return initPageTurn({
      root,
      header,
      stage,
      stack,
      nav,
      dots,
      marker,
      classes: {
        isPaged: styles.isPaged,
        isBook: styles.isBook,
        isPhone: styles.isPhone,
        navActive: styles.navActive,
        dotActive: styles.dotActive,
      },
      goToRef,
      fitDesktop: true, // shrink text on desktop until each page fits
      stackedReveal: false,
    });
  }, []);

  // clicking a service in the left rail / a dot goes to that page
  const goToStep = (i: number) => {
    goToRef.current?.(i);
  };

  const handleScrollTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div ref={containerRef} className={styles.pageContainer}>
      <div className={styles.backgroundAtmosphere} aria-hidden="true" />

      {/* Top Navigation Bar:
          Left: KE Logo button (calls onBack)
          Right: Dark/Light Mode Toggle + 'X' Close Button
      */}
      <header ref={headerRef} className={styles.topNav}>
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
        <div ref={stageRef} className={styles.stage}>
          <FlowLineThree />

          {/* Left side: title, description and the phase rail */}
          <aside className={styles.stageAside}>
            <div className={styles.subHeaderRow}>
              <div className={styles.titleRow} data-aside>
                <span className={styles.titleAccentBar} aria-hidden="true" />
                <h1 className={styles.pageTitle}>Services</h1>
              </div>
              <p className={styles.pageDescription} data-aside>
                Focused technical capabilities available for client projects,
                freelance collaborations, front-end implementation, and
                systematic software testing.
              </p>
            </div>

            {/* Phase rail (desktop only) */}
            <nav ref={navRef} className={styles.railNav} aria-label="Services">
              <span className={styles.railTrack} aria-hidden="true" />
              <span
                ref={markerRef}
                className={styles.railMarker}
                aria-hidden="true"
              />
              {services.map((service, i) => (
                <button
                  key={service.number}
                  type="button"
                  className={`${styles.railItem} ${i === 0 ? styles.navActive : ""}`}
                  onClick={() => goToStep(i)}
                  aria-label={`Go to ${service.title}`}
                >
                  <span className={styles.railPeriod}>
                    {service.number} / {service.category}
                  </span>
                  <span className={styles.railRole}>{service.title}</span>
                </button>
              ))}
            </nav>

            {/* Page dots (phone only) */}
            <div
              ref={dotsRef}
              className={styles.dotsNav}
              role="group"
              aria-label="Service pages"
            >
              {services.map((service, i) => (
                <button
                  key={service.number}
                  type="button"
                  className={`${styles.dot} ${i === 0 ? styles.dotActive : ""}`}
                  onClick={() => goToStep(i)}
                  aria-label={`Go to ${service.title}`}
                />
              ))}
            </div>
          </aside>

          {/* The service pages */}
          <section aria-label="Services catalogue" className={styles.slides}>
            <div ref={slidesRef} className={styles.leafStack}>
              {services.map((service) => (
                <article key={service.number} className={styles.slide}>
                  {/* Header */}
                  <div
                    className={`${styles.serviceHeader} ${styles.firstBlock}`}
                  >
                    <div className={styles.headerLeft}>
                      <span className={styles.serviceNumber} data-part="txt">
                        {service.number}
                      </span>
                      <div className={styles.titleArea}>
                        <span
                          className={styles.serviceCategory}
                          data-part="txt"
                        >
                          {service.category}
                        </span>
                        <h2 className={styles.serviceTitle} data-part="txt">
                          {service.title}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <span
                    className={styles.headerRule}
                    aria-hidden="true"
                    data-part="rule"
                  />

                  {/* Summary Description */}
                  <p className={styles.serviceSummary} data-part="txt">
                    {service.summary}
                  </p>

                  {/* 2-Column Split: Scope of Work vs Deliverables */}
                  <div className={styles.serviceDetailsGrid} data-part="box">
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
                  <div className={`${styles.toolsFooter} ${styles.lastBlock}`}>
                    <span className={styles.toolsLabel} data-part="txt">
                      Tooling:
                    </span>
                    {service.tools.map((tool) => (
                      <span
                        key={tool}
                        className={styles.toolPill}
                        data-part="pill"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>

                  {/* darkens the page while it sinks into the stack */}
                  <span
                    className={styles.pageShade}
                    aria-hidden="true"
                    data-shade
                  />
                </article>
              ))}
            </div>
          </section>
        </div>
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
