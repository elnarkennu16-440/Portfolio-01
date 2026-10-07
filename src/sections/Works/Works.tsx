import React, { useState, useEffect } from "react";
import { siteContent, ProjectItem } from "../../content/siteContent";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { getPlaceholderDebugAttr } from "../../utils/debugContent";
import { TechStackIcons } from "../../components/TechStackIcons/TechStackIcons";
import styles from "./Works.module.css";

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

export const Works: React.FC = () => {
  const { works } = siteContent;
  const { elementRef, isRevealed } = useScrollReveal<HTMLElement>({
    threshold: 0.08,
  });

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
          {works.projects.map((project: ProjectItem, index: number) => (
            <ProjectCardItem key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
