import React, { useEffect, useMemo, useRef, useState } from "react";
import { siteContent, ProjectItem } from "../../content/siteContent";
import { ThemeToggle } from "../../components/ThemeToggle/ThemeToggle";
import type { Theme } from "../../hooks/useTheme";
import logoImg from "../../assets/logo/KE-LOGO-.png";
import { TechStackIcons } from "../../components/TechStackIcons/TechStackIcons";
import { MobileProjectDescriptionModal } from "./mobileprojectdescriptionmodal";
import { DesktopProjectDescriptionModal } from "./desktopprojectdescriptionmodal";
import styles from "./ViewAllProjects.module.css";

interface ViewAllProjectsProps {
  onBack: () => void;
  theme: Theme;
  onToggleTheme: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenContact?: () => void;
}

/**
 * Default icon PNG paths from /public/images/projects/icons/
 * Matches user's exact file structure and naming.
 */
const PROJECT_DEFAULT_ICONS: Record<string, string> = {
  "01": "/images/projects/icons/Mirams-Icon-Logo.png",
  "02": "/images/projects/icons/Ncamis-Icon-Logo.png",
  "03": "/images/projects/icons/Nobleclassics.Icon-Logo.png",
  "04": "/images/projects/icons/Readcapai-Icon-Logo.png",
  "05": "/images/projects/icons/Abisomed-Icon-Logo.png",
  "06": "/images/projects/icons/Asensopos-Icon-Logo.png",
  "project-01": "/images/projects/icons/Mirams-Icon-Logo.png",
  "project-02": "/images/projects/icons/Ncamis-Icon-Logo.png",
  "project-03": "/images/projects/icons/Nobleclassics.Icon-Logo.png",
  "project-04": "/images/projects/icons/Readcapai-Icon-Logo.png",
  "project-05": "/images/projects/icons/Abisomed-Icon-Logo.png",
  "project-06": "/images/projects/icons/Asensopos-Icon-Logo.png",
};

/**
 * Project icon tile component.
 * Displays the project's icon image. By default it is grayed out, and transitions
 * to full color on project card hover.
 * Smartly cascades through candidate filenames/extensions (PNG, SVG, casing variations)
 * before falling back to a clean minimalist SVG placeholder (never letters).
 */
const ProjectIcon: React.FC<{
  src?: string;
  projectNumber: string;
  projectId: string;
  title: string;
}> = ({ src, projectNumber, projectId, title }) => {
  const [attempt, setAttempt] = useState(0);

  const candidates = useMemo(() => {
    const list: string[] = [];
    if (src && src.trim() !== "") list.push(src);
    const def =
      PROJECT_DEFAULT_ICONS[projectNumber] || PROJECT_DEFAULT_ICONS[projectId];
    if (def && !list.includes(def)) list.push(def);

    // Add alternate formats/variations to be fully resilient
    const extras: string[] = [];
    for (const item of list) {
      if (item.endsWith(".png")) {
        extras.push(item.replace(".png", ".svg"));
      } else if (item.endsWith(".svg")) {
        extras.push(item.replace(".svg", ".png"));
      }
      if (item.includes("Nobleclassics.Icon-Logo")) {
        extras.push(
          item.replace("Nobleclassics.Icon-Logo", "Nobleclassics-Icon-Logo"),
        );
      } else if (item.includes("Nobleclassics-Icon-Logo")) {
        extras.push(
          item.replace("Nobleclassics-Icon-Logo", "Nobleclassics.Icon-Logo"),
        );
      }
    }
    for (const ex of extras) {
      if (!list.includes(ex)) list.push(ex);
    }
    return list;
  }, [src, projectNumber, projectId]);

  const currentSrc =
    attempt >= 0 && attempt < candidates.length ? candidates[attempt] : null;

  useEffect(() => {
    setAttempt(0);
  }, [src, projectNumber, projectId]);

  const handleError = () => {
    if (attempt + 1 < candidates.length) {
      setAttempt(attempt + 1);
    } else {
      setAttempt(-1); // all candidates exhausted
    }
  };

  const logo = currentSrc ? (
    <img
      src={currentSrc}
      alt={`${title} icon`}
      className={styles.cardIconImg}
      loading="lazy"
      onError={handleError}
    />
  ) : (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.cardPlaceholderIcon}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );

  /* 3D box seen from the front (front face + thin top face + right side face).
     The project logo sits on the FRONT face; on hover the whole box floats. */
  return (
    <div className={styles.cubeFloat}>
      <div className={styles.cubeBob}>
        <span className={styles.cubeTop} aria-hidden="true" />
        <span className={styles.cubeSide} aria-hidden="true" />
        <span className={styles.cubeFront} aria-hidden="true" />
        <span className={styles.cubeLogo}>{logo}</span>
      </div>
      <span className={styles.cubeShadow} aria-hidden="true" />
    </div>
  );
};

