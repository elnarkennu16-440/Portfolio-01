import React, { useRef, useState, useEffect } from "react";
import { siteContent } from "../../content/siteContent";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { getPlaceholderDebugAttr } from "../../utils/debugContent";
import styles from "./About.module.css";

/* ────────────────────────────────────────────────────────────────────────────
 * CORE FOCUS CARDS — TIMING (only these numbers control the new behaviour)
 * ────────────────────────────────────────────────────────────────────────────
 * CARD_STAGGER_S           delay between each card: card 1 starts first, card 2
 *                          0.5s later, card 3 1.0s after card 1 (top → bottom)
 * CARDS_TRIGGER_ROOT_MARGIN  the reveal starts when the top of the CORE FOCUS column
 *                          reaches the MIDDLE of the screen (-50% = middle).
 *                          Smaller % (e.g. -35%) = starts a bit earlier,
 *                          bigger % (e.g. -60%) = waits until it is higher up.
 * ──────────────────────────────────────────────────────────────────────────── */
const CARD_STAGGER_S = 0.5;
const CARDS_TRIGGER_ROOT_MARGIN = "0px 0px -50% 0px";

export const About: React.FC = () => {
  const { about } = siteContent;
  const { elementRef: sectionRef, isRevealed: isHeaderRevealed } =
    useScrollReveal<HTMLElement>({ threshold: 0.1 });

  // Dedicated observer for the 3 Core Focus cards: triggers architectural split-reveal when scrolled into view
  const cardsContainerRef = useRef<HTMLDivElement | null>(null);
  const [isCardsRevealed, setIsCardsRevealed] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);

  // Dedicated observer ONLY for the 3 pillar cards (right column).
  // It watches the cards column itself — not the whole layout — so on mobile (where the
  // cards sit far below the text) the animation waits until the cards are really on screen.
  const pillarsRef = useRef<HTMLDivElement | null>(null);
  const [arePillarsRevealed, setArePillarsRevealed] = useState(false);
  const [pillarsFinished, setPillarsFinished] = useState(false);

  useEffect(() => {
    if (isCardsRevealed) return;

    const el = cardsContainerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsCardsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsCardsRevealed(true);
            observer.unobserve(entry.target);
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [isCardsRevealed]);

  // Once both split phases have landed (1.25s + 0.7s delay = ~1.95s), cleanly merge into unified interactive cards
  useEffect(() => {
    if (isCardsRevealed && !animationFinished) {
      const timer = setTimeout(() => {
        setAnimationFinished(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCardsRevealed, animationFinished]);

  // Pillar cards: start the split-reveal only when the cards column reaches the middle of the screen
  useEffect(() => {
    if (arePillarsRevealed) return;

    const el = pillarsRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setArePillarsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setArePillarsRevealed(true);
            observer.unobserve(entry.target);
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0,
        rootMargin: CARDS_TRIGGER_ROOT_MARGIN,
      },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [arePillarsRevealed]);

  // After the LAST card has landed (1.25s + 0.7s delay + stagger of the last card), merge into the unified interactive cards
  useEffect(() => {
    if (arePillarsRevealed && !pillarsFinished) {
      const lastCardDelayMs =
        Math.max(about.principles.length - 1, 0) * CARD_STAGGER_S * 1000;
      const timer = setTimeout(() => {
        setPillarsFinished(true);
      }, 2000 + lastCardDelayMs);
      return () => clearTimeout(timer);
    }
  }, [arePillarsRevealed, pillarsFinished, about.principles.length]);

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

        {/* Staggered Editorial Layout */}
        <div
          ref={cardsContainerRef}
          className={`${styles.editorialLayout} ${
            isCardsRevealed ? styles.isCardsRevealed : ""
          } ${animationFinished ? styles.animationFinished : ""}`}
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

          {/* Right Column: 3 Core Focus Cards with Original Two-Phase Architectural Split-Reveal Animation */}
          <div
            ref={pillarsRef}
            className={`${styles.principlesCol} ${
              arePillarsRevealed ? styles.isPillarsRevealed : ""
            } ${pillarsFinished ? styles.pillarsFinished : ""}`}
          >
            <div className={styles.principlesHeader}>
              <span>CORE FOCUS</span>
            </div>

            {about.principles.map((principle, index) => {
              const formattedIndex = String(index + 1).padStart(2, "0");

              return (
                <div
                  key={principle.term}
                  className={styles.splitCardContainer}
                  style={
                    {
                      // top card first, then each next card slightly later
                      "--card-delay": `${index * CARD_STAGGER_S}s`,
                    } as React.CSSProperties
                  }
                >
                  {/* Base card for permanent layout, elevation & interaction */}
                  <div className={styles.principleCard}>
                    <div className={styles.principleMeta}>
                      <span className={styles.principleNumber}>
                        {formattedIndex}
                      </span>
                      <span className={styles.principleLabel}></span>
                    </div>
                    <h3 className={styles.principleTerm}>{principle.term}</h3>
                    <p className={styles.principleDesc}>
                      {principle.description}
                    </p>
                  </div>

                  {/* Phase 1: All 3 Right Halves Slide In Horizontally from the Right Wall */}
                  <div className={styles.rightHalfSegment} aria-hidden="true">
                    <div className={styles.halfCardBody}>
                      <div className={styles.principleMeta}>
                        <span className={styles.principleNumber}>
                          {formattedIndex}
                        </span>
                        <span className={styles.principleLabel}></span>
                      </div>
                      <h3 className={styles.principleTerm}>{principle.term}</h3>
                      <p className={styles.principleDesc}>
                        {principle.description}
                      </p>
                    </div>
                  </div>

                  {/* Phase 2: All 3 Left Halves Rise Up Vertically from the Bottom */}
                  <div className={styles.leftHalfSegment} aria-hidden="true">
                    <div className={styles.halfCardBody}>
                      <div className={styles.principleMeta}>
                        <span className={styles.principleNumber}>
                          {formattedIndex}
                        </span>
                        <span className={styles.principleLabel}></span>
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
