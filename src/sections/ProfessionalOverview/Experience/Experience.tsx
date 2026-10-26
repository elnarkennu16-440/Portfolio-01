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

/**
 * Reveal helper: marks an element so it slides in from the side ONLY when it
 * scrolls into view (see the IntersectionObserver in the component).
 *  - i:       order inside its group (small stagger so they come out one after another)
 *  - variant: "side" (default) | "grow" | "rule" | "pop"
 *  - flip:    come from the opposite side of its timeline item
 */
const rv = (i = 0, variant: string = "side", flip = false) => ({
  "data-reveal": variant,
  style: {
    "--d": `${Math.min(i, 8) * 70}ms`,
    ...(flip ? { "--flip": -1 } : {}),
  } as React.CSSProperties,
});

export const Experience: React.FC<ExperienceProps> = ({
  onBack,
  theme,
  onToggleTheme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<HTMLElement>(null);
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

  // Scroll-based reveal: every [data-reveal] element appears by itself when IT
  // enters the scroll area (the scroll container is this page, not the window).
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const targets = Array.from(
      root.querySelectorAll<HTMLElement>("[data-reveal]"),
    );

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.setAttribute("data-in", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-in", "true");
            observer.unobserve(entry.target); // reveal once
          }
        });
      },
      { root, threshold: 0.12, rootMargin: "0px 0px -9% 0px" },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Timeline rail progress: the line fills as you scroll (no React re-render,
  // only one CSS variable is updated, throttled with rAF)
  useEffect(() => {
    const root = containerRef.current;
    const stream = streamRef.current;
    if (!root || !stream) return;

    let ticking = false;

    const update = () => {
      ticking = false;
      const rect = stream.getBoundingClientRect();
      const readingLine = root.clientHeight * 0.6;
      const p = Math.min(
        1,
        Math.max(0, (readingLine - rect.top) / Math.max(rect.height, 1)),
      );
      stream.style.setProperty("--p", p.toFixed(4));
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

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
            <span
              className={styles.titleAccentBar}
              aria-hidden="true"
              {...rv(0, "grow")}
            />
            <h1 className={styles.pageTitle} {...rv(1)}>
              Experience
            </h1>
          </div>
          <p className={styles.pageDescription} {...rv(2)}>
            A documented chronological timeline of professional software
            development, enterprise IT support, and accredited academic systems
            engineering.
          </p>
        </div>

        {/* Minimalist Architectural Scroll Timeline Stream */}
        <section
          ref={streamRef}
          aria-label="Experience timeline"
          className={styles.timelineStream}
        >
          {/* Rail progress (fills while scrolling) */}
          <span className={styles.railFill} aria-hidden="true" />

          {experiences.map((item, itemIndex) => (
            <article
              key={item.id}
              className={styles.timelineItem}
              style={
                {
                  // even items slide in from the left, odd items from the right
                  "--dir": itemIndex % 2 === 0 ? -1 : 1,
                } as React.CSSProperties
              }
            >
              {/* Timeline Axis Node */}
              <div
                className={styles.timelineNode}
                aria-hidden="true"
                {...rv(0, "pop")}
              />

              {/* Item Header */}
              <div className={styles.itemHeader}>
                <div className={styles.itemMetaRow} {...rv(0)}>
                  <span className={styles.periodMono}>{item.period}</span>
                  <span className={styles.typeBadge}>{item.type}</span>
                </div>
                <h2 className={styles.roleTitle} {...rv(1)}>
                  {item.role}
                </h2>
                <div className={styles.companyRow} {...rv(2)}>
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
                <span
                  className={styles.headerRule}
                  aria-hidden="true"
                  {...rv(3, "rule")}
                />
              </div>

              {/* Narrative Context */}
              <p className={styles.itemNarrative} {...rv(0)}>
                {item.narrative}
              </p>

              {/* Key Responsibilities */}
              <div className={styles.responsibilitiesBlock}>
                <span className={styles.blockHeading} {...rv(0)}>
                  Key Responsibilities
                </span>
                <ul className={styles.responsibilitiesList}>
                  {item.responsibilities.map((resp, idx) => (
                    <li
                      key={idx}
                      className={styles.responsibilityItem}
                      {...rv(idx)}
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
                {...rv(0, "side", true)}
              >
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
                {item.skills.map((skill, idx) => (
                  <span key={skill} className={styles.skillPill} {...rv(idx)}>
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