export const ViewAllProjects: React.FC<ViewAllProjectsProps> = ({
  onBack,
  theme,
  onToggleTheme,
}) => {
  const { works, meta } = siteContent;
  const allProjects = works.projects;
  const otherProjects = works.otherProjects || [];
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedProjectForModal, setSelectedProjectForModal] =
    useState<ProjectItem | null>(null);

  // Touch devices have no hover: a tapped card keeps its logo floating until you tap
  // somewhere else (or tap the same card again).
  const [floatingId, setFloatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!floatingId) return;
    const clearOnOutsideTap = (e: Event) => {
      const el = e.target as Element | null;
      if (!el || !el.closest("[data-project-card]")) setFloatingId(null);
    };
    document.addEventListener("pointerdown", clearOnOutsideTap);
    return () => document.removeEventListener("pointerdown", clearOnOutsideTap);
  }, [floatingId]);

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const selectedRef = useRef<ProjectItem | null>(null);
  selectedRef.current = selectedProjectForModal;

  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  // Lock body scroll ONCE while this overlay is mounted (hindi na nagre-run kapag nagbukas ng modal)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      // safety: huwag kailanman ibalik ang "hidden" sa body
      document.body.style.overflow =
        prevOverflow === "hidden" ? "" : prevOverflow;
    };
  }, []);

  // Escape key: close the page only when no modal is open (modal handles its own Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !selectedRef.current) {
        onBackRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleScrollTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div ref={containerRef} className={styles.pageContainer}>
      {/* Subtle background atmosphere */}
      <div className={styles.backgroundAtmosphere} aria-hidden="true" />

      {/* Top Navigation Bar:
          Left: KE Logo only (No 'KENNU ELNAR' text)
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
              width={28}
              height={28}
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
        {/* Left-aligned title with accent-bar + short description */}
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
              <article
                key={project.id}
                data-project-card
                className={`${styles.compactCard} ${
                  floatingId === project.id ? styles.cardFloating : ""
                }`}
                onClick={() => {
                  // only on touch screens (no hover); on desktop the normal hover effect is used
                  if (
                    typeof window !== "undefined" &&
                    window.matchMedia("(hover: none)").matches
                  ) {
                    setFloatingId((prev) =>
                      prev === project.id ? null : project.id,
                    );
                  }
                }}
              >
                {/* Top Row inside Card: Project Number on Left, Live / GitHub Action Links on Right */}
                <div className={styles.cardTopRow}>
                  <span className={styles.cardNumberMono}>
                    {project.number}
                  </span>

                  {(hasValidLive || hasValidRepo) && (
                    <div
                      className={styles.cardActions}
                      onClick={(e) => e.stopPropagation()}
                    >
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

                {/* Project icon tile (left aligned; gray by default, full real color on hover) */}
                <div className={styles.cardIconWrap}>
                  <div className={styles.cardIconBox}>
                    <ProjectIcon
                      src={project.iconUrl}
                      projectNumber={project.number}
                      projectId={project.id}
                      title={project.title}
                    />
                  </div>
                </div>

                {/* Card Main Info: left aligned, refined typography */}
                <div className={styles.cardBody}>
                  <span className={styles.cardRoleYear}>
                    {project.role} {project.year}
                  </span>
                  <h2 className={styles.cardTitle}>{project.title}</h2>
                  <p className={styles.cardDescription}>
                    {project.description}
                  </p>
                </div>

                {/* Overview Button: text + underline connected to an arrow (no pill / oval) */}
                <button
                  type="button"
                  className={styles.cardOverviewBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProjectForModal(project);
                  }}
                  aria-label={`View overview of ${project.title}`}
                >
                  <span className={styles.cardOverviewLabel}>OVERVIEW</span>
                  <svg
                    className={styles.connectorArrow}
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
                </button>

                {/* Tech icons: animated, light-gray icons matching Works section (hidden on mobile via CSS) */}
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

        {/* Other Projects Section (Row list without icons, matching reference image) */}
        {otherProjects && otherProjects.length > 0 && (
          <section
            className={styles.otherProjectsSection}
            aria-label="Other projects and applications"
          >
            <div className={styles.otherSectionHeader}>
              <div className={styles.titleRow}>
                <span className={styles.titleAccentBar} aria-hidden="true" />
                <h2 className={styles.otherSectionTitle}>Other Projects</h2>
              </div>
              <p className={styles.otherSectionDesc}>
                Academic Applications, APIs built for testing, and additional
                freelance projects.
              </p>
            </div>

            <div className={styles.otherProjectsList}>
              {otherProjects.map((item) => (
                <article key={item.id} className={styles.otherProjectRow}>
                  <div className={styles.otherColTitle}>
                    <h3 className={styles.otherItemTitle}>{item.title}</h3>
                  </div>

                  <div className={styles.otherColMeta}>
                    <span className={styles.otherItemCategory}>
                      {item.category}
                    </span>
                    <p className={styles.otherItemDesc}>{item.description}</p>
                  </div>

                  <div className={styles.otherColAction}>
                    {item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.otherGithubBtn}
                        aria-label={`GitHub Repository for ${item.title}`}
                        title="View GitHub Repository"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                      </a>
                    ) : (
                      <span
                        className={styles.otherGithubMuted}
                        aria-hidden="true"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
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

      {/* Responsive Project Description Modal (Separated Mobile & Desktop components) */}
      {selectedProjectForModal &&
        (isMobile ? (
          <MobileProjectDescriptionModal
            project={selectedProjectForModal}
            onClose={() => setSelectedProjectForModal(null)}
          />
        ) : (
          <DesktopProjectDescriptionModal
            project={selectedProjectForModal}
            onClose={() => setSelectedProjectForModal(null)}
          />
        ))}
    </div>
  );
};
