import React, { useRef, useState, useEffect } from "react";
import { siteContent } from "../../content/siteContent";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { getPlaceholderDebugAttr } from "../../utils/debugContent";
import styles from "./About.module.css";

export const About: React.FC = () => {
  const { about } = siteContent;
  const { elementRef: sectionRef, isRevealed: isHeaderRevealed } =
    useScrollReveal<HTMLElement>({ threshold: 0.1 });

  // Dedicated observer for the cards: ONE-TIME ONLY reveal when scrolled down
  const cardsContainerRef = useRef<HTMLDivElement | null>(null);
  const [isCardsRevealed, setIsCardsRevealed] = useState(false);
  const [isAnimationFinished, setIsAnimationFinished] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isCardsRevealed) {
      // Phase 1 (Right halves): delay 0.15s, duration 1.25s
      // Phase 2 (Left halves): delay 0.70s, duration 1.25s (completes at 1.95s)
      timer = setTimeout(() => {
        setIsAnimationFinished(true);
      }, 2100);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isCardsRevealed]);

  useEffect(() => {
    if (isCardsRevealed) return;

    const el = cardsContainerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsCardsRevealed(true);
      setIsAnimationFinished(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Trigger ONE-TIME ONLY animation!
            setIsCardsRevealed(true);
            observer.unobserve(entry.target);
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.28,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [isCardsRevealed]);

  return (
    <section
      id="about"
      ref={sectionRef}
      className={`${styles.aboutSection} ${isHeaderRevealed ? styles.isRevealed : ""}`}
      aria-label="About Kennu Elnar"
      data-debug-content={getPlaceholderDebugAttr(about.status)}
    >
      {/* Faint Background Watermark */}
      <div className={`ghostWatermark ${styles.watermark}`} aria-hidden="true">
        {about.faintWatermark}
      </div>

      <div className="container">
        {/* Section Header with Left Accent Bar */}
        <div className={styles.headerRow}>
          <div className={styles.sectionHeader}>
            <div className={styles.titleAccentBar} aria-hidden="true" />
            {about.sectionNumber ? (
              <span className={styles.sectionNumber}>
                {about.sectionNumber}
              </span>
            ) : null}
            <h2 className={styles.sectionTitle}>{about.sectionTitle}</h2>
          </div>
          <div className={styles.headerUnderline} aria-hidden="true" />
        </div>

        {/* Staggered Editorial Layout: One-time reveal when whole UI is reached */}
        <div
          ref={cardsContainerRef}
          className={`${styles.editorialLayout} ${
            isCardsRevealed ? styles.isCardsRevealed : ""
          } ${isAnimationFinished ? styles.animationFinished : ""}`}
        >
          {/* Left Column: Narrative */}
          <div className={styles.narrativeCol}>
            <p className={styles.leadStatement}>
              A Personal{" "}
              <span className={styles.underlinedEmphasis}>Workspace</span>.
              Notes, Builds, and{" "}
              <span className={styles.underlinedEmphasis}>Progress</span>.
            </p>

            <div className={styles.bodyCopy}>
              {about.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* GitHub Repository Contribution Activity */}
            <div className={styles.contributionWidget}>
              <div className={styles.contributionHeader}>
                <span className={styles.contributionTitle}>
                  REPOSITORY CONTRIBUTIONS
                </span>
              </div>

              <div className={styles.buildingMask}>
                <div
                  className={`${styles.contributionCard} ${styles.contributionBuildingRise}`}
                >
                  <div className={styles.contributionScrollContainer}>
                    <img
                      src="/images/Github-Contribution.png"
                      alt="Kennu Elnar GitHub repository contribution graph"
                      className={styles.contributionImage}
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3 Core Pillars */}
          <div className={styles.principlesCol}>
            <div className={styles.principlesHeader}>
              <span>CORE FOCUS</span>
            </div>

            {about.principles.map((principle, index) => {
              const formattedIndex = String(index + 1).padStart(2, "0");

              return (
                <div key={principle.term} className={styles.splitCardContainer}>
                  {/* Base full card (permanent layout, interactive after merge) */}
                  <div className={styles.principleCard}>
                    <div className={styles.principleMeta}>
                      <span className={styles.principleNumber}>
                        {formattedIndex}
                      </span>
                    </div>

                    <h3 className={styles.principleTerm}>{principle.term}</h3>
                    <p className={styles.principleDesc}>
                      {principle.description}
                    </p>
                  </div>

                  {/* Split Phase 1: Right half (slides horizontally from right wall together) */}
                  <div className={styles.rightHalfSegment} aria-hidden="true">
                    <div className={styles.halfCardBody}>
                      <div className={styles.principleMeta}>
                        <span className={styles.principleNumber}>
                          {formattedIndex}
                        </span>
                      </div>
                      <h3 className={styles.principleTerm}>{principle.term}</h3>
                      <p className={styles.principleDesc}>
                        {principle.description}
                      </p>
                    </div>
                  </div>

                  {/* Split Phase 2: Left half (rises vertically from bottom together) */}
                  <div className={styles.leftHalfSegment} aria-hidden="true">
                    <div className={styles.halfCardBody}>
                      <div className={styles.principleMeta}>
                        <span className={styles.principleNumber}>
                          {formattedIndex}
                        </span>
                      </div>
                      <h3 className={styles.principleTerm}>{principle.term}</h3>
                      <p className={styles.principleDesc}>
                        {principle.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
