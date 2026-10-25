import React from "react";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { siteContent } from "../../content/siteContent";
import preFooterImage from "../../assets/images/Background-Image-Above-Footer.jpg";
import styles from "./PreFooterBanner.module.css";

type SubpageId = "experience" | "workflows" | "services";

interface PreFooterBannerProps {
  onOpenContact?: () => void;
  onOpenSubpage?: (subpage: SubpageId) => void;
}

/* Same arrow as the "Open ..." buttons in Professional Overview */
const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.1"
    strokeLinecap="butt"
    strokeLinejoin="miter"
    aria-hidden="true"
  >
    <path d="M0 15.5H3.5L13.5 5.5" />
    <path d="M6.5 5.5H13.5V12.5" />
  </svg>
);

/* ── Wave reveal helpers (same idea as the Capabilities titles) ──────────── */

// Headline: letters rise one by one out of a mask, with a small tilt (wave)
const WaveChars: React.FC<{ text: string }> = ({ text }) => {
  const words = text.split(" ");
  let index = 0;
  return (
    <>
      {words.map((word, w) => (
        <React.Fragment key={`${word}-${w}`}>
          <span className={styles.titleWord} aria-hidden="true">
            {Array.from(word).map((ch, c) => (
              <span
                key={c}
                className={styles.titleChar}
                style={{ "--ch": index++ } as React.CSSProperties}
              >
                {ch}
              </span>
            ))}
          </span>
          {w < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </>
  );
};

// Paragraph: words rise one after another out of their own mask
const WaveWords: React.FC<{ text: string }> = ({ text }) => {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          <span className={styles.waveWord} aria-hidden="true">
            <span
              className={styles.waveWordInner}
              style={{ "--w": i } as React.CSSProperties}
            >
              {word}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </>
  );
};

const HEADLINE = "Committed to reliability, precision, and clean craft.";
const SUBTEXT =
  "Whether analyzing test scenarios, auditing edge cases, or structuring intuitive web experiences, I bring steady focus to every layer of the product.";

export const PreFooterBanner: React.FC<PreFooterBannerProps> = ({
  onOpenContact,
  onOpenSubpage,
}) => {
  const { elementRef, isRevealed } = useScrollReveal<HTMLElement>({
    threshold: 0.12,
  });

  // Opens the contact modal. If App.tsx did not pass `onOpenContact`, it triggers the
  // navbar's mail button (which opens the same modal); mailto is the last fallback.
  const handleMessage = () => {
    if (onOpenContact) {
      onOpenContact();
      return;
    }
    const navbarMail = document.querySelector<HTMLButtonElement>(
      'header button[aria-label="Message me"]',
    );
    if (navbarMail) {
      navbarMail.click();
      return;
    }
    if (siteContent.meta.email) {
      window.location.href = `mailto:${siteContent.meta.email}`;
    }
  };

  // If App.tsx does not pass the handler, scroll to the Professional Overview section.
  const handleExplore = () => {
    if (onOpenSubpage) {
      onOpenSubpage("experience");
      return;
    }
    document
      .getElementById("professional-overview")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      ref={elementRef}
      className={`${styles.bannerSection} ${isRevealed ? styles.isRevealed : ""}`}
      aria-label="Profile and Work Inquiries"
    >
      {/* Background Image with Cinematic Grayscale and Vignette */}
      <div className={styles.imageContainer} aria-hidden="true">
        <img
          src={preFooterImage}
          alt="Kennu Elnar Portrait in Mountain Landscape"
          className={styles.bannerImage}
          loading="lazy"
        />
        {/* 1972 film look: soft-focus edges, split tone, light leak */}
        <div className={styles.blurLayer} />
        <div className={styles.toneLayer} />
        <div className={styles.lightLeak} />
        {/* Grayscale Vignette and Directional Lighting Gradients */}
        <div className={styles.vignetteOverlay} />
        {/* Moving film grain + dust */}
        <div className={styles.grainOverlay} />
        <div className={styles.dustLayer} />
      </div>

      {/* Responsive Content & Action Controls */}
      <div className={styles.contentFrame}>
        <div className={`container ${styles.inner}`}>
          <div className={styles.leftGroup}>
            <h2
              className={styles.statement}
              aria-label={HEADLINE}
              style={{ "--cd": "200ms" } as React.CSSProperties}
            >
              <WaveChars text={HEADLINE} />
            </h2>

            <p
              className={styles.statementSub}
              aria-label={SUBTEXT}
              style={{ "--cd": "650ms" } as React.CSSProperties}
            >
              <WaveWords text={SUBTEXT} />
            </p>

            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.ctaLine}
                style={{ "--cd": "1150ms" } as React.CSSProperties}
                onClick={handleMessage}
                aria-label="Open contact form to send a message"
              >
                <span className={styles.ctaRise}>
                  <span className={styles.ctaLineLabel}>Message me</span>
                  <ArrowIcon className={styles.ctaLineArrow} />
                </span>
              </button>

              <button
                type="button"
                className={`${styles.ctaLine} ${styles.ctaLineMuted}`}
                style={{ "--cd": "1280ms" } as React.CSSProperties}
                onClick={handleExplore}
                aria-label="View experience breakdown"
              >
                <span className={styles.ctaRise}>
                  <span className={styles.ctaLineLabel}>
                    Explore Experience
                  </span>
                  <ArrowIcon className={styles.ctaLineArrow} />
                </span>
              </button>
            </div>
          </div>

          <div className={styles.rightMeta} aria-hidden="true">
            <span className={`${styles.metaLine} ${styles.rightMetaTitle}`}>
              <span
                className={styles.metaLineInner}
                style={{ "--cd": "1300ms" } as React.CSSProperties}
              >
                Kennu Elnar
              </span>
            </span>
            <span className={styles.metaLine}>
              <span
                className={styles.metaLineInner}
                style={{ "--cd": "1400ms" } as React.CSSProperties}
              >
                Camarines Norte, Philippines
              </span>
            </span>
            <span className={styles.metaLine}>
              <span
                className={styles.metaLineInner}
                style={{ "--cd": "1500ms" } as React.CSSProperties}
              >
                {siteContent.meta.role}
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
