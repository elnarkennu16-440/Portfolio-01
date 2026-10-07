import React from "react";
import { siteContent } from "../../content/siteContent";
import { getPlaceholderDebugAttr } from "../../utils/debugContent";
import { useMagneticButton } from "../../hooks/useMagneticButton";
import { LookAtPortrait } from "../../components/LookAtPortrait/LookAtPortrait";
import kennuLogo from "../../assets/Minimalist-KennuLogo-.png";
import elnarLogo from "../../assets/Minimalist-ElnarLogo-.png";
import styles from "./Hero.module.css";

export const Hero: React.FC = () => {
  const { hero, meta } = siteContent;
  const worksBtnRef = useMagneticButton<HTMLAnchorElement>();

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
              <a ref={worksBtnRef} href="#works" className="pillButton">
                <span>{hero.ctaWorks}</span>
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              </a>

              <a
                href={meta.githubUrl || "https://github.com/elnarkennu16-440"}
                target="_blank"
                rel="noopener noreferrer"
                className="pillButton"
                aria-label="Kennu Elnar GitHub Profile"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  style={{ flexShrink: 0 }}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                <span>GitHub</span>
                <span className="arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            </div>
          </div>

          {/* Right Column: Look-at-Cursor Portrait */}
          <div className={styles.portraitCol}>
            <LookAtPortrait />
          </div>
        </div>
      </div>
    </section>
  );
};
