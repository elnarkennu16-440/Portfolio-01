import React from "react";
import { siteContent, ProjectItem } from "../../content/siteContent";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { getPlaceholderDebugAttr } from "../../utils/debugContent";
import { TechStackIcons } from "../../components/TechStackIcons/TechStackIcons";
import styles from "./Works.module.css";

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
          {works.projects.map((project: ProjectItem) => {
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
                className={styles.projectCard}
                data-debug-content={getPlaceholderDebugAttr(project.status)}
              >
                {/* Media Container */}
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

                {/* Overlapping Label Panel */}
                <div className={styles.labelPanel}>
                  <div className={styles.panelMetaRow}>
                    <span className={styles.projectNumeral}>
                      {project.number}
                    </span>
                    <span className={styles.projectYear}>{project.year}</span>
                  </div>

                  <h3 className={styles.projectTitle}>{project.title}</h3>

                  <p className={styles.projectDescription}>
                    {project.description}
                  </p>

                  {/* Tech Stack Icons (Dark Gray Vignette) */}
                  {project.tags.length > 0 && (
                    <TechStackIcons tags={project.tags} />
                  )}

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
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
