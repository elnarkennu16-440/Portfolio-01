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
 * ANGLES           a different turn (rotateY) + tiny twist (rotateZ) for every position in the
 *                  stack, so the cards before / after the active one all sit at their own angle
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
  [-2]: "-5%",
  [-1]: "6%",
  [0]: "0%",
  [1]: "-6%",
  [2]: "5%",
};

// Different angle for every spot in the stack (above = negative, below = positive)
const ANGLES: Record<number, { ry: string; rz: string }> = {
  [-3]: { ry: "0deg", rz: "0deg" },
  [-2]: { ry: "16deg", rz: "-2.2deg" },
  [-1]: { ry: "-11deg", rz: "1.6deg" },
  [0]: { ry: "0deg", rz: "0deg" },
  [1]: { ry: "11deg", rz: "-1.6deg" },
  [2]: { ry: "-16deg", rz: "2.2deg" },
};

// Lead sentence, split into words so each word can rise out of a clipping line on scroll
const LEAD_WORDS: { text: string; emphasis?: boolean; suffix?: string }[] = [
  { text: "A" },
  { text: "Personal" },
  { text: "Workspace", emphasis: true, suffix: "." },
  { text: "Notes," },
  { text: "Builds," },
  { text: "and" },
  { text: "Progress", emphasis: true, suffix: "." },
];

const pad = (n: number) => String(n).padStart(2, "0");

export const About: React.FC = () => {
  const { about } = siteContent;
  const { elementRef: sectionRef, isRevealed: isHeaderRevealed } =
    useScrollReveal<HTMLElement>({ threshold: 0.1 });

  // Separate scroll-reveal triggers, so every block animates when YOU actually reach it
  // (important on mobile where the columns are stacked and far apart)
  const { elementRef: narrativeRef, isRevealed: isNarrativeRevealed } =
    useScrollReveal<HTMLDivElement>({
      threshold: 0.12,
      rootMargin: "0px 0px -10% 0px",
    });
  const { elementRef: widgetRef, isRevealed: isWidgetRevealed } =
    useScrollReveal<HTMLDivElement>({
      threshold: 0.25,
      rootMargin: "0px 0px -8% 0px",
    });
  const { elementRef: principlesRef, isRevealed: isPrinciplesRevealed } =
    useScrollReveal<HTMLDivElement>({
      threshold: 0.18,
      rootMargin: "0px 0px -10% 0px",
    });

  // Observer for the layout (kept from before)
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

  // Auto switch every AUTO_SWITCH_MS (starts once the cards are actually on screen, pauses on hover/focus)
  useEffect(() => {
    if (!isPrinciplesRevealed || paused || reducedMotion || total < 2) return;
    const timer = window.setTimeout(
      () => setActive((a) => (a + 1) % total),
      AUTO_SWITCH_MS,
    );
    return () => window.clearTimeout(timer);
  }, [isPrinciplesRevealed, paused, reducedMotion, total, active]);

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
          <div
            ref={narrativeRef}
            className={`${styles.narrativeCol} ${
              isNarrativeRevealed ? styles.narrativeRevealed : ""
            }`}
          >
            <p
              className={styles.leadStatement}
              aria-label="A Personal Workspace. Notes, Builds, and Progress."
            >
              {LEAD_WORDS.map((word, i) => (
                <React.Fragment key={word.text + i}>
                  <span className={styles.maskWord} aria-hidden="true">
                    <span
                      className={styles.maskWordInner}
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      <span
                        className={
                          word.emphasis ? styles.underlinedEmphasis : undefined
                        }
                      >
                        {word.text}
                      </span>
                      {word.suffix}
                    </span>
                  </span>
                  {i < LEAD_WORDS.length - 1 ? " " : null}
                </React.Fragment>
              ))}
            </p>

            <div className={styles.bodyCopy}>
              {about.paragraphs.map((paragraph, index) => (
                <div key={index} className={styles.maskBlock}>
                  <p
                    className={styles.maskBlockInner}
                    style={{ "--i": index } as React.CSSProperties}
                  >
                    {paragraph}
                  </p>
                </div>
              ))}
            </div>

            {/* GitHub Repository Contribution Activity */}
            <div
              ref={widgetRef}
              className={`${styles.contributionWidget} ${
                isWidgetRevealed ? styles.widgetRevealed : ""
              }`}
            >
              <div className={styles.contributionHeader}>
                <span className={styles.contributionTitle}>
                  612 CONTRIBUTIONS IN THE LAST YEAR
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
            ref={principlesRef}
            className={`${styles.principlesCol} ${
              isPrinciplesRevealed ? styles.principlesRevealed : ""
            }`}
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
                const angle = ANGLES[pos] ?? ANGLES[0];

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
                        "--ry": angle.ry,
                        "--rz": angle.rz,
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
                    {/* Card numbers (01–06) are hidden via CSS (.principleMeta) */}
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

            {/* Minimal progress lines — also act as manual controls (hidden via CSS) */}
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
