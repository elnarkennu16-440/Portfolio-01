import React, { useEffect, useLayoutEffect, useRef } from "react";
import { siteContent } from "../../../content/siteContent";
import { ThemeToggle } from "../../../components/ThemeToggle/ThemeToggle";
import type { Theme } from "../../../hooks/useTheme";
import logoImg from "../../../assets/logo/KE-LOGO-.png";
import styles from "./Workflows.module.css";
import { initPageTurn } from "../pageTurnEngine";
import { FlowLineTwo } from "./FlowlineTwo";

export interface WorkflowsProps {
  onBack: () => void;
  theme: Theme;
  onToggleTheme: (e?: React.MouseEvent<HTMLButtonElement>) => void;
}

const MID_NODE: Record<string, string> = {
  "01": "Edge-Case Matrix & Boundary Analysis",
  "02": "CSS Module Token Binding & Component Split",
  "03": "Viewport Matrix & DOM Error Inspection",
  "04": "TypeScript Compilation & Bundle Audit",
};

export const Workflows: React.FC<WorkflowsProps> = ({
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
  const workflows = professionalOverview.workflows;

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

  // clicking a phase in the left rail / a dot goes to that page
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
              aria-label="Close Workflows page"
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
          <FlowLineTwo />

          {/* Left side: title, description and the phase rail */}
          <aside className={styles.stageAside}>
            <div className={styles.subHeaderRow}>
              <div className={styles.titleRow} data-aside>
                <span className={styles.titleAccentBar} aria-hidden="true" />
                <h1 className={styles.pageTitle}>Workflows</h1>
              </div>
              <p className={styles.pageDescription} data-aside>
                A 4-phase systematic engineering lifecycle integrating edge-case
                discovery, modular component architecture, manual quality
                verification, and production hardening.
              </p>
            </div>

            {/* Phase rail (desktop only) */}
            <nav
              ref={navRef}
              className={styles.railNav}
              aria-label="Workflow pipeline stages"
            >
              <span className={styles.railTrack} aria-hidden="true" />
              <span
                ref={markerRef}
                className={styles.railMarker}
                aria-hidden="true"
              />
              {workflows.map((phase, i) => (
                <button
                  key={phase.step}
                  type="button"
                  className={`${styles.railItem} ${i === 0 ? styles.navActive : ""}`}
                  onClick={() => goToStep(i)}
                  aria-label={`Go to phase ${phase.step}: ${phase.title}`}
                >
                  <span className={styles.railPeriod}>PHASE {phase.step}</span>
                  <span className={styles.railRole}>{phase.title}</span>
                </button>
              ))}
            </nav>

            {/* Page dots (phone only) */}
            <div
              ref={dotsRef}
              className={styles.dotsNav}
              role="group"
              aria-label="Workflow phases"
            >
              {workflows.map((phase, i) => (
                <button
                  key={phase.step}
                  type="button"
                  className={`${styles.dot} ${i === 0 ? styles.dotActive : ""}`}
                  onClick={() => goToStep(i)}
                  aria-label={`Go to phase ${phase.step}: ${phase.title}`}
                />
              ))}
            </div>
          </aside>

          {/* The phase pages */}
          <section
            aria-label="Engineering workflow phases"
            className={styles.slides}
          >
            <div ref={slidesRef} className={styles.leafStack}>
              {workflows.map((phase) => (
                <article key={phase.step} className={styles.slide}>
                  {/* Phase Header */}
                  <header
                    className={`${styles.phaseHeader} ${styles.firstBlock}`}
                  >
                    <div className={styles.phaseKicker} data-part="txt">
                      <span className={styles.phaseNumberBadge}>
                        STAGE {phase.step} / 04
                      </span>
                      <span className={styles.phaseSubtitle}>
                        {phase.subtitle}
                      </span>
                    </div>
                    <h2 className={styles.phaseTitle} data-part="txt">
                      {phase.title}
                    </h2>
                    <p className={styles.phaseSummary} data-part="txt">
                      {phase.shortSummary}
                    </p>
                    <span
                      className={styles.headerRule}
                      aria-hidden="true"
                      data-part="rule"
                    />
                  </header>

                  {/* 2-Column Grid: Rationale vs Architecture Blueprint */}
                  <div className={styles.phaseGrid}>
                    <div className={styles.phaseDetailsCol}>
                      <div className={styles.detailBlock}>
                        <span className={styles.blockTitle} data-part="txt">
                          Core Objective
                        </span>
                        <p className={styles.objectiveText} data-part="txt">
                          {phase.objective}
                        </p>
                      </div>

                      <div className={styles.detailBlock}>
                        <span className={styles.blockTitle} data-part="txt">
                          Architecture Protocols & Methods
                        </span>
                        <ul className={styles.detailsList}>
                          {phase.architectureDetails.map((detail, dIdx) => (
                            <li
                              key={dIdx}
                              className={styles.detailItem}
                              data-part="txt"
                            >
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className={styles.blueprintCol}>
                      {/* Structural Diagram Blueprint Box */}
                      <div
                        className={styles.diagramFrame}
                        aria-hidden="true"
                        data-part="box"
                      >
                        <div className={styles.diagramHeader}>
                          <span className={styles.diagramHeaderLabel}>
                            DATA FLOW BLUEPRINT // S-{phase.step}
                          </span>
                          <span className={styles.diagramStatusBadge}>
                            VERIFIED
                          </span>
                        </div>

                        <div className={styles.flowNodesWrapper}>
                          <div className={styles.flowNodeRow}>
                            <span className={styles.flowNodeIndex}>[IN]</span>
                            <span>User Stories & Design Specifications</span>
                          </div>
                          <div className={styles.flowConnectorLine}>↓</div>
                          <div className={styles.flowNodeRow}>
                            <span className={styles.flowNodeIndex}>[MID]</span>
                            <span>
                              {MID_NODE[phase.step] ?? MID_NODE["04"]}
                            </span>
                          </div>
                          <div className={styles.flowConnectorLine}>↓</div>
                          <div className={styles.flowNodeRow}>
                            <span className={styles.flowNodeIndex}>[OUT]</span>
                            <span>{phase.deliverables[0]}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deliverables Checklist */}
                      <div className={styles.deliverablesBox} data-part="box">
                        <span className={styles.blockTitle}>
                          Verified Deliverables
                        </span>
                        {phase.deliverables.map((del, delIdx) => (
                          <div key={delIdx} className={styles.deliverableRow}>
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

                  {/* Phase Footer Strip: Tech pills & Metric invariant */}
                  <footer
                    className={`${styles.phaseFooter} ${styles.lastBlock}`}
                  >
                    <div
                      className={styles.techPills}
                      aria-label="Tools and methods"
                    >
                      {phase.techUsed.map((tech) => (
                        <span
                          key={tech}
                          className={styles.techPill}
                          data-part="pill"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <span className={styles.metricBadge} data-part="txt">
                      Benchmark: {phase.metrics}
                    </span>
                  </footer>

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
            © 2026 {meta.name} • Engineering Workflows & SDLC Pipeline
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

export default Workflows;
