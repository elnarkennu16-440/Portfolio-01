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
    term: "Refining Details and Polish",
    description:
      "I often revisit completed features to clean up styling, remove unnecessary complexity, and ensure the overall user experience feels smooth and deliberate.",
  },
  {
    term: "Exploring New Technical Concepts",
    description:
      "I set aside time to test new tools, frameworks, and patterns out of curiosity, seeing how they fit into my personal projects and expand what I can build.",
  },
  {
    term: "Documenting Progress Along the Way",
    description:
      "I make a habit of noting down what I build, what challenges I hit, and how I solved them, creating a personal knowledge base I can look back on.",
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

/**
 * Splits a text into words; every word sits in its own clipping mask and rises
 * from below with a wave (see .wMask / .wInner in the CSS). Used for the body
 * paragraphs and the contribution title.
 */
const INTRO_MS = 3400; // how long the scatter → stack reveal runs

// stable "random" so the scattered spots never change between renders
const rnd = (n: number) => {
  const s = Math.sin(n * 91.345 + 7.13) * 43758.5453;
  return s - Math.floor(s);
};
const scatterFor = (i: number) => ({
  "--sx": `${Math.round((rnd(i + 1) - 0.5) * 70)}%`,
  "--sy": `${((rnd(i + 11) - 0.5) * 14).toFixed(1)}rem`,
  "--sz": `${Math.round(-120 - rnd(i + 21) * 260)}px`,
  "--srx": `${Math.round((rnd(i + 31) - 0.5) * 120)}deg`,
  "--sry": `${Math.round((rnd(i + 41) - 0.5) * 140)}deg`,
  "--srz": `${Math.round((rnd(i + 51) - 0.5) * 70)}deg`,
});

const renderWords = (text: string) => {
  const words = text.split(" ");
  return words.map((word, i) => (
    <React.Fragment key={i}>
      <span className={styles.wMask} aria-hidden="true">
        <span
          className={styles.wInner}
          style={{ "--w": i } as React.CSSProperties}
        >
          {word}
        </span>
      </span>
      {i < words.length - 1 ? " " : null}
    </React.Fragment>
  ));
};

export const About: React.FC = () => {
  const { about } = siteContent;
  const { elementRef: sectionRef, isRevealed: isHeaderRevealed } =
    useScrollReveal<HTMLElement>({ threshold: 0.1 });

  // The Core Focus column keeps its own trigger (unchanged)
  const { elementRef: principlesRef, isRevealed: isPrinciplesRevealed } =
    useScrollReveal<HTMLDivElement>({
      threshold: 0.18,
      rootMargin: "0px 0px -10% 0px",
    });

  // Left column: EVERY block (lead sentence, each paragraph, contribution widget)
  // reveals on its own the moment it scrolls into view, so nothing animates off-screen
  // on mobile and nothing happens all at once.
  const narrativeColRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = narrativeColRef.current;
    if (!root) return;

    const blocks = Array.from(
      root.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      blocks.forEach((b) => b.setAttribute("data-revealed", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "true");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    blocks.forEach((b) => observer.observe(b));
    return () => observer.disconnect();
  }, []);

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

  const [introDone, setIntroDone] = useState(false);
  useEffect(() => {
    if (reducedMotion) {
      setIntroDone(true);
      return;
    }
    if (!isPrinciplesRevealed) return;
    const t = window.setTimeout(() => setIntroDone(true), INTRO_MS);
    return () => window.clearTimeout(t);
  }, [isPrinciplesRevealed, reducedMotion]);

  // Remember the previous active card so a card that "wraps around" the stack can snap
  // (invisibly) instead of flying across the other cards.
  const prevActiveRef = useRef(0);
  const prevActive = prevActiveRef.current;
  useEffect(() => {
    prevActiveRef.current = active;
  }, [active]);

  // Auto switch every AUTO_SWITCH_MS (starts once the cards are actually on screen, pauses on hover/focus)
  useEffect(() => {
    if (
      !isPrinciplesRevealed ||
      !introDone ||
      paused ||
      reducedMotion ||
      total < 2
    )
      return;
    const timer = window.setTimeout(
      () => setActive((a) => (a + 1) % total),
      AUTO_SWITCH_MS,
    );
    return () => window.clearTimeout(timer);
  }, [isPrinciplesRevealed, introDone, paused, reducedMotion, total, active]);

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
            <h2 className={styles.sectionTitle} aria-label={about.sectionTitle}>
              {Array.from(about.sectionTitle).map((letter, i) => (
                <span
                  key={i}
                  className={styles.titleChar}
                  aria-hidden="true"
                  style={{ "--ch": i } as React.CSSProperties}
                >
                  {letter}
                </span>
              ))}
            </h2>
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
          <div ref={narrativeColRef} className={styles.narrativeCol}>
            <p
              className={styles.leadStatement}
              data-reveal
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
                <div
                  key={index}
                  className={styles.maskBlock}
                  data-reveal
                  style={{ "--bi": index } as React.CSSProperties}
                >
                  <p className={styles.paragraph} aria-label={paragraph}>
                    {renderWords(paragraph)}
                  </p>
                </div>
              ))}
            </div>

            {/* GitHub Repository Contribution Activity */}
            <div className={styles.contributionWidget} data-reveal>
              <div className={styles.contributionHeader}>
                <span
                  className={styles.contributionTitle}
                  aria-label="612 contributions in the last year"
                >
                  {renderWords("612 CONTRIBUTIONS IN THE LAST YEAR")}
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
            } ${introDone ? styles.introDone : ""}`}
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
              <span className={styles.coreFocusTitle} aria-label="CORE FOCUS">
                {Array.from("CORE FOCUS").map((ch, i) => (
                  <span
                    key={i}
                    className={styles.cfChar}
                    aria-hidden="true"
                    style={{ "--ch": i } as React.CSSProperties}
                  >
                    {ch}
                  </span>
                ))}
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
                        "--k": index,
                        ...scatterFor(index),
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
