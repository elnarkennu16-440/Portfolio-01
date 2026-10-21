import React, { useEffect, useState } from "react";
import type { ProjectItem } from "../../content/siteContent";
import { getIconForTag } from "../../components/TechStackIcons/TechStackIcons";
import styles from "./mobileprojectdescriptionmodal.module.css";

export interface MobileProjectDescriptionModalProps {
  project: ProjectItem;
  onClose: () => void;
}

export const MobileProjectDescriptionModal: React.FC<
  MobileProjectDescriptionModalProps
> = ({ project, onClose }) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const overview =
    project.overview || project.description || "No overview provided.";
  const status = project.modalStatus || "Completed";
  const duration = project.duration || project.year;
  const projectType = project.projectType || project.role;

  // Only show the subtitle when there is something to show (no stray "·" when role/year are empty)
  const subtitle = [project.role, project.year]
    .filter((v) => v && String(v).trim() !== "")
    .join(" · ");

  const features =
    project.keyFeatures && project.keyFeatures.length > 0
      ? project.keyFeatures
      : [
          project.description,
          `Implemented with modern workflow featuring ${project.tags.slice(0, 3).join(", ")}.`,
          `Engineered for optimal responsiveness, security, and performance.`,
        ];

  const hasLive = Boolean(
    project.liveUrl && project.liveUrl !== "#" && project.liveUrl.trim() !== "",
  );
  const hasRepo = Boolean(
    project.repoUrl && project.repoUrl !== "#" && project.repoUrl.trim() !== "",
  );

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className={styles.modalDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-modal-project-title"
        aria-describedby={
          subtitle ? "mobile-modal-project-subtitle" : undefined
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Styled identically to Message Me modal with serif title and ESC ✕ */}
        <div className={styles.dialogHeader}>
          <div className={styles.titleArea}>
            <div className={styles.titleRow}>
              <span className={styles.numberMono}>{project.number}</span>
              <h2
                id="mobile-modal-project-title"
                className={styles.dialogTitle}
              >
                {project.title}
              </h2>
            </div>
            {subtitle && (
              <p
                id="mobile-modal-project-subtitle"
                className={styles.dialogSubtitle}
              >
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close overview dialog (Escape)"
          >
            ESC ✕
          </button>
        </div>

        {/* Modal Scrollable Body with slender scrollbar */}
        <div className={styles.modalBody}>
          {/* Top Banner Media */}
          <div className={styles.mediaContainer}>
            {project.imageUrl && !imageError ? (
              <img
                src={project.imageUrl}
                alt={project.imageAlt || project.title}
                className={styles.previewImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className={styles.previewPlaceholder}>
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className={styles.placeholderText}>
                  PREVIEW COMING SOON
                </span>
              </div>
            )}
          </div>

          {/* 01 — Overview Section */}
          <div className={styles.sectionBlock}>
            <span className={styles.sectionLabel}>01 — overview</span>
            <div className={styles.noticeBox} role="note">
              <p className={styles.overviewText}>{overview}</p>
            </div>
          </div>

          {/* 3-Column Metadata Bar */}
          <div className={styles.metaCard}>
            <div className={styles.metaCol}>
              <span className={styles.metaLabel}>STATUS</span>
              <div className={styles.metaValue}>
                <span className={styles.statusDot} aria-hidden="true" />
                <span>{status}</span>
              </div>
            </div>
            <div className={styles.metaCol}>
              <span className={styles.metaLabel}>DURATION</span>
              <div className={styles.metaValue}>{duration}</div>
            </div>
            <div className={styles.metaCol}>
              <span className={styles.metaLabel}>TYPE</span>
              <div className={styles.metaValue}>{projectType}</div>
            </div>
          </div>

          {/* 02 — Stack Section */}
          {project.tags && project.tags.length > 0 && (
            <div className={styles.sectionBlock}>
              <span className={styles.sectionLabel}>02 — stack</span>
              <div className={styles.stackPills}>
                {project.tags.map((tag) => (
                  <span key={tag} className={styles.stackPill}>
                    <span className={styles.pillIcon}>
                      {getIconForTag(tag)}
                    </span>
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 03 — Key Features Section */}
          {features && features.length > 0 && (
            <div className={styles.sectionBlock}>
              <span className={styles.sectionLabel}>03 — key features</span>
              <ul className={styles.featuresList}>
                {features.map((feature, idx) => (
                  <li key={idx} className={styles.featureItem}>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Modal Action Links at Bottom */}
          {(hasLive || hasRepo) && (
            <div className={styles.actionRow}>
              {hasLive && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.pillActionBtn}
                >
                  <span>Live Demo</span>
                  <span aria-hidden="true">↗</span>
                </a>
              )}
              {hasRepo && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.pillActionBtn}
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
                  <span>Repository</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileProjectDescriptionModal;
