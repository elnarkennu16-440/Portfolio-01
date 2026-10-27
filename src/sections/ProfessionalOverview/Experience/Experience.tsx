import React, { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { siteContent } from "../../../content/siteContent";
import { ThemeToggle } from "../../../components/ThemeToggle/ThemeToggle";
import type { Theme } from "../../../hooks/useTheme";
import logoImg from "../../../assets/logo/KE-LOGO-.png";
import styles from "./Experience.module.css";

gsap.registerPlugin(ScrollTrigger);

export interface ExperienceProps {
  onBack: () => void;
  theme: Theme;
  onToggleTheme: (e?: React.MouseEvent<HTMLButtonElement>) => void;
}

/* ---------------------------- tweak these ---------------------------------
   STEP_VIEWPORT_RATIO : scroll distance per page (fraction of screen height).
                         Smaller = shorter scroll.
   FOLD_DEG            : how far the top page folds down over its bottom edge.
   STACK_OFFSET_Y      : how much of the pages underneath peeks out on top (px).
   STACK_NARROW        : how much narrower each page underneath is (0.028 = 2.8%).
   ------------------------------------------------------------------------- */
const STEP_VIEWPORT_RATIO = 0.6;
const FOLD_DEG = 96;
const STACK_OFFSET_Y = 14;
const STACK_NARROW = 0.028;
const MAX_VISIBLE_DEPTH = 3;
const SHADE_BY_DEPTH = [0, 0.22, 0.38, 0.5];

export const Experience: React.FC<ExperienceProps> = ({
  onBack,
  theme,
  onToggleTheme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);

  const { professionalOverview, meta } = siteContent;
  const experiences = professionalOverview.experiences;

  // Lock body scroll while subpage is open & handle Escape key
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onBack]);

  /* =======================================================================
     GSAP + ScrollTrigger  -  PAGE FOLD STACK
     Desktop: the stage is pinned. The experiences are a stack of pages.
     While you scroll, the top page FOLDS DOWN over its bottom edge (3D,
     hinge at the bottom) and the next page comes forward from the stack.
     The animation is tied to the scroll (scrub) and the scroll snaps to
     each page, so you only scroll a short distance per page.
     Small screens: normal stacked page with side reveals.
     Reduced motion: same paging, but a simple cross-fade (no 3D).
     ======================================================================= */
  useLayoutEffect(() => {
    const root = containerRef.current;
    const header = headerRef.current;
    const stage = stageRef.current;
    const stack = slidesRef.current;
    const nav = navRef.current;
    const marker = markerRef.current;
    if (!root || !header || !stage || !stack || !nav || !marker) return;

    const slides = Array.from(stack.children) as HTMLElement[];
    const navItems = Array.from(
      nav.querySelectorAll<HTMLButtonElement>("button"),
    );
    const total = slides.length;
    const mm = gsap.matchMedia();

    const q = (leaf: Element, part: string) =>
      leaf.querySelectorAll<HTMLElement>(`[data-part="${part}"]`);

    mm.add(
      {
        book: "(min-width: 1100px) and (min-height: 680px)",
        compact: "(max-width: 1099px), (max-height: 679px)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { book, reduce } = context.conditions as {
          book: boolean;
          reduce: boolean;
        };

        /* ============================ BOOK (desktop) ===================== */
        if (book && total > 1) {
          root.classList.add(styles.isPinned);
          root.dataset.layout = "book";
          root.style.setProperty("--nav-h", `${header.offsetHeight}px`);

          const leaves = slides;
          const shades = leaves.map(
            (l) => l.querySelector<HTMLElement>("[data-shade]") as HTMLElement,
          );

          // depth = how far a page is below the top of the stack (0 = top page)
          const d = (n: number) => Math.min(n, MAX_VISIBLE_DEPTH);
          const yAt = (n: number) => (reduce ? 0 : -STACK_OFFSET_Y * d(n));
          const sxAt = (n: number) => (reduce ? 1 : 1 - STACK_NARROW * d(n));
          const opAt = (n: number) =>
            reduce ? (n === 0 ? 1 : 0) : n > MAX_VISIBLE_DEPTH ? 0 : 1;
          const shadeAt = (n: number) => (reduce ? 0 : SHADE_BY_DEPTH[d(n)]);
          const sideOf = (j: number) => (j % 2 === 0 ? -1 : 1);
          const shift = reduce ? 0 : 48;

          /* ---- initial state: a neat stack, only page 1 shows its content ---- */
          leaves.forEach((leaf, j) => {
            gsap.set(leaf, {
              transformOrigin: "50% 100%",
              y: yAt(j),
              scaleX: sxAt(j),
              rotateX: 0,
              opacity: opAt(j),
              zIndex: total - j,
            });
            gsap.set(shades[j], { opacity: shadeAt(j) });

            if (j > 0) {
              gsap.set(q(leaf, "txt"), { opacity: 0, x: sideOf(j) * shift });
              gsap.set(q(leaf, "rule"), {
                scaleX: 0,
                transformOrigin: "0% 50%",
              });
              gsap.set(q(leaf, "box"), {
                opacity: 0,
                clipPath: "inset(0% 100% 0% 0% round 6px)",
              });
              gsap.set(q(leaf, "pill"), { opacity: 0, y: 8 });
            }
          });

          /* ---- rail marker (stretches / morphs to the active step) ---- */
          let current = 0;
          let markerTl: gsap.core.Timeline | null = null;

          const placeMarker = () => {
            const item = navItems[current];
            if (!item) return;
            gsap.set(marker, { y: item.offsetTop, height: item.offsetHeight });
          };

          const moveMarker = (from: number, to: number) => {
            const a = navItems[from];
            const b = navItems[to];
            if (!a || !b) return;
            const top = Math.min(a.offsetTop, b.offsetTop);
            const bottom = Math.max(
              a.offsetTop + a.offsetHeight,
              b.offsetTop + b.offsetHeight,
            );
            markerTl?.kill();
            markerTl = gsap
              .timeline()
              .to(marker, {
                y: top,
                height: bottom - top,
                duration: 0.28,
                ease: "power2.in",
              })
              .to(marker, {
                y: b.offsetTop,
                height: b.offsetHeight,
                duration: 0.5,
                ease: "power3.out",
              });
          };

          const setActive = (idx: number) => {
            navItems.forEach((btn, k) => {
              const on = k === idx;
              btn.classList.toggle(styles.navActive, on);
              if (on) btn.setAttribute("aria-current", "step");
              else btn.removeAttribute("aria-current");
            });
            leaves.forEach((leaf, k) =>
              leaf.setAttribute("aria-hidden", k === idx ? "false" : "true"),
            );
          };

          setActive(0);
          placeMarker();

          /* ---- intro (first page + left side), plays once ---- */
          gsap.from(q(leaves[0], "txt"), {
            opacity: 0,
            x: -shift,
            duration: 0.8,
            ease: "power4.out",
            stagger: 0.04,
            clearProps: "transform",
          });
          gsap.from(q(leaves[0], "pill"), {
            opacity: 0,
            y: 8,
            duration: 0.5,
            ease: "power3.out",
            stagger: 0.035,
            delay: 0.5,
            clearProps: "transform",
          });
          gsap.from(stage.querySelectorAll("[data-aside]"), {
            opacity: 0,
            x: -40,
            duration: 0.9,
            ease: "power4.out",
            stagger: 0.08,
            clearProps: "transform",
          });
          gsap.from(navItems, {
            opacity: 0,
            x: -24,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.07,
            delay: 0.3,
            clearProps: "transform",
          });

          /* ---- the scrubbed page-fold timeline (1 unit = 1 page) ---- */
          const tl = gsap.timeline({
            defaults: { immediateRender: false },
            scrollTrigger: {
              scroller: root,
              trigger: stage,
              start: () => `top ${header.offsetHeight}px`,
              end: () =>
                `+=${(total - 1) * Math.round(root.clientHeight * STEP_VIEWPORT_RATIO)}`,
              pin: true,
              scrub: 0.8,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              // auto-break: always settles exactly on one page
              snap: {
                snapTo: 1 / (total - 1),
                duration: { min: 0.25, max: 0.7 },
                delay: 0.08,
                ease: "power2.inOut",
              },
              onUpdate: (self) => {
                stage.style.setProperty("--p", self.progress.toFixed(4));
                const idx = Math.round(self.progress * (total - 1));
                if (idx !== current) {
                  moveMarker(current, idx);
                  current = idx;
                  setActive(idx);
                }
              },
            },
          });

          for (let i = 0; i < total - 1; i++) {
            const leaf = leaves[i];

            if (reduce) {
              // simple cross-fade
              tl.to(
                leaf,
                { autoAlpha: 0, duration: 0.5, ease: "none" },
                i + 0.25,
              );
            } else {
              // 1) the top page FOLDS DOWN over its bottom edge
              tl.fromTo(
                leaf,
                { rotateX: 0 },
                { rotateX: FOLD_DEG, duration: 0.85, ease: "power2.in" },
                i,
              )
                // it gets darker while it tilts away from the light
                .fromTo(
                  shades[i],
                  { opacity: 0 },
                  { opacity: 0.55, duration: 0.6, ease: "power1.in" },
                  i,
                )
                // gone once it is edge-on
                .to(
                  leaf,
                  { autoAlpha: 0, duration: 0.01, ease: "none" },
                  i + 0.84,
                );
            }

            // 2) every page underneath moves one step forward in the stack
            for (let j = i + 1; j < total; j++) {
              const from = j - i;
              const to = j - i - 1;
              tl.fromTo(
                leaves[j],
                { y: yAt(from), scaleX: sxAt(from), opacity: opAt(from) },
                {
                  y: yAt(to),
                  scaleX: sxAt(to),
                  opacity: opAt(to),
                  duration: 0.8,
                  ease: "power2.out",
                },
                i + 0.1,
              ).fromTo(
                shades[j],
                { opacity: shadeAt(from) },
                { opacity: shadeAt(to), duration: 0.8, ease: "power2.out" },
                i + 0.1,
              );
            }

            // 3) the content of the new page slides in from the side, in order
            const nx = leaves[i + 1];
            const side = sideOf(i + 1);
            tl.fromTo(
              q(nx, "txt"),
              { opacity: 0, x: side * shift },
              {
                opacity: 1,
                x: 0,
                duration: 0.3,
                ease: "power2.out",
                stagger: 0.012,
              },
              i + 0.45,
            )
              .fromTo(
                q(nx, "rule"),
                { scaleX: 0 },
                { scaleX: 1, duration: 0.35, ease: "power2.inOut" },
                i + 0.5,
              )
              .fromTo(
                q(nx, "box"),
                { opacity: 0, clipPath: "inset(0% 100% 0% 0% round 6px)" },
                {
                  opacity: 1,
                  clipPath: "inset(0% 0% 0% 0% round 6px)",
                  duration: 0.4,
                  ease: "power2.inOut",
                },
                i + 0.5,
              )
              .fromTo(
                q(nx, "pill"),
                { opacity: 0, y: 8 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.25,
                  ease: "power2.out",
                  stagger: 0.01,
                },
                i + 0.62,
              );
          }

          // make the timeline exactly (pages - 1) units long
          tl.to({}, { duration: 0.0001 }, total - 1 - 0.0001);

          stRef.current = tl.scrollTrigger ?? null;
          ScrollTrigger.addEventListener("refresh", placeMarker);

          return () => {
            ScrollTrigger.removeEventListener("refresh", placeMarker);
            markerTl?.kill();
            tl.scrollTrigger?.kill();
            tl.kill();
            stRef.current = null;
            root.classList.remove(styles.isPinned);
            delete root.dataset.layout;
            root.style.removeProperty("--nav-h");
            stage.style.removeProperty("--p");
            leaves.forEach((l) => l.removeAttribute("aria-hidden"));
            navItems.forEach((b) => b.removeAttribute("aria-current"));
            gsap.set(
              [
                ...leaves,
                ...shades,
                ...navItems,
                marker,
                ...Array.from(
                  root.querySelectorAll("[data-part], [data-aside]"),
                ),
              ],
              { clearProps: "all" },
            );
          };
        }

        /* ================= STACKED (phones / short screens) ============== */
        root.dataset.layout = "stacked";
        if (reduce) {
          return () => {
            delete root.dataset.layout;
          };
        }

        const revealables: Element[] = [];

        slides.forEach((slide, i) => {
          const dir = i % 2 === 0 ? -1 : 1;
          const parts = Array.from(
            slide.querySelectorAll(
              '[data-part="txt"], [data-part="box"], [data-part="pill"]',
            ),
          );
          const rules = Array.from(
            slide.querySelectorAll('[data-part="rule"]'),
          );
          revealables.push(...parts, ...rules);

          gsap.set(parts, { opacity: 0, x: dir * 32 });
          gsap.set(rules, { scaleX: 0, transformOrigin: "0% 50%" });

          ScrollTrigger.batch(parts, {
            scroller: root,
            start: "top 92%",
            once: true,
            interval: 0.08,
            onEnter: (batch) =>
              gsap.to(batch, {
                opacity: 1,
                x: 0,
                duration: 0.8,
                ease: "power3.out",
                stagger: 0.06,
                clearProps: "transform",
              }),
          });

          rules.forEach((rule) => {
            ScrollTrigger.create({
              scroller: root,
              trigger: rule,
              start: "top 92%",
              once: true,
              onEnter: () =>
                gsap.to(rule, {
                  scaleX: 1,
                  duration: 0.9,
                  ease: "power3.out",
                  clearProps: "transform",
                }),
            });
          });
        });

        gsap.from(stage.querySelectorAll("[data-aside]"), {
          opacity: 0,
          y: 20,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.08,
          clearProps: "transform",
        });

        return () => {
          delete root.dataset.layout;
          gsap.set(revealables, { clearProps: "all" });
        };
      },
    );

    // fonts change the layout size, so measure again when they are ready
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }

    return () => {
      mm.revert();
    };
  }, []);

  // clicking a step in the left rail scrolls to that page
  const goToStep = (i: number) => {
    const st = stRef.current;
    const root = containerRef.current;
    if (!st || !root) return;
    const y =
      st.start +
      (i / Math.max(experiences.length - 1, 1)) * (st.end - st.start);
    root.scrollTo({ top: y, behavior: "smooth" });
  };

  const handleScrollTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // soft light that follows the cursor inside the "Notable Outcomes" box
  const handleSpotlight = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div ref={containerRef} className={styles.pageContainer}>
      {/* Background atmosphere */}
      <div className={styles.backgroundAtmosphere} aria-hidden="true" />

      {/* Top Navigation Bar:
          Left: KE Logo button (calls onBack)
          Right: Dark/Light Mode Toggle + 'X' Close Button
      */}
      <header ref={headerRef} className={styles.topNav}>
        <div className={styles.topNavInner}>
          <button
            type="button"
            onClick={onBack}
            className={styles.brandMark}
            aria-label="Return to portfolio overview"
            title="Return to portfolio"
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
              aria-label="Close Experience page"
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
        <div ref={stageRef} className={styles.stage}>
          {/* Left side: title, description and the step rail */}
          <aside className={styles.stageAside}>
            <div className={styles.subHeaderRow}>
              <div className={styles.titleRow} data-aside>
                <span className={styles.titleAccentBar} aria-hidden="true" />
                <h1 className={styles.pageTitle}>Experience</h1>
              </div>
              <p className={styles.pageDescription} data-aside>
                A documented chronological timeline of professional software
                development, enterprise IT support, and accredited academic
                systems engineering.
              </p>
            </div>

            {/* Step rail (desktop only): fills while scrolling, marker morphs between steps */}
            <nav
              ref={navRef}
              className={styles.railNav}
              aria-label="Experience steps"
            >
              <span className={styles.railTrack} aria-hidden="true" />
              <span className={styles.railFill} aria-hidden="true" />
              <span
                ref={markerRef}
                className={styles.railMarker}
                aria-hidden="true"
              />
              {experiences.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.railItem} ${i === 0 ? styles.navActive : ""}`}
                  onClick={() => goToStep(i)}
                  aria-label={`Go to ${item.role}`}
                >
                  <span className={styles.railPeriod}>{item.period}</span>
                  <span className={styles.railRole}>{item.role}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Minimalist Architectural Scroll Timeline Stream */}
          <section aria-label="Experience timeline" className={styles.slides}>
            <div ref={slidesRef} className={styles.leafStack}>
              {experiences.map((item) => (
                <article key={item.id} className={styles.slide}>
                  {/* Timeline Axis Node (small screens only) */}
                  <div className={styles.timelineNode} aria-hidden="true" />

                  {/* Column A: header + narrative */}
                  <div className={styles.slideCol}>
                    <div className={styles.itemHeader}>
                      <div className={styles.itemMetaRow} data-part="txt">
                        <span className={styles.periodMono}>{item.period}</span>
                        <span className={styles.typeBadge}>{item.type}</span>
                      </div>
                      <h2 className={styles.roleTitle} data-part="txt">
                        {item.role}
                      </h2>
                      <div className={styles.companyRow} data-part="txt">
                        <span className={styles.companyName}>
                          {item.company}
                        </span>
                        {item.institution &&
                          item.institution !== item.company && (
                            <>
                              <span
                                className={styles.companyDivider}
                                aria-hidden="true"
                              >
                                ·
                              </span>
                              <span>{item.institution}</span>
                            </>
                          )}
                      </div>
                      <span
                        className={styles.headerRule}
                        aria-hidden="true"
                        data-part="rule"
                      />
                    </div>

                    {/* Narrative Context */}
                    <p className={styles.itemNarrative} data-part="txt">
                      {item.narrative}
                    </p>
                  </div>

                  {/* Column B: responsibilities, outcomes, skills */}
                  <div className={styles.slideCol}>
                    <div className={styles.responsibilitiesBlock}>
                      <span className={styles.blockHeading} data-part="txt">
                        Key Responsibilities
                      </span>
                      <ul className={styles.responsibilitiesList}>
                        {item.responsibilities.map((resp, idx) => (
                          <li
                            key={idx}
                            className={styles.responsibilityItem}
                            data-part="txt"
                          >
                            {resp}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Highlights Strip */}
                    <div
                      className={styles.highlightsBox}
                      onPointerMove={handleSpotlight}
                      data-part="box"
                    >
                      <span className={styles.blockHeading}>
                        Notable Outcomes
                      </span>
                      {item.keyHighlights.map((highlight, idx) => (
                        <div key={idx} className={styles.highlightItem}>
                          <span
                            className={styles.highlightDot}
                            aria-hidden="true"
                          />
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>

                    {/* Skills / Tech Used */}
                    <div
                      className={styles.skillsRow}
                      aria-label="Relevant technologies"
                    >
                      {item.skills.map((skill) => (
                        <span
                          key={skill}
                          className={styles.skillPill}
                          data-part="pill"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* darkens the page while it folds (desktop only) */}
                  <span
                    className={styles.pageShade}
                    aria-hidden="true"
                    data-shade
                  />
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Page Footer */}
      <footer className={styles.pageFooter}>
        <div className={styles.footerInner}>
          <span className={styles.footerText}>
            © 2026 {meta.name} • Experience & Career Timeline
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

export default Experience;
