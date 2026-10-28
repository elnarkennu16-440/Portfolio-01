import React, { useEffect, useLayoutEffect, useRef } from "react";
import { siteContent } from "../../../content/siteContent";
import { ThemeToggle } from "../../../components/ThemeToggle/ThemeToggle";
import type { Theme } from "../../../hooks/useTheme";
import logoImg from "../../../assets/logo/KE-LOGO-.png";
import styles from "./Experience.module.css";
import { initPageTurn } from "../pageTurnEngine";
import { FlowLineOne } from "./FlowlineOne";

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
  const headerRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const goToRef = useRef<((i: number) => void) | null>(null);

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

  // clicking a step in the left rail / a dot goes to that page
  const goToStep = (i: number) => {
    goToRef.current?.(i);
  };

  const handleScrollTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // soft light that follows the cursor inside the "Notable Outcomes" box
  const handleSpotlight = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div ref={containerRef} className={styles.pageContainer}>
      {/* Background atmosphere */}
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
        <div ref={stageRef} className={styles.stage}>
          <FlowLineOne />
          <aside className={styles.stageAside}>
            <div className={styles.subHeaderRow}>
              <div className={styles.titleRow} data-aside>
                <span className={styles.titleAccentBar} aria-hidden="true" />
                <h1 className={styles.pageTitle}>Experience</h1>
              </div>
              <p className={styles.pageDescription} data-aside>
                A documented chronological timeline of professional software
                development, enterprise IT support, and accredited academic
                systems engineering.
              </p>
            </div>

            {/* Step rail (desktop only): fills while scrolling, marker morphs between steps */}
            <nav
              ref={navRef}
              className={styles.railNav}
              aria-label="Experience steps"
            >
              <span className={styles.railTrack} aria-hidden="true" />
              <span
                ref={markerRef}
                className={styles.railMarker}
                aria-hidden="true"
              />
              {experiences.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.railItem} ${i === 0 ? styles.navActive : ""}`}
                  onClick={() => goToStep(i)}
                  aria-label={`Go to ${item.role}`}
                >
                  <span className={styles.railPeriod}>{item.period}</span>
                  <span className={styles.railRole}>{item.role}</span>
                </button>
              ))}
            </nav>

            {/* Page dots (phone only) */}
            <div
              ref={dotsRef}
              className={styles.dotsNav}
              role="group"
              aria-label="Experience pages"
            >
              {experiences.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.dot} ${i === 0 ? styles.dotActive : ""}`}
                  onClick={() => goToStep(i)}
                  aria-label={`Go to ${item.role}`}
                />
              ))}
            </div>
          </aside>

          {/* Minimalist Architectural Scroll Timeline Stream */}
          <section aria-label="Experience timeline" className={styles.slides}>
            <div ref={slidesRef} className={styles.leafStack}>
              {experiences.map((item) => (
                <article key={item.id} className={styles.slide}>
                  {/* Timeline Axis Node (stacked layout only) */}
                  <div className={styles.timelineNode} aria-hidden="true" />

                  {/* Column A: header + narrative */}
                  <div className={`${styles.slideCol} ${styles.colFirst}`}>
                    <div className={styles.itemHeader}>
                      <div className={styles.itemMetaRow} data-part="txt">
                        <span className={styles.periodMono}>{item.period}</span>
                        <span className={styles.typeBadge}>{item.type}</span>
                      </div>
                      <h2 className={styles.roleTitle} data-part="txt">
                        {item.role}
                      </h2>
                      <div className={styles.companyRow} data-part="txt">
                        <span className={styles.companyName}>
                          {item.company}
                        </span>
                        {item.institution &&
                          item.institution !== item.company && (
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
                      <span
                        className={styles.headerRule}
                        aria-hidden="true"
                        data-part="rule"
                      />
                    </div>

                    {/* Narrative Context */}
                    <p className={styles.itemNarrative} data-part="txt">
                      {item.narrative}
                    </p>
                  </div>

                  {/* Column B: responsibilities, outcomes, skills */}
                  <div className={`${styles.slideCol} ${styles.colLast}`}>
                    <div className={styles.responsibilitiesBlock}>
                      <span className={styles.blockHeading} data-part="txt">
                        Key Responsibilities
                      </span>
                      <ul className={styles.responsibilitiesList}>
                        {item.responsibilities.map((resp, idx) => (
                          <li
                            key={idx}
                            className={styles.responsibilityItem}
                            data-part="txt"
                          >
                            {resp}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Highlights Strip */}
                    <div
                      className={styles.highlightsBox}
                      onPointerMove={handleSpotlight}
                      data-part="box"
                    >
                      <span className={styles.blockHeading}>
                        Notable Outcomes
                      </span>
                      {item.keyHighlights.map((highlight, idx) => (
                        <div key={idx} className={styles.highlightItem}>
                          <span
                            className={styles.highlightDot}
                            aria-hidden="true"
                          />
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
                        <span
                          key={skill}
                          className={styles.skillPill}
                          data-part="pill"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
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
