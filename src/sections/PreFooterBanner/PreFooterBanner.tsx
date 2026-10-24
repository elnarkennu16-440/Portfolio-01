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
            <h2 className={styles.statement}>
              Committed to reliability, precision, and clean craft.
            </h2>

            <p className={styles.statementSub}>
              Whether analyzing test scenarios, auditing edge cases, or
              structuring intuitive web experiences, I bring steady focus to
              every layer of the product.
            </p>

            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.ctaLine}
                onClick={handleMessage}
                aria-label="Open contact form to send a message"
              >
                <span className={styles.ctaLineLabel}>Message me</span>
                <ArrowIcon className={styles.ctaLineArrow} />
              </button>

              <button
                type="button"
                className={`${styles.ctaLine} ${styles.ctaLineMuted}`}
                onClick={handleExplore}
                aria-label="View experience breakdown"
              >
                <span className={styles.ctaLineLabel}>Explore Experience</span>
                <ArrowIcon className={styles.ctaLineArrow} />
              </button>
            </div>
          </div>

          <div className={styles.rightMeta} aria-hidden="true">
            <span className={styles.rightMetaTitle}>Kennu Elnar</span>
            <span>Camarines Norte, Philippines</span>
            <span>{siteContent.meta.role}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
