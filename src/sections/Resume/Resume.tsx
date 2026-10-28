import React, { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, FileText, X } from "lucide-react";
import { ThemeToggle } from "../../components/ThemeToggle/ThemeToggle";
import type { Theme } from "../../hooks/useTheme";
import logoImg from "../../assets/logo/KE-LOGO-.png";
import styles from "./Resume.module.css";
import { FlowLineFour } from "./Flowlinefour";

export interface ResumeProps {
  onBack: () => void;
  theme: Theme;
  onToggleTheme: (e?: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * FILE PATHS — these MUST match the real filenames inside /public/resume/
 * (your folder has: Elnar-Kennu-Resume.pdf and Elnar-Kennu-Resume.docx).
 * Before, the code pointed to different names, so Vite returned the site's
 * index.html instead of the file → that's why it looked blank / not real.
 */
const BASE = import.meta.env.BASE_URL;
const PDF_URL = `${BASE}resume/Elnar-Kennu-Resume.pdf`;
const DOCX_URL = `${BASE}resume/Elnar-Kennu-Resume.docx`;

type PreviewType = "pdf" | "word";

// Width the resume paper is designed at. When the screen is narrower than this
// (phones / small tablets) the whole paper is scaled down to fit as ONE page.
const PAPER_BASE_WIDTH = 820;

export const Resume: React.FC<ResumeProps> = ({
  onBack,
  theme,
  onToggleTheme,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<PreviewType>("pdf");

  // ── Mobile fit: scale the resume paper so it shows as one full page ──────
  const paperWrapRef = useRef<HTMLDivElement>(null);
  const paperInnerRef = useRef<HTMLDivElement>(null);
  const [paperFit, setPaperFit] = useState<{
    scale: number;
    height: number | null;
  }>({ scale: 1, height: null });

  useEffect(() => {
    const wrap = paperWrapRef.current;
    const inner = paperInnerRef.current;
    if (!wrap || !inner) return;

    const update = () => {
      const w = wrap.clientWidth;
      if (w >= PAPER_BASE_WIDTH) {
        setPaperFit((prev) =>
          prev.height === null ? prev : { scale: 1, height: null },
        );
        return;
      }
      const scale = w / PAPER_BASE_WIDTH;
      const height = Math.round(inner.offsetHeight * scale);
      setPaperFit((prev) =>
        prev.scale === scale && prev.height === height
          ? prev
          : { scale, height },
      );
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  const isPaperScaled = paperFit.height !== null;
  // Lock background scroll while Resume subpage is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isPreviewOpen) {
          setIsPreviewOpen(false);
        } else {
          onBack();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onBack, isPreviewOpen]);

  const handleOpenPdfPreview = () => {
    setPreviewType("pdf");
    setIsPreviewOpen(true);
  };

  const handleOpenWordPreview = () => {
    setPreviewType("word");
    setIsPreviewOpen(true);
  };

  return (
    <div
      className={styles.resumeOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Resume"
      data-theme={theme}
    >
      {/* ── Top Navbar: icon only (left) · theme + X (right) ─────────────── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button
            type="button"
            onClick={onBack}
            className={styles.logoLink}
            aria-label="Return to portfolio homepage"
          >
            <img
              src={logoImg}
              alt=""
              className={styles.logo}
              width={28}
              height={31}
            />
          </button>

          <div className={styles.headerActions}>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button
              type="button"
              onClick={onBack}
              className={styles.closeBtn}
              aria-label="Close resume view"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Stage ──────────────────────────────────────────────────────── */}
      <main className={styles.mainStage}>
        <div className={styles.column}>
          {/* Decorative thin curves (behind everything, stop at the paper) */}
          <FlowLineFour anchorRef={paperWrapRef} />

          {/* Title */}
          <h1 className={styles.mainTitle}>RESUME</h1>

          {/* Short paragraph */}
          <p className={styles.shortParagraph} lang="en">
            Below is a copy of my resume, detailing my academic background,
            internship experience, and software development work. It outlines my
            technical foundations alongside the key projects I have built. You
            may review the complete document below or download a copy in PDF or
            DOCX format.
          </p>

          {/* Buttons: PDF on the left, DOCX on the right */}
          <div className={styles.buttonRow}>
            <div className={styles.buttonGroup}>
              <a
                href={PDF_URL}
                download="Elnar-Kennu-Resume.pdf"
                className={styles.primaryBtn}
                title="Download PDF version of resume"
              >
                <Download className={styles.btnIcon} aria-hidden="true" />
                <span>Download PDF</span>
              </a>
              <button
                type="button"
                onClick={handleOpenPdfPreview}
                className={styles.outlineBtn}
                title="Preview PDF"
              >
                <ExternalLink className={styles.btnIcon} aria-hidden="true" />
                <span>Preview</span>
              </button>
            </div>

            <div className={styles.buttonGroup}>
              <a
                href={DOCX_URL}
                download="Elnar-Kennu-Resume.docx"
                className={styles.primaryBtn}
                title="Download Microsoft Word version"
              >
                <Download className={styles.btnIcon} aria-hidden="true" />
                <span>Download DOCX</span>
              </a>
              <button
                type="button"
                onClick={handleOpenWordPreview}
                className={styles.outlineBtn}
                title="Preview Word document"
              >
                <FileText className={styles.btnIcon} aria-hidden="true" />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {/* ── My Resume Design (ATS format, 1 page, same as real resume) ──── */}
          <div
            ref={paperWrapRef}
            className={styles.paperScaleWrap}
            style={
              isPaperScaled
                ? { height: paperFit.height!, overflow: "hidden" }
                : undefined
            }
          >
            <div
              ref={paperInnerRef}
              style={
                isPaperScaled
                  ? {
                      width: PAPER_BASE_WIDTH,
                      transform: `scale(${paperFit.scale})`,
                      transformOrigin: "top left",
                    }
                  : undefined
              }
            >
              <article className={styles.resumePaper}>
                <header className={styles.docHeader}>
                  <h2 className={styles.docName}>KENNU M. ELNAR</h2>
                  <p className={styles.docContact}>
                    (+63) 945-387-0032 |{" "}
                    <a href="mailto:elnarkennu16@gmail.com">
                      elnarkennu16@gmail.com
                    </a>{" "}
                    | Mercedes, Camarines Norte |{" "}
                    <a
                      href="https://github.com/elnarkennu16-440"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      github.com/elnarkennu16-440
                    </a>
                  </p>
                </header>

                {/* EDUCATION */}
                <section className={styles.docSection}>
                  <h3 className={styles.docSectionTitle}>Education</h3>
                  <div className={styles.row}>
                    <span className={styles.bold}>
                      Bachelor of Science in Information Systems (BSIS)
                    </span>
                    <span>2022 - 2026</span>
                  </div>
                  <div className={styles.row}>
                    <span>Camarines Norte State College</span>
                    <span>Daet, Camarines Norte, Philippines</span>
                  </div>
                  <div className={`${styles.row} ${styles.gapTop}`}>
                    <span className={styles.bold}>
                      Secondary Education (Senior High School)
                    </span>
                    <span>2016 - 2022</span>
                  </div>
                  <div className={styles.row}>
                    <span>San Roque National High School</span>
                    <span>Mercedes, Camarines Norte, Philippines</span>
                  </div>
                </section>

                {/* EXPERIENCE */}
                <section className={styles.docSection}>
                  <h3 className={styles.docSectionTitle}>Experience</h3>

                  <div className={styles.row}>
                    <span>
                      <span className={styles.bold}>
                        Freelance Software Developer
                      </span>{" "}
                      | React, TypeScript, HTML5, CSS3, REST APIs
                    </span>
                    <span>July 2026 - Present</span>
                  </div>
                  <div className={styles.row}>
                    <span>Self-Employed (Fiverr & uTest)</span>
                    <span>Independent Contracting</span>
                  </div>
                  <ul className={styles.bullets}>
                    <li>
                      Translating client user stories and design specifications
                      into modular React and TypeScript applications.
                    </li>
                    <li>
                      Implementing modern layout architectures with responsive
                      CSS, semantic HTML5, and strict WCAG AA contrast
                      compliance.
                    </li>
                    <li>
                      Conducting manual test passes across mobile, tablet, and
                      desktop viewports to catch layout shifts and form
                      submission errors.
                    </li>
                    <li>
                      Integrating third-party APIs, managing client data flow,
                      and configuring clean production deployments.
                    </li>
                  </ul>

                  <div className={`${styles.row} ${styles.gapTop}`}>
                    <span className={styles.bold}>
                      RGS Recovery Management and Collection Services Inc.
                    </span>
                    <span>Feb 2026 - May 2026</span>
                  </div>
                  <div className={styles.row}>
                    <span>
                      IT Support Intern | Hardware, Software, OS Setup, Network
                      Troubleshooting
                    </span>
                    <span>Quezon City, Philippines</span>
                  </div>
                  <ul className={styles.bullets}>
                    <li>
                      Assisted in daily technical support for staff, handling
                      hardware, software, and network connectivity
                      troubleshooting.
                    </li>
                    <li>
                      Performed routine workstation setups, operating system
                      installations, system checks, and peripheral
                      configurations.
                    </li>
                    <li>
                      Maintained accurate IT asset logs, user support records,
                      and organized departmental technical documentation.
                    </li>
                  </ul>
                </section>

                {/* PROJECTS */}
                <section className={styles.docSection}>
                  <div className={styles.sectionTitleRow}>
                    <h3 className={styles.docSectionTitle}>Projects</h3>
                    <span className={styles.sectionTitleMeta}>2024 - 2026</span>
                  </div>

                  <div className={styles.row}>
                    <span>
                      <span className={styles.bold}>
                        Web-Based Management Information System (MIS)
                      </span>{" "}
                      | React (Vite), PHP, Laravel, MySQL, Tailwind CSS
                    </span>
                  </div>
                  <ul className={styles.bullets}>
                    <li>
                      Co-developed a capstone web-based student MIS in a
                      5-member team featuring secure user portals and automated
                      notifications.
                    </li>
                    <li>
                      Contributed to full-stack web development, relational
                      database integration, and responsive user interface
                      design.
                    </li>
                    <li>
                      Assisted in system functional testing, workflow
                      documentation, and database schema structuring.
                    </li>
                  </ul>

                  <div className={`${styles.row} ${styles.gapTop}`}>
                    <span>
                      <span className={styles.bold}>
                        E-Commerce Platform "NobleClassics"
                      </span>{" "}
                      | PHP, MySQL, HTML5, CSS3, JavaScript
                    </span>
                    <span>2024</span>
                  </div>
                  <ul className={styles.bullets}>
                    <li>
                      Developed a full-stack online bookstore featuring user
                      authentication, shopping cart, checkout system, and admin
                      panel.
                    </li>
                    <li>
                      Designed relational database tables and ensured
                      cross-device user interface consistency.
                    </li>
                    <li>
                      Implemented input validation and secure login session
                      handling across admin and client portals.
                    </li>
                  </ul>
                </section>

                {/* TECHNICAL SKILLS */}
                <section className={styles.docSection}>
                  <h3 className={styles.docSectionTitle}>Technical Skills</h3>
                  <ul className={styles.bullets}>
                    <li>
                      <span className={styles.bold}>Frontend:</span> HTML5,
                      CSS3, JavaScript, TypeScript, React (Vite), Vue.js,
                      Next.js, Tailwind CSS
                    </li>
                    <li>
                      <span className={styles.bold}>Backend & Security:</span>{" "}
                      Node.js, Express.js, PHP, Laravel, JWT, GitGuardian,
                      Dependabot, OWASP ZAP
                    </li>
                    <li>
                      <span className={styles.bold}>Databases:</span> MySQL,
                      PostgreSQL, Supabase, Firebase, MongoDB
                    </li>
                    <li>
                      <span className={styles.bold}>
                        Testing & Developer Tools:
                      </span>{" "}
                      Postman, Chrome DevTools, Asana, Jira, Git/GitHub, Vercel,
                      Hostinger, Cloudflare, VS Code, npm, Vite
                    </li>
                    <li>
                      <span className={styles.bold}>AI Tools & Mobile:</span>{" "}
                      Gemini, Claude, Manus, Perplexity, Flutter, React Native
                    </li>
                  </ul>
                </section>

                {/* SEMINARS & TRAININGS */}
                <section className={styles.docSection}>
                  <h3 className={styles.docSectionTitle}>
                    Seminars & Trainings
                  </h3>
                  <div className={styles.row}>
                    <span className={styles.bold}>
                      IS WEB 3.0: Exploring Innovation in Web Development
                    </span>
                    <span>May 7, 2025</span>
                  </div>
                  <div className={styles.row}>
                    <span>Camarines Norte State College</span>
                    <span>Daet, Camarines Norte</span>
                  </div>
                  <div className={`${styles.row} ${styles.gapTop}`}>
                    <span className={styles.bold}>
                      BITSCON: Bicol IT Student Congress 2024
                    </span>
                  </div>
                  <div className={styles.row}>
                    <span>Camarines Norte State College</span>
                    <span>April 25 - 26, 2024</span>
                  </div>
                </section>
              </article>
            </div>
          </div>
        </div>
      </main>

      {/* ── Preview Modal (PDF + Word) ───────────────────────────────────────── */}
      {isPreviewOpen && (
        <div
          className={styles.previewModalBackdrop}
          onClick={() => setIsPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Document Preview"
        >
          <div
            className={styles.previewModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.previewModalHeader}>
              <span className={styles.previewModalTitle}>
                {previewType === "pdf" ? "PDF Preview" : "Word Preview"}
              </span>
              <div className={styles.previewHeaderActions}>
                <a
                  href={previewType === "pdf" ? PDF_URL : DOCX_URL}
                  download={
                    previewType === "pdf"
                      ? "Elnar-Kennu-Resume.pdf"
                      : "Elnar-Kennu-Resume.docx"
                  }
                  className={styles.closeBtn}
                  aria-label="Download this file"
                >
                  <Download size={16} aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className={styles.closeBtn}
                  aria-label="Close preview"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className={styles.previewModalBody}>
              {/* Word preview uses the same clean PDF rendering so layout is identical */}
              <iframe
                src={`${PDF_URL}#view=FitH`}
                title={
                  previewType === "pdf"
                    ? "Kennu Elnar Resume PDF"
                    : "Kennu Elnar Resume Word preview"
                }
                className={styles.docEmbedFrame}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resume;
