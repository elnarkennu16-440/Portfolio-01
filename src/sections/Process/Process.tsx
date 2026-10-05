import React from "react";
import { siteContent, ProcessStep } from "../../content/siteContent";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { getPlaceholderDebugAttr } from "../../utils/debugContent";
import styles from "./Process.module.css";

export const Process: React.FC = () => {
  const { process } = siteContent;
  const { elementRef, isRevealed } = useScrollReveal<HTMLElement>({
    threshold: 0.1,
  });

  return (
    <section
      id="process"
      ref={elementRef}
      className={`${styles.processSection} ${isRevealed ? styles.isRevealed : ""}`}
      aria-label="Development and QA Process"
      data-debug-content={getPlaceholderDebugAttr(process.status)}
    >
      {/* Faint Background Watermark */}
      <div className={`ghostWatermark ${styles.watermark}`} aria-hidden="true">
        {process.faintWatermark}
      </div>

      <div className="container">
        {/* Section Header with Left Accent Bar */}
        <div className={styles.headerRow}>
          <div className={styles.sectionHeader}>
            <div className={styles.titleAccentBar} aria-hidden="true" />
            {process.sectionNumber ? (
              <span className={styles.sectionNumber}>
                {process.sectionNumber}
              </span>
            ) : null}
            <h2 className={styles.sectionTitle}>{process.sectionTitle}</h2>
          </div>
          <div className={styles.headerUnderline} aria-hidden="true" />
        </div>

        <p className={styles.introText}>{process.intro}</p>

        {/* 4 Process Step Cards */}
        <div className={styles.stepsGrid}>
          {process.steps.map((step: ProcessStep) => (
            <div key={step.number} className={styles.stepCard}>
              <div className={styles.stepTopRow}>
                <span className={styles.stepNumber}>{step.number}</span>
                <span className={styles.stepStageBadge}>PHASE</span>
              </div>

              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepSummary}>{step.summary}</p>
              <p className={styles.stepDetails}>{step.details}</p>

              {/* Purposeful Card Footer */}
              <div className={styles.stepCardFooter}>
                <span>PHASE {step.number} / 04</span>
                <span aria-hidden="true">+</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
