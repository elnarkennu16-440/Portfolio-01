import React from "react";
import { siteContent } from "../../content/siteContent";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import officialLogo from "../../assets/logo/KE-LOGO-.png";
import styles from "./Footer.module.css";

interface FooterProps {
  onOpenContact: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenContact }) => {
  const { meta, footer } = siteContent;
  const { elementRef, isRevealed } = useScrollReveal<HTMLElement>({
    threshold: 0.08,
  });

  return (
    <footer
      ref={elementRef}
      className={`${styles.footer} ${isRevealed ? styles.isRevealed : ""}`}
      role="contentinfo"
    >
      <div className={`container ${styles.inner}`}>
        <div className={styles.topRow}>
          <div className={styles.identityBlock}>
            <div className={styles.footerLogoContainer}>
              <img
                src={officialLogo}
                alt="Kennu Elnar Logo"
                className={styles.footerLogo}
                width={212}
                height={235}
                loading="lazy"
              />
            </div>
            <span className={styles.role}>{meta.role}</span>
            <div className={styles.contactDetails}>
              <a href={`mailto:${meta.email}`} className={styles.contactLink}>
                {meta.email}
              </a>
              <span className={styles.contactDot} aria-hidden="true">
                •
              </span>
              <a
                href={`tel:${meta.phone.replace(/\s+/g, "")}`}
                className={styles.contactLink}
              >
                {meta.phone}
              </a>
            </div>
          </div>

          <div className={styles.footerActions}>
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

            <button
              type="button"
              className="pillButton"
              onClick={onOpenContact}
              aria-haspopup="dialog"
            >
              <span>Message me</span>
              <span className="arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </div>

        <div className={styles.bottomRow}>
          <span className={styles.copyright}>{footer.copyright}</span>

          <a
            href="#hero"
            className={styles.backToTop}
            aria-label="Return to top of page"
          >
            {footer.backToTop}
          </a>
        </div>
      </div>
    </footer>
  );
};
