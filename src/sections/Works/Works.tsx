import React, { useState, useEffect, useMemo, useRef } from "react";
import { siteContent, ProjectItem } from "../../content/siteContent";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { getPlaceholderDebugAttr } from "../../utils/debugContent";
import { TechStackIcons } from "../../components/TechStackIcons/TechStackIcons";
import styles from "./Works.module.css";

// Must match the expand/collapse transition time in Works.module.css (.moreProjects)
const EXPAND_MS = 1100;

// Projects 1-4 are always visible. Every project after that (05, 06, ...) in
// siteContent.works.projects is revealed by the floating "Show more" button.
const INITIAL_VISIBLE_PROJECTS = 4;

const ProjectCardItem: React.FC<{ project: ProjectItem; index: number }> = ({
  project,
  index,
}) => {
  // General card reveal for overall presence
  const { elementRef: cardRef, isRevealed: isCardRevealed } =
    useScrollReveal<HTMLElement>({
      threshold: 0.08,
      rootMargin: "0px 0px -30px 0px",
    });

  // Dedicated observer for the split-reveal info panel:
  // Requires the info box itself to enter well into the screen (-15% rootMargin) so the user has reached the center and can see the animation unfold!
  const { elementRef: panelRef, isRevealed: isPanelRevealed } =
    useScrollReveal<HTMLDivElement>({
      threshold: 0.25,
      rootMargin: "0px 0px -15% 0px",
    });

  const [isAnimationFinished, setIsAnimationFinished] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPanelRevealed) {
      // Slower, aesthetic pacing:
      // Project 01 & 03: Phase 1 (0.20s) -> Phase 2 (0.85s) -> finishes at ~2.7s
      // Project 02: Phase 1 (0.80s) -> Phase 2 (1.45s) -> finishes at ~3.3s
      const waitTime = index % 2 === 1 ? 3600 : 3000;
      timer = setTimeout(() => {
        setIsAnimationFinished(true);
      }, waitTime);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPanelRevealed, index]);

  const hasValidLive = Boolean(
    project.liveUrl && project.liveUrl !== "#" && project.liveUrl.trim() !== "",
  );
  const hasValidRepo = Boolean(
    project.repoUrl && project.repoUrl !== "#" && project.repoUrl.trim() !== "",
  );

  const renderPanelContent = () => (
    <>
      <div className={styles.panelMetaRow}>
        <span className={styles.projectNumeral}>{project.number}</span>
        <span className={styles.projectYear}>{project.year}</span>
      </div>

      <h3 className={styles.projectTitle}>{project.title}</h3>

      <p className={styles.projectDescription}>{project.description}</p>

      {/* Tech Stack Icons */}
      {project.tags.length > 0 && <TechStackIcons tags={project.tags} />}

      {/* Actions / Links: Only render if valid URLs provided */}
      {(hasValidLive || hasValidRepo) && (
        <div className={styles.actionsRow}>
          {hasValidLive && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.editorialLink}
              aria-label={`View live demo for ${project.title}`}
            >
              <span>Live Preview</span>
              <span className={styles.arrow} aria-hidden="true">
                ↗
              </span>
            </a>
          )}

          {hasValidRepo && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.editorialLink}
              aria-label={`View source code repository for ${project.title}`}
            >
              <span>Repository</span>
              <span className={styles.arrow} aria-hidden="true">
                ↗
              </span>
            </a>
          )}
        </div>
      )}
    </>
  );

  return (
    <article
      ref={cardRef}
      key={project.id}
      className={`${styles.projectCard} ${isCardRevealed ? styles.cardRevealed : ""}`}
      data-debug-content={getPlaceholderDebugAttr(project.status)}
    >
      {/* Media Container: Image untouched */}
      <div className={styles.mediaContainer}>
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.imageAlt || project.title}
            loading="lazy"
            className={styles.projectImage}
          />
        ) : (
          <div className={styles.neutralMediaBlock}>
            <span className={styles.neutralMediaTag}>
              Project {project.number}
            </span>
          </div>
        )}
      </div>

      {/* Split-Reveal Info Box Container (Circled in User's Image) */}
      <div
        ref={panelRef}
        className={`${styles.splitPanelContainer} ${
          isPanelRevealed ? styles.panelRevealed : ""
        } ${isAnimationFinished ? styles.animationFinished : ""} ${
          index % 2 === 1 ? styles.cardStagger : ""
        }`}
      >
        {/* Base Panel (Permanent, interactive after merge) */}
        <div className={styles.labelPanel}>{renderPanelContent()}</div>

        {/* Split Phase 1: Right half (slides horizontally from right) */}
        <div className={styles.rightHalfSegment} aria-hidden="true">
          <div className={styles.halfPanelBody}>{renderPanelContent()}</div>
        </div>

        {/* Split Phase 2: Left half (rises vertically from bottom) */}
        <div className={styles.leftHalfSegment} aria-hidden="true">
          <div className={styles.halfPanelBody}>{renderPanelContent()}</div>
        </div>
      </div>
    </article>
  );
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const Works: React.FC = () => {
  const { works } = siteContent;
  const { elementRef, isRevealed } = useScrollReveal<HTMLElement>({
    threshold: 0.08,
  });

  // First 4 projects are always visible, the rest sit behind "Show more" — all from siteContent
  const visibleProjects = useMemo<ProjectItem[]>(
    () => works.projects.slice(0, INITIAL_VISIBLE_PROJECTS),
    [works.projects],
  );

  const extraProjects = useMemo<ProjectItem[]>(
    () => works.projects.slice(INITIAL_VISIBLE_PROJECTS),
    [works.projects],
  );

  // "Show more" state
  const [hasOpened, setHasOpened] = useState(false); // extra cards are mounted lazily on first open
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSettledOpen, setIsSettledOpen] = useState(false); // fully open → shadows no longer clipped
  const moreRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(true);

  const { elementRef: moreRowRef, isRevealed: isMoreRowRevealed } =
    useScrollReveal<HTMLDivElement>({
      threshold: 0.4,
      rootMargin: "0px 0px -8% 0px",
    });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isExpanded) return;
    const timer = window.setTimeout(
      () => setIsSettledOpen(true),
      EXPAND_MS + 80,
    );
    return () => window.clearTimeout(timer);
  }, [isExpanded]);

  // After opening, bring the new projects into view (the button moves below them)
  const scrollToNewProjects = () => {
    const el = moreRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    const vh = window.innerHeight;
    if (top > vh * 0.4) {
      window.scrollTo({
        top: window.scrollY + top - vh * 0.2,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    }
  };

  // After closing, land exactly on the divider line under the button (the border just before
  // CAPABILITIES) so the next section is never visible. Works on desktop and any phone size.
  const scrollBackToButton = () => {
    const el = moreRef.current;
    const section = el?.closest("section");
    if (!el || !section) return;

    // Where the section's bottom edge (the divider line) will be once the extra cards have collapsed
    const collapsingHeight = el.getBoundingClientRect().height;
    const dividerY =
      section.getBoundingClientRect().bottom +
      window.scrollY -
      collapsingHeight;

    // Visible screen height (accounts for mobile browser bars)
    const viewportH = window.visualViewport?.height ?? window.innerHeight;

    // +2px keeps the divider line itself visible at the very bottom edge
    const target = Math.max(0, dividerY - viewportH + 2);

    if (window.scrollY > target) {
      window.scrollTo({
        top: target,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    }
  };

  const handleToggleMore = () => {
    if (isExpanded) {
      setIsSettledOpen(false);
      setIsExpanded(false);
      scrollBackToButton();
      return;
    }

    const expand = () => {
      if (!isMountedRef.current) return;
      setIsExpanded(true);
      scrollToNewProjects();
    };

    if (!hasOpened) {
      // mount the collapsed cards first, paint once, THEN expand so the transition always plays
      setHasOpened(true);
      window.requestAnimationFrame(() => window.requestAnimationFrame(expand));
    } else {
      expand();
    }
  };

  const totalCount = visibleProjects.length + extraProjects.length;
  const shownCount = isExpanded ? totalCount : visibleProjects.length;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section
      id="works"
      ref={elementRef}
      className={`${styles.worksSection} ${isRevealed ? styles.isRevealed : ""}`}
      aria-label="Works"
      data-debug-content={getPlaceholderDebugAttr(works.status)}
    >
      {/* Faint Background Watermark */}
      <div className={`ghostWatermark ${styles.watermark}`} aria-hidden="true">
        {works.faintWatermark}
      </div>

      <div className="container">
        {/* Section Header with Left Accent Bar */}
        <div className={styles.headerRow}>
          <div className={styles.sectionHeader}>
            <div className={styles.titleAccentBar} aria-hidden="true" />
            {works.sectionNumber ? (
              <span className={styles.sectionNumber}>
                {works.sectionNumber}
              </span>
            ) : null}
            <h2 className={styles.sectionTitle}>{works.sectionTitle}</h2>
          </div>
          <div className={styles.headerUnderline} aria-hidden="true" />
        </div>

        <p className={styles.introText}>{works.intro}</p>

        {/* Dynamic Projects Grid */}
        <div className={styles.projectsGrid}>
          {visibleProjects.map((project: ProjectItem, index: number) => (
            <ProjectCardItem key={project.id} project={project} index={index} />
          ))}
        </div>

        {extraProjects.length > 0 && (
          <>
            {/* Extra projects: collapsed by default, expands smoothly with the button below */}
            {hasOpened && (
              <div
                id="works-more-projects"
                ref={moreRef}
                className={`${styles.moreProjects} ${
                  isExpanded ? styles.moreOpen : ""
                }`}
                aria-hidden={!isExpanded}
              >
                <div
                  className={`${styles.moreInner} ${
                    isSettledOpen ? styles.moreInnerSettled : ""
                  }`}
                >
                  <div className={styles.moreSpacer}>
                    <div className={styles.projectsGrid}>
                      {extraProjects.map(
                        (project: ProjectItem, index: number) => (
                          <ProjectCardItem
                            key={project.id}
                            project={project}
                            index={visibleProjects.length + index}
                          />
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Floating "Show more" control */}
            <div
              ref={moreRowRef}
              className={`${styles.moreRow} ${
                isMoreRowRevealed ? styles.moreRowRevealed : ""
              }`}
            >
              <span className={styles.moreRail} aria-hidden="true" />

              <div className={styles.showMoreFloat}>
                <button
                  type="button"
                  className={`${styles.showMoreBtn} ${
                    isExpanded ? styles.showMoreBtnOpen : ""
                  }`}
                  onClick={handleToggleMore}
                  aria-expanded={isExpanded}
                  aria-controls="works-more-projects"
                  aria-label={
                    isExpanded
                      ? "Show fewer projects"
                      : `Show ${extraProjects.length} more projects`
                  }
                >
                  <span className={styles.showMoreLabelWrap} aria-hidden="true">
                    <span className={styles.showMoreLabelMore}>Show more</span>
                    <span className={styles.showMoreLabelLess}>Show less</span>
                  </span>
                  <span
                    key={shownCount}
                    className={styles.showMoreCount}
                    aria-hidden="true"
                  >
                    {pad(shownCount)} / {pad(totalCount)}
                  </span>
                  <span className={styles.showMoreIcon} aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>
              </div>

              <span
                className={`${styles.moreRail} ${styles.moreRailRight}`}
                aria-hidden="true"
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
};
