import React from "react";
import { siteContent } from "../../content/siteContent";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import officialLogo from "../../assets/logo/KE-LOGO-.png";
import styles from "./Footer.module.css";

type SubpageId = "experience" | "workflows" | "services";

interface FooterProps {
  onOpenContact: () => void;
  onOpenSubpage?: (subpage: SubpageId) => void;
  onOpenAllProjects?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenContact,
  onOpenSubpage,
  onOpenAllProjects,
}) => {
  const { meta, footer } = siteContent;
  const { elementRef, isRevealed } = useScrollReveal<HTMLElement>({
    threshold: 0.08,
  });

  // Opens the subpage. If App.tsx did not pass `onOpenSubpage`, the button still
  // does something useful: it scrolls to the Professional Overview section.
  const openSubpage = (subpage: SubpageId) => {
    if (onOpenSubpage) {
      onOpenSubpage(subpage);
      return;
    }
    document
      .getElementById("professional-overview")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer
      ref={elementRef}
      className={`${styles.footer} ${isRevealed ? styles.isRevealed : ""}`}
      role="contentinfo"
    >
      <div className={`container ${styles.inner}`}>
        {/* Top Grid: Bold Statement on the Left, 2 Columns on the Right */}
        <div className={styles.topGrid}>
          <div className={styles.headlineColumn}>
            <h2 className={styles.bigHeadline}>
              Building with purpose.
              <br />
              Testing with precision.
            </h2>
          </div>

          <div className={styles.linkColumnsGrid}>
            {/* Column 1: Professional Overview */}
            <div className={styles.linkColumn}>
              <span className={styles.columnHeading}>
                Professional Overview
              </span>
              <ul className={styles.linkList}>
                <li>
                  <button
                    type="button"
                    className={styles.footerNavLink}
                    onClick={() => openSubpage("experience")}
                  >
                    Experience
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={styles.footerNavLink}
                    onClick={() => openSubpage("workflows")}
                  >
                    Workflows
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={styles.footerNavLink}
                    onClick={() => openSubpage("services")}
                  >
                    Services
                  </button>
                </li>
                {onOpenAllProjects && (
                  <li>
                    <button
                      type="button"
                      className={styles.footerNavLink}
                      onClick={onOpenAllProjects}
                    >
                      All Projects
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 2: Connect */}
            <div className={styles.linkColumn}>
              <span className={styles.columnHeading}>Connect</span>
              <ul className={styles.linkList}>
                <li>
                  <a
                    href={
                      meta.githubUrl || "https://github.com/elnarkennu16-440"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.footerNavLink}
                  >
                    GitHub{" "}
                    <span className={styles.externalIcon} aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${meta.email}`}
                    className={styles.footerNavLink}
                  >
                    Email{" "}
                    <span className={styles.externalIcon} aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    className={styles.footerNavLink}
                    onClick={onOpenContact}
                  >
                    Message Me
                  </button>
                </li>
                <li>
                  <a
                    href={meta.resumeDocxUrl || meta.resumeUrl}
                    download
                    className={styles.footerNavLink}
                  >
                    Resume (DOCX){" "}
                    <span className={styles.externalIcon} aria-hidden="true">
                      ↓
                    </span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Middle Row: Brand Identity & Action Controls */}
        <div className={styles.middleBrandRow}>
          <div className={styles.brandGroup}>
            <div className={styles.footerLogoContainer}>
              <img
                src={officialLogo}
                alt="Kennu Elnar Logo"
                className={styles.footerLogo}
                width={96}
                height={106}
                loading="lazy"
              />
            </div>
            <div className={styles.brandInfo}>
              <span className={styles.brandName}>{meta.name}</span>
              <span className={styles.brandRole}>{meta.role}</span>
            </div>
          </div>
        </div>

        {/* Bottom Row: Region, Copyright, and Back-to-Top */}
        <div className={styles.bottomLegalRow}>
          <div className={styles.legalLeft}>
            <span className={styles.regionTag}>
              Camarines Norte, Philippines
            </span>
            <span className={styles.dotDivider} aria-hidden="true">
              •
            </span>
            <span className={styles.regionTag}>English (US)</span>
          </div>

          <span className={styles.copyright}>{footer.copyright}</span>
        </div>
      </div>
    </footer>
  );
};
