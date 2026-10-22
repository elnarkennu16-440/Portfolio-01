import React, { useRef, useState, useEffect, useMemo } from "react";
import { siteContent } from "../../content/siteContent";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { getPlaceholderDebugAttr } from "../../utils/debugContent";
import styles from "./About.module.css";

/* ────────────────────────────────────────────────────────────────────────────
 * CORE FOCUS — 3D CARD SWITCHER
 * ────────────────────────────────────────────────────────────────────────────
 * AUTO_SWITCH_MS   how long each card stays in focus before the next one rotates in
 * EXTRA_PRINCIPLES the 3 additional cards (the first 3 still come from siteContent).
 *                  You can move these into siteContent.about.principles later;
 *                  anything added there is picked up automatically.
 * X_OFFSETS        the small left/right zig-zag of each card in the stack (like your sketch)
 * ──────────────────────────────────────────────────────────────────────────── */
const AUTO_SWITCH_MS = 4000;

const EXTRA_PRINCIPLES: { term: string; description: string }[] = [
  {
    term: "Regression & Retest Cycles",
    description:
      "Re-running affected flows after every fix to confirm the bug is gone and nothing else broke.",
  },
  {
    term: "Cross-Device Responsive Checks",
    description:
      "Verifying layouts and interactions across desktop, tablet, and mobile screen sizes and browsers.",
  },
  {
    term: "Clear Documentation & Handoff",
    description:
      "Keeping test notes, findings, and project records organized so teams can pick up work easily.",
  },
];

const X_OFFSETS: Record<number, string> = {
  [-3]: "0%",
  [-2]: "-6%",
  [-1]: "7%",
  [0]: "0%",
  [1]: "-7%",
  [2]: "6%",
};

const pad = (n: number) => String(n).padStart(2, "0");

export const About: React.FC = () => {
  const { about } = siteContent;
  const { elementRef: sectionRef, isRevealed: isHeaderRevealed } =
    useScrollReveal<HTMLElement>({ threshold: 0.1 });

  // Observer for the layout: starts the contribution-graph rise and fades the card stack in
  const cardsContainerRef = useRef<HTMLDivElement | null>(null);
  const [isCardsRevealed, setIsCardsRevealed] = useState(false);

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

  /* ── 3D card switcher state ─────────────────────────────────────────── */
  const principles = useMemo(
    () => [...about.principles, ...EXTRA_PRINCIPLES],
    [about.principles],
  );
  const total = principles.length;
  const half = Math.floor(total / 2);

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  // Remember the previous active card so a card that "wraps around" the stack can snap
  // (invisibly) instead of flying across the other cards.
  const prevActiveRef = useRef(0);
  const prevActive = prevActiveRef.current;
  useEffect(() => {
    prevActiveRef.current = active;
  }, [active]);

  // Auto switch every AUTO_SWITCH_MS (starts once the section is on screen, pauses on hover/focus)
  useEffect(() => {
    if (!isCardsRevealed || paused || reducedMotion || total < 2) return;
    const timer = window.setTimeout(
      () => setActive((a) => (a + 1) % total),
      AUTO_SWITCH_MS,
    );
    return () => window.clearTimeout(timer);
  }, [isCardsRevealed, paused, reducedMotion, total, active]);

  // Signed position of card i relative to the active one (0 = in focus, negative = above, positive = below)
  const getPos = (i: number, a: number) =>
    ((((i - a + half) % total) + total) % total) - half;

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
          }`}
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

          {/* Right Column: CORE FOCUS — 6 cards in an auto-switching 3D stack */}
          <div
            className={styles.principlesCol}
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") setPaused(true);
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse") setPaused(false);
            }}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            <div className={styles.principlesHeader}>
              <span>CORE FOCUS</span>
              <span className={styles.principlesCounter} aria-hidden="true">
                {pad(active + 1)} / {pad(total)}
              </span>
            </div>

            <div
              className={styles.stage}
              role="group"
              aria-roledescription="carousel"
              aria-label="Core focus areas"
            >
              {principles.map((principle, index) => {
                const pos = getPos(index, active);
                const abs = Math.abs(pos);
                const wrapped =
                  Math.abs(pos - getPos(index, prevActive)) > half;

                const cardClass = [
                  styles.card,
                  pos === 0 ? styles.cardActive : "",
                  abs === 1 ? styles.cardNear : "",
                  abs === 2 ? styles.cardFar : "",
                  abs >= 3 ? styles.cardHidden : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div
                    key={principle.term}
                    className={cardClass}
                    style={
                      {
                        "--pos": pos,
                        "--abs": abs,
                        "--x": X_OFFSETS[pos] ?? "0%",
                        zIndex: 10 - abs,
                        // a card wrapping around the stack snaps instantly (only fades)
                        transition: wrapped ? "opacity 0.25s ease" : undefined,
                      } as React.CSSProperties
                    }
                    aria-hidden={pos !== 0}
                    aria-label={`${index + 1} of ${total}`}
                    onClick={() => {
                      if (pos !== 0 && abs <= 2) setActive(index);
                    }}
                  >
                    <div className={styles.principleMeta}>
                      <span className={styles.principleNumber}>
                        {pad(index + 1)}
                      </span>
                    </div>
                    <h3 className={styles.principleTerm}>{principle.term}</h3>
                    <p className={styles.principleDesc}>
                      {principle.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Minimal progress lines — also act as manual controls */}
            <div
              className={styles.controls}
              role="group"
              aria-label="Choose card"
            >
              {principles.map((principle, index) => {
                const isActive = index === active;
                return (
                  <button
                    key={principle.term}
                    type="button"
                    className={styles.dot}
                    onClick={() => setActive(index)}
                    aria-label={`Show ${principle.term}`}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <span className={styles.dotTrack}>
                      {isActive && (
                        <span
                          key={`${active}-${paused}`}
                          className={`${styles.dotFill} ${
                            paused || reducedMotion ? styles.dotFillHeld : ""
                          }`}
                          style={{ animationDuration: `${AUTO_SWITCH_MS}ms` }}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
