import React, { useEffect, useState } from "react";
import { siteContent, ProjectItem } from "../../content/siteContent";
import { ThemeToggle } from "../../components/ThemeToggle/ThemeToggle";
import type { Theme } from "../../hooks/useTheme";
import logoImg from "../../assets/logo/KE-LOGO-.png";
import { TechStackIcons } from "../../components/TechStackIcons/TechStackIcons";
import styles from "./ViewAllProjects.module.css";

interface ViewAllProjectsProps {
  onBack: () => void;
  theme: Theme;
  onToggleTheme: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenContact?: () => void;
}
/**
 * Project icon tile.
 * Shows the project's iconUrl when it loads. If the file is missing/broken (or no iconUrl is set),
 * it falls back to a clean serif monogram — so the card never shows a broken-image icon.
 */
const ProjectIcon: React.FC<{ src?: string; title: string }> = ({
  src,
  title,
}) => {
  const [failed, setFailed] = useState(false);
  const name = title.split(/\s[—–-]\s/)[0].trim();
  const monogram = (name.charAt(0) || "•").toUpperCase();

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        className={styles.cardIconImg}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={styles.cardMonogram} aria-hidden="true">
      {monogram}
    </span>
  );
};

export const ViewAllProjects: React.FC<ViewAllProjectsProps> = ({
  onBack,
  theme,
  onToggleTheme,
}) => {
  const { works, meta } = siteContent;
  const allProjects = works.projects;

  // Scroll to top immediately when ViewAllProjects mounts & listen for Escape key
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onBack]);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.pageContainer}>
      {/* Subtle background atmosphere */}
      <div className={styles.backgroundAtmosphere} aria-hidden="true" />

      {/* Top Navigation Bar:
          Left: KE Logo only (No 'KENNU ELNAR' text as requested)
          Right: Dark/Light Mode Toggle + 'X' Close Button side-by-side
      */}
      <header className={styles.topNav}>
        <div className={styles.topNavInner}>
          <button
            type="button"
            onClick={onBack}
            className={styles.brandMark}
            aria-label="Return to portfolio works"
            title="Return to works"
          >
            <img
              src={logoImg}
              alt="KE Logo"
              className={styles.brandLogoSmall}
              width={30}
              height={30}
            />
          </button>

          <div className={styles.topNavActions}>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button
              type="button"
              onClick={onBack}
              className={styles.navCloseBtn}
              aria-label="Close All Projects view"
              title="Close (Esc)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Left-aligned title (same accent-bar style as the other sections) + short description */}
        <div className={styles.subHeaderRow}>
          <div className={styles.titleRow}>
            <span className={styles.titleAccentBar} aria-hidden="true" />
            <h1 className={styles.pageTitle}>All Projects</h1>
          </div>
          <p className={styles.pageDescription}>
            A complete archive of what I’ve built and tested — web systems,
            tools, and experiments. Each card is a quick snapshot; follow the
            links for the full source.
          </p>
        </div>

        {/* Compact responsive grid:
            Desktop: 3 columns, Tablet: 2 columns, Mobile: 2 smaller columns. */}
        <section
          className={styles.projectsGrid}
          aria-label="All projects compact catalog"
        >
          {allProjects.map((project: ProjectItem) => {
            const hasValidLive = Boolean(
              project.liveUrl &&
              project.liveUrl !== "#" &&
              project.liveUrl.trim() !== "",
            );
            const hasValidRepo = Boolean(
              project.repoUrl &&
              project.repoUrl !== "#" &&
              project.repoUrl.trim() !== "",
            );

            return (
              <article key={project.id} className={styles.compactCard}>
                {/* Top Row inside Card: Project Number on Left, Live / GitHub Action Links on Right */}
                <div className={styles.cardTopRow}>
                  <span className={styles.cardNumberMono}>
                    {project.number}
                  </span>

                  {(hasValidLive || hasValidRepo) && (
                    <div className={styles.cardActions}>
                      {hasValidLive && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.actionIconBtn}
                          aria-label={`Live Demo for ${project.title}`}
                          title="Live Demo"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <line x1="7" y1="17" x2="17" y2="7" />
                            <polyline points="7 7 17 7 17 17" />
                          </svg>
                        </a>
                      )}

                      {hasValidRepo && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.actionIconBtn}
                          aria-label={`GitHub Code for ${project.title}`}
                          title="GitHub Repository"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Project icon tile (left aligned; zooms in on hover) */}
                <div className={styles.cardIconWrap}>
                  <div className={styles.cardIconBox}>
                    <ProjectIcon src={project.iconUrl} title={project.title} />
                  </div>
                </div>

                {/* Card Main Info: left aligned, small fonts, clear hierarchy */}
                <div className={styles.cardBody}>
                  <span className={styles.cardRoleYear}>
                    {project.role} • {project.year}
                  </span>
                  <h2 className={styles.cardTitle}>{project.title}</h2>
                  <p className={styles.cardDescription}>
                    {project.description}
                  </p>
                </div>

                {/* Tech icons: the SAME animated, light-gray icons used in the Works section */}
                {project.tags && project.tags.length > 0 && (
                  <div
                    className={styles.cardTech}
                    aria-label="Technologies used"
                  >
                    <div className={styles.cardTechInner}>
                      <TechStackIcons tags={project.tags} />
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </main>

      {/* Page Footer */}
      <footer className={styles.pageFooter}>
        <div className={styles.footerInner}>
          <span className={styles.footerText}>
            © 2026 {meta.name} • All projects catalog
          </span>
          <button
            type="button"
            onClick={handleScrollTop}
            className={styles.footerBackTop}
          >
            <span>Back to top</span>
            <span aria-hidden="true">↑</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
