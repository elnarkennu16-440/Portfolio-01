import React, { useEffect, useRef } from "react";
import { siteContent } from "../../content/siteContent";
import { getPlaceholderDebugAttr } from "../../utils/debugContent";
import { LookAtPortrait } from "../../components/LookAtPortrait/LookAtPortrait";
import kennuLogo from "../../assets/Minimalist-KennuLogo-.png";
import elnarLogo from "../../assets/Minimalist-ElnarLogo-.png";
import styles from "./Hero.module.css";

interface HeroProps {
  isIntroDone?: boolean;
}

/**
 * Same "line + arrow" connector as the VIEW ALL PROJECTS button in Works.tsx:
 * one continuous stroke — a horizontal line that bends upward into an arrow head (↗).
 * The horizontal part sits on the bottom edge of the SVG so it joins the underline
 * of the label right next to it.
 */
const ConnectorArrow: React.FC<{ className?: string }> = ({ className }) => (
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

export const Hero: React.FC<HeroProps> = ({ isIntroDone = true }) => {
  const { hero, meta } = siteContent;

  // Mobile only: the portrait is scaled up with a CSS transform (--ps, see Hero.module.css).
  // A transform does not take space in the layout, so we add the extra height back as
  // margin. The portrait component itself (and its animation) is NOT touched.
  const portraitScaleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = portraitScaleRef.current;
    if (!el) return;

    const sync = () => {
      const scale =
        parseFloat(getComputedStyle(el).getPropertyValue("--ps")) || 1;
      el.style.setProperty(
        "--ps-extra",
        `${Math.max(0, (scale - 1) * el.offsetHeight).toFixed(1)}px`,
      );
    };

    sync();
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    observer?.observe(el);
    window.addEventListener("resize", sync);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <section id="hero" className={styles.heroSection} aria-label="Introduction">
      {/* Editorial Flow Hairline Curve */}
      <svg
        className={styles.heroBackgroundCurve}
        viewBox="0 0 1440 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M-50,650 C320,750 480,280 820,380 C1160,480 1280,120 1500,80"
          className={styles.curvePath}
        />
      </svg>

      {/* Faint Giant Background Watermark */}
      <div className={`ghostWatermark ${styles.watermark}`} aria-hidden="true">
        {hero.faintWatermark}
      </div>

      <div className="container">
        <div className={styles.heroGrid}>
          {/* Left Column: Typography & Intent */}
          <div className={styles.contentCol}>
            <div className={styles.eyebrowRow}>
              <div className={styles.accentRule} aria-hidden="true" />
              <span className={styles.eyebrow}>{hero.eyebrow}</span>
            </div>

            <div className={styles.headlineMask}>
              <h1 className={styles.headlineLine}>
                <img
                  src={kennuLogo}
                  alt="Kennu"
                  className={styles.heroLogoImage}
                  width={469}
                  height={126}
                  loading="eager"
                />
              </h1>
            </div>

            <div className={styles.headlineMask}>
              <div
                className={`${styles.headlineLine} ${styles.headlineLineSecond}`}
              >
                <img
                  src={elnarLogo}
                  alt="Elnar"
                  className={styles.heroLogoImage}
                  width={474}
                  height={129}
                  loading="eager"
                />
              </div>
            </div>

            <p className={styles.heroLeadStatement}>
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

            <div className={styles.ctaGroup}>
              <a href="#works" className={styles.ctaLink}>
                <span className={styles.ctaLabel}>{hero.ctaWorks}</span>
                <ConnectorArrow className={styles.ctaArrow} />
              </a>

              <a
                href={meta.githubUrl || "https://github.com/elnarkennu16-440"}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaLink}
                aria-label="Kennu Elnar GitHub Profile"
              >
                <span className={styles.ctaLabel}>
                  <svg
                    className={styles.ctaGithub}
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  GitHub
                </span>
                <ConnectorArrow className={styles.ctaArrow} />
              </a>
            </div>
          </div>

          {/* Right Column: Look-at-Cursor Portrait */}
          <div className={styles.portraitCol}>
            <div ref={portraitScaleRef} className={styles.portraitScale}>
              <LookAtPortrait isIntroDone={isIntroDone} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
