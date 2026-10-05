import React, { useRef, useState, useEffect } from "react";
import { siteContent } from "../../content/siteContent";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { getPlaceholderDebugAttr } from "../../utils/debugContent";
import styles from "./About.module.css";

export const About: React.FC = () => {
  const { about } = siteContent;
  const { elementRef: sectionRef, isRevealed: isHeaderRevealed } =
    useScrollReveal<HTMLElement>({ threshold: 0.1 });

  // Dedicated observer for the cards: only triggers when user has scrolled into the whole UI
  const cardsContainerRef = useRef<HTMLDivElement | null>(null);
  const [isCardsRevealed, setIsCardsRevealed] = useState(false);
  const [revealDirection, setRevealDirection] = useState<
    "fromTop" | "fromBottom"
  >("fromTop");
  const [isResetting, setIsResetting] = useState(false);
  const [isAnimationFinished, setIsAnimationFinished] = useState(false);

  const lastScrollYRef = useRef(
    typeof window !== "undefined" ? window.scrollY : 0,
  );
  const scrollDirRef = useRef<"down" | "up">("down");

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isCardsRevealed) {
      setIsAnimationFinished(false);
      // Wait for all 4 cards to finish their slowmo entrance (delay 2.55s + duration 2.4s = ~5.0s)
      timer = setTimeout(() => {
        setIsAnimationFinished(true);
      }, 5000);
    } else {
      setIsAnimationFinished(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isCardsRevealed]);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollYRef.current) {
        scrollDirRef.current = "down";
      } else if (currentY < lastScrollYRef.current) {
        scrollDirRef.current = "up";
      }
      lastScrollYRef.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const el = cardsContainerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsCardsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Determine direction: if scrollDir is up or element is entering from bottom of page
            const isComingFromBottom =
              scrollDirRef.current === "up" || entry.boundingClientRect.top < 0;

            setRevealDirection(isComingFromBottom ? "fromBottom" : "fromTop");
            setIsResetting(false);
            setIsCardsRevealed(true);
          } else {
            // ONLY reset when the container is completely 100% out of the viewport!
            // This prevents cards from disappearing while still on screen.
            if (entry.intersectionRatio <= 0) {
              setIsResetting(true);
              setIsCardsRevealed(false);
              setIsAnimationFinished(false);
            }
          }
        });
      },
      {
        threshold: [0, 0.28],
        rootMargin: "0px 0px -40px 0px",
      },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

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

        {/* Staggered Editorial Layout: Triggers with direction-aware top/bottom reveal */}
        <div
          ref={cardsContainerRef}
          className={`${styles.editorialLayout} ${
            isCardsRevealed ? styles.isCardsRevealed : ""
          } ${styles[revealDirection]} ${isResetting ? styles.resetOffscreen : ""} ${
            isAnimationFinished ? styles.animationFinished : ""
          }`}
        >
          {/* Left Column: Narrative */}
          <div className={styles.narrativeCol}>
            <p className={styles.leadStatement}>
              Focusing on{" "}
              <span className={styles.underlinedEmphasis}>
                software quality
              </span>
              , user flows, and{" "}
              <span className={styles.underlinedEmphasis}>
                dependable web applications
              </span>
              .
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
                <div key={principle.term} className={styles.buildingMask}>
                  <div
                    className={`${styles.principleCard} ${styles[`cardDelay${index + 1}`]}`}
                  >
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
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
