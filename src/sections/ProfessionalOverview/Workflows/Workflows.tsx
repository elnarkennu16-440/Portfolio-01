import React, { useState, useEffect, useRef } from "react";
import { siteContent, WorkflowPhase } from "../../../content/siteContent";
import { ThemeToggle } from "../../../components/ThemeToggle/ThemeToggle";
import type { Theme } from "../../../hooks/useTheme";
import logoImg from "../../../assets/logo/KE-LOGO-.png";
import styles from "./Workflows.module.css";

export interface WorkflowsProps {
  onBack: () => void;
  theme: Theme;
  onToggleTheme: (e?: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Workflows: React.FC<WorkflowsProps> = ({
  onBack,
  theme,
  onToggleTheme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { professionalOverview, meta } = siteContent;
  const workflows = professionalOverview.workflows;
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number>(0);

  const activePhase: WorkflowPhase =
    workflows[selectedPhaseIndex] || workflows[0];

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
        {/* Subheader */}
        <div className={styles.subHeaderRow}>
          <div className={styles.titleRow}>
            <span className={styles.titleAccentBar} aria-hidden="true" />
            <h1 className={styles.pageTitle}>Workflows</h1>
          </div>
          <p className={styles.pageDescription}>
            A 4-phase systematic engineering lifecycle integrating edge-case
            discovery, modular component architecture, manual quality
            verification, and production hardening.
          </p>
        </div>

        {/* Interactive 4-Phase Pipeline Selector Track */}
        <nav
          aria-label="Workflow pipeline stages"
          className={styles.pipelineNav}
        >
          {workflows.map((phase, idx) => {
            const isActive = selectedPhaseIndex === idx;
            return (
              <button
                key={phase.step}
                type="button"
                className={`${styles.pipelineTab} ${
                  isActive ? styles.pipelineTabActive : ""
                }`}
                onClick={() => setSelectedPhaseIndex(idx)}
                aria-current={isActive ? "step" : undefined}
              >
                <div className={styles.tabTopRow}>
                  <span className={styles.tabStepMono}>PHASE {phase.step}</span>
                  {isActive && (
                    <span
                      className={styles.tabActiveIndicator}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <h3 className={styles.tabTitle}>{phase.title}</h3>
              </button>
            );
          })}
        </nav>

        {/* Active Phase Deep Dive & Architecture Blueprint Visualizer */}
        <section
          aria-label={`Detailed breakdown of Phase ${activePhase.step}`}
          className={styles.blueprintSection}
        >
          <div key={activePhase.step} className={styles.phaseCard}>
            {/* Phase Header */}
            <header className={styles.phaseHeader}>
              <div className={styles.phaseKicker}>
                <span className={styles.phaseNumberBadge}>
                  STAGE {activePhase.step} / 04
                </span>
                <span className={styles.phaseSubtitle}>
                  {activePhase.subtitle}
                </span>
              </div>
              <h2 className={styles.phaseTitle}>{activePhase.title}</h2>
              <p className={styles.phaseSummary}>{activePhase.shortSummary}</p>
            </header>

            {/* 2-Column Grid: Rationale vs Architecture Blueprint */}
            <div className={styles.phaseGrid}>
              {/* Left Column: Objective & Architecture Invariants */}
              <div className={styles.phaseDetailsCol}>
                <div className={styles.detailBlock}>
                  <span className={styles.blockTitle}>Core Objective</span>
                  <p className={styles.objectiveText}>
                    {activePhase.objective}
                  </p>
                </div>

                <div className={styles.detailBlock}>
                  <span className={styles.blockTitle}>
                    Architecture Protocols & Methods
                  </span>
                  <ul className={styles.detailsList}>
                    {activePhase.architectureDetails.map((detail, dIdx) => (
                      <li key={dIdx} className={styles.detailItem}>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: Flow Blueprint & Deliverables */}
              <div className={styles.blueprintCol}>
                {/* Structural Diagram Blueprint Box */}
                <div className={styles.diagramFrame} aria-hidden="true">
                  <div className={styles.diagramHeader}>
                    <span className={styles.diagramHeaderLabel}>
                      DATA FLOW BLUEPRINT // S-{activePhase.step}
                    </span>
                    <span className={styles.diagramStatusBadge}>VERIFIED</span>
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
                        {activePhase.step === "01"
                          ? "Edge-Case Matrix & Boundary Analysis"
                          : activePhase.step === "02"
                            ? "CSS Module Token Binding & Component Split"
                            : activePhase.step === "03"
                              ? "Viewport Matrix & DOM Error Inspection"
                              : "TypeScript Compilation & Bundle Audit"}
                      </span>
                    </div>
                    <div className={styles.flowConnectorLine}>↓</div>
                    <div className={styles.flowNodeRow}>
                      <span className={styles.flowNodeIndex}>[OUT]</span>
                      <span>{activePhase.deliverables[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Deliverables Checklist */}
                <div className={styles.deliverablesBox}>
                  <span className={styles.blockTitle}>
                    Verified Deliverables
                  </span>
                  {activePhase.deliverables.map((del, delIdx) => (
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
            <footer className={styles.phaseFooter}>
              <div className={styles.techPills} aria-label="Tools and methods">
                {activePhase.techUsed.map((tech) => (
                  <span key={tech} className={styles.techPill}>
                    {tech}
                  </span>
                ))}
              </div>
              <span className={styles.metricBadge}>
                Benchmark: {activePhase.metrics}
              </span>
            </footer>
          </div>
        </section>
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
