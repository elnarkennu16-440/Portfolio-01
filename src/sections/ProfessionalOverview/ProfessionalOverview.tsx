import React from "react";
import { siteContent } from "../../content/siteContent";
import styles from "./ProfessionalOverview.module.css";

export interface ProfessionalOverviewProps {
  onOpenSubpage?: (subpage: "experience" | "workflows" | "services") => void;
}

export const ProfessionalOverview: React.FC<ProfessionalOverviewProps> = ({
  onOpenSubpage,
}) => {
  const { professionalOverview } = siteContent;

  const handlePillarClick = (subpageId: string) => {
    if (
      onOpenSubpage &&
      (subpageId === "experience" ||
        subpageId === "workflows" ||
        subpageId === "services")
    ) {
      onOpenSubpage(subpageId);
    }
  };

  return (
    <section
      id="professional-overview"
      className={styles.section}
      aria-labelledby="professional-overview-heading"
    >
      {/* Background Architectural Watermark */}
      <div className={styles.watermark} aria-hidden="true">
        {professionalOverview.faintWatermark || "DISCIPLINE"}
      </div>

      <div className={styles.inner}>
        {/* Section Header */}
        <header className={styles.sectionHeader}>
          <div className={styles.eyebrowRow}>
            <span className={styles.eyebrowDash} aria-hidden="true">
              —
            </span>
            <span className={styles.eyebrow}>
              {professionalOverview.sectionTitle || "PROFESSIONAL OVERVIEW"}
            </span>
          </div>

          <h2 id="professional-overview-heading" className={styles.headline}>
            {professionalOverview.lead}
          </h2>

          <p className={styles.intro}>{professionalOverview.intro}</p>
        </header>

        {/* 3 Pillars Architectural Display Grid */}
        <div className={styles.pillarsGrid}>
          {professionalOverview.pillars.map((pillar) => (
            <article
              key={pillar.id}
              className={styles.pillarCard}
              onClick={() => handlePillarClick(pillar.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handlePillarClick(pillar.id);
                }
              }}
              aria-label={`Open ${pillar.title} subpage`}
            >
              <div className={styles.cardTop}>
                <div className={styles.cardMetaRow}>
                  <span className={styles.cardNumberMono}>{pillar.number}</span>
                  <span className={styles.cardCountBadge}>{pillar.count}</span>
                </div>

                <div className={styles.titleBlock}>
                  <span className={styles.cardTagline}>{pillar.tagline}</span>
                  <h3 className={styles.cardTitle}>{pillar.title}</h3>
                </div>

                <p className={styles.cardSummary}>{pillar.summary}</p>
              </div>

              <div className={styles.cardActionRow}>
                <span className={styles.cardActionText}>{pillar.cta}</span>
                <span className={styles.cardActionArrow} aria-hidden="true">
                  →
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProfessionalOverview;
