import React, { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { siteContent } from "../../../content/siteContent";
import { ThemeToggle } from "../../../components/ThemeToggle/ThemeToggle";
import type { Theme } from "../../../hooks/useTheme";
import logoImg from "../../../assets/logo/KE-LOGO-.png";
import styles from "./Experience.module.css";
import { FlowLineOne } from "./FlowlineOne";

gsap.registerPlugin(ScrollTrigger);

export interface ExperienceProps {
  onBack: () => void;
  theme: Theme;
  onToggleTheme: (e?: React.MouseEvent<HTMLButtonElement>) => void;
}

/* ---------------------------- tweak these ---------------------------------
   DURATION        : how long one page turn takes (seconds).
   ENTER_X         : where the next page waits, in % of its own width
                     (110 = just outside the right edge).
   TURN_DEG        : small 3D swing of the incoming page (0 = flat slide).
   STACK_OFFSET_X  : how far each older page sticks out on the left (px).
   STACK_SHRINK    : how much smaller each older page gets (0.035 = 3.5%).
   WHEEL_THRESHOLD : how much wheel/trackpad movement counts as "one scroll".
   WHEEL_IDLE_MS   : after a page turn, the wheel must be quiet this long
                     before the next scroll is accepted (kills trackpad
                     inertia, so one scroll = exactly one page).
   ------------------------------------------------------------------------- */
const DURATION = 0.9;
const ENTER_X = 110;
const TURN_DEG = 10;
const STACK_OFFSET_X = 10;
const STACK_OFFSET_X_PHONE = 5;
const STACK_SHRINK = 0.035;
const MAX_VISIBLE_DEPTH = 3;
const SHADE_BY_DEPTH = [0, 0.18, 0.32, 0.45];
const WHEEL_THRESHOLD = 40;
const WHEEL_IDLE_MS = 140;

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
  const dotsRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const goToRef = useRef<((i: number) => void) | null>(null);

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
     PAGE TURN STACK  -  one scroll / swipe = exactly one page
     There is NO native scrolling and NO scroll-pinning in this mode, so the
     screen can never shake. Wheel, trackpad, touch swipe, arrow keys, the
     left rail and the dots all call goTo(). While a page is turning the
     input is locked, and it only unlocks after the wheel goes quiet, so the
     momentum of a mouse/trackpad can not skip to the 3rd page.
     Desktop ("book") and phones ("phone") share the same engine.
     Very short screens (landscape phones): normal stacked scroll.
     Reduced motion: same paging, but a simple cross-fade.
     ======================================================================= */
  useLayoutEffect(() => {
    const root = containerRef.current;
    const header = headerRef.current;
    const stage = stageRef.current;
    const stack = slidesRef.current;
    const nav = navRef.current;
    const dots = dotsRef.current;
    const marker = markerRef.current;
    if (!root || !header || !stage || !stack || !nav || !dots || !marker)
      return;

    const slides = Array.from(stack.children) as HTMLElement[];
    const navItems = Array.from(
      nav.querySelectorAll<HTMLButtonElement>("button"),
    );
    const dotItems = Array.from(
      dots.querySelectorAll<HTMLButtonElement>("button"),
    );
    const total = slides.length;
    const mm = gsap.matchMedia();

    const q = (leaf: Element, part: string) =>
      leaf.querySelectorAll<HTMLElement>(`[data-part="${part}"]`);

    mm.add(
      {
        book: "(min-width: 1000px) and (min-height: 520px)",
        phone: "(max-width: 999px) and (min-height: 480px)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { book, phone, reduce } = context.conditions as {
          book: boolean;
          phone: boolean;
          reduce: boolean;
        };

        /* ====================== PAGED (desktop + phone) ================== */
        if ((book || phone) && total > 1) {
          root.classList.add(styles.isPaged);
          root.classList.add(book ? styles.isBook : styles.isPhone);
          root.dataset.layout = book ? "book" : "phone";
          const setNavH = () =>
            root.style.setProperty("--nav-h", `${header.offsetHeight}px`);
          setNavH();

          const leaves = slides;
          const shades = leaves.map(
            (l) => l.querySelector<HTMLElement>("[data-shade]") as HTMLElement,
          );

          const offX = phone ? STACK_OFFSET_X_PHONE : STACK_OFFSET_X;
          const d = (n: number) => Math.min(n, MAX_VISIBLE_DEPTH);
          const shift = reduce ? 0 : 56;

          // where a page rests when page `target` is the visible one
          const restState = (j: number, target: number) => {
            if (j === target) {
              return {
                x: 0,
                xPercent: 0,
                scale: 1,
                rotateY: 0,
                opacity: 1,
                shade: 0,
              };
            }
            if (j < target) {
              const n = target - j; // page is underneath, n pages deep
              return {
                x: reduce ? 0 : -offX * d(n),
                xPercent: 0,
                scale: reduce ? 1 : 1 - STACK_SHRINK * d(n),
                rotateY: 0,
                opacity: reduce ? 0 : n > MAX_VISIBLE_DEPTH ? 0 : 1,
                shade: reduce ? 0 : SHADE_BY_DEPTH[d(n)],
              };
            }
            // page is still waiting off-screen on the right
            return {
              x: 0,
              xPercent: reduce ? 0 : ENTER_X,
              scale: 1,
              rotateY: reduce ? 0 : TURN_DEG,
              opacity: reduce ? 0 : 1,
              shade: 0,
            };
          };

          const hideContent = (leaf: HTMLElement) => {
            gsap.set(q(leaf, "txt"), { opacity: 0, x: shift });
            gsap.set(q(leaf, "rule"), { scaleX: 0, transformOrigin: "0% 50%" });
            gsap.set(q(leaf, "box"), {
              opacity: 0,
              clipPath: "inset(0% 100% 0% 0% round 6px)",
            });
            gsap.set(q(leaf, "pill"), { opacity: 0, y: 8 });
          };

          const showContent = (leaf: HTMLElement) => {
            gsap.set(q(leaf, "txt"), { opacity: 1, x: 0 });
            gsap.set(q(leaf, "rule"), { scaleX: 1 });
            gsap.set(q(leaf, "box"), {
              opacity: 1,
              clipPath: "inset(0% 0% 0% 0% round 6px)",
            });
            gsap.set(q(leaf, "pill"), { opacity: 1, y: 0 });
          };

          /* ---- initial state: page 1 on top, the others wait on the right ---- */
          leaves.forEach((leaf, j) => {
            const s = restState(j, 0);
            gsap.set(leaf, {
              transformOrigin: "0% 50%",
              x: s.x,
              xPercent: s.xPercent,
              scale: s.scale,
              rotateY: s.rotateY,
              opacity: s.opacity,
              zIndex: j + 1, // later pages always land on top
            });
            gsap.set(shades[j], { opacity: s.shade });
            if (j > 0) hideContent(leaf);
          });

          /* ---- phone: shrink text until every page fits the screen ---- */
          const fit = () => {
            if (!phone) return;
            leaves.forEach((l) => l.removeAttribute("data-scroll"));
            let fs = Math.min(17, Math.max(13, window.innerWidth / 30));
            root.style.setProperty("--m-fs", `${fs}px`);
            const over = () =>
              leaves.some((l) => l.scrollHeight > l.clientHeight + 1);
            while (over() && fs > 9.5) {
              fs -= 0.5;
              root.style.setProperty("--m-fs", `${fs}px`);
            }
            // last resort on tiny screens: that page scrolls inside itself
            leaves.forEach((l) => {
              if (l.scrollHeight > l.clientHeight + 1)
                l.setAttribute("data-scroll", "");
            });
          };

          /* ---- rail marker (desktop) ---- */
          let current = 0;
          let markerTl: gsap.core.Timeline | null = null;

          const placeMarker = () => {
            if (!book) return;
            const item = navItems[current];
            if (!item) return;
            gsap.set(marker, { y: item.offsetTop, height: item.offsetHeight });
          };

          const moveMarker = (from: number, to: number) => {
            if (!book) return;
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
                duration: 0.25,
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
            dotItems.forEach((btn, k) => {
              const on = k === idx;
              btn.classList.toggle(styles.dotActive, on);
              if (on) btn.setAttribute("aria-current", "step");
              else btn.removeAttribute("aria-current");
            });
            leaves.forEach((leaf, k) =>
              leaf.setAttribute("aria-hidden", k === idx ? "false" : "true"),
            );
          };

          setActive(0);
          placeMarker();
          fit();

          /* ---- intro (first page + left side), plays once ---- */
          gsap.from(q(leaves[0], "txt"), {
            opacity: 0,
            x: shift,
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
          gsap.from(book ? navItems : dotItems, {
            opacity: 0,
            x: book ? -24 : 0,
            y: book ? 0 : 6,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.07,
            delay: 0.3,
            clearProps: "transform",
          });

          /* ---- the page turn ---- */
          let busy = false;
          let settleAt = 0;
          let turnTl: gsap.core.Timeline | null = null;

          const goTo = (rawTarget: number, force = false) => {
            const target = Math.max(0, Math.min(total - 1, rawTarget));
            if (target === current) return;
            if (busy && !force) return;

            const from = current;
            const dir = target > from ? 1 : -1;
            current = target;
            setActive(target);
            moveMarker(from, target);

            turnTl?.kill();
            busy = true;
            const nx = leaves[target];

            if (dir > 0) hideContent(nx);
            else showContent(nx);

            const tl = gsap.timeline({
              onComplete: () => {
                busy = false;
                settleAt = Math.max(
                  settleAt,
                  performance.now() + WHEEL_IDLE_MS,
                );
              },
            });
            turnTl = tl;

            const dur = reduce ? 0.5 : DURATION;
            leaves.forEach((leaf, j) => {
              const s = restState(j, target);
              tl.to(
                leaf,
                {
                  x: s.x,
                  xPercent: s.xPercent,
                  scale: s.scale,
                  rotateY: s.rotateY,
                  opacity: s.opacity,
                  duration: dur,
                  ease: reduce ? "none" : "power3.inOut",
                  overwrite: "auto",
                },
                0,
              ).to(
                shades[j],
                {
                  opacity: s.shade,
                  duration: dur,
                  ease: "power2.inOut",
                  overwrite: "auto",
                },
                0,
              );
            });

            // content of the new page slides in once the page has landed
            if (dir > 0) {
              const t0 = reduce ? 0.2 : 0.45;
              tl.to(
                q(nx, "txt"),
                {
                  opacity: 1,
                  x: 0,
                  duration: 0.35,
                  ease: "power2.out",
                  stagger: 0.015,
                },
                t0,
              )
                .to(
                  q(nx, "rule"),
                  { scaleX: 1, duration: 0.35, ease: "power2.inOut" },
                  t0 + 0.05,
                )
                .to(
                  q(nx, "box"),
                  {
                    opacity: 1,
                    clipPath: "inset(0% 0% 0% 0% round 6px)",
                    duration: 0.4,
                    ease: "power2.inOut",
                  },
                  t0 + 0.05,
                )
                .to(
                  q(nx, "pill"),
                  {
                    opacity: 1,
                    y: 0,
                    duration: 0.25,
                    ease: "power2.out",
                    stagger: 0.01,
                  },
                  t0 + 0.2,
                );
            }
          };

          goToRef.current = (i: number) => goTo(i, true);

          /* ---- input: wheel / trackpad (one scroll = one page) ---- */
          let acc = 0;
          let accAt = 0;
          const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const now = performance.now();
            const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;

            // locked: page is turning, or momentum is still coming in
            if (busy || now < settleAt) {
              settleAt = now + WHEEL_IDLE_MS;
              acc = 0;
              return;
            }
            if (now - accAt > 200) acc = 0;
            accAt = now;
            acc += dy;
            if (Math.abs(acc) >= WHEEL_THRESHOLD) {
              const dir = acc > 0 ? 1 : -1;
              acc = 0;
              if (current + dir >= 0 && current + dir < total) {
                goTo(current + dir);
              }
              settleAt = now + WHEEL_IDLE_MS;
            }
          };

          /* ---- input: touch swipe ---- */
          let tx = 0;
          let ty = 0;
          let tracking = false;
          const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length !== 1) {
              tracking = false;
              return;
            }
            tx = e.touches[0].clientX;
            ty = e.touches[0].clientY;
            tracking = true;
          };
          const onTouchMove = (e: TouchEvent) => {
            const inner = (e.target as HTMLElement).closest("[data-scroll]");
            if (!inner && e.cancelable) e.preventDefault();
          };
          const onTouchEnd = (e: TouchEvent) => {
            if (!tracking) return;
            tracking = false;
            const t = e.changedTouches[0];
            const dx = t.clientX - tx;
            const dy = t.clientY - ty;
            const ax = Math.abs(dx);
            const ay = Math.abs(dy);
            let dir = 0;
            if (ay >= 40 && ay > ax) dir = dy < 0 ? 1 : -1;
            else if (ax >= 60 && ax > ay) dir = dx < 0 ? 1 : -1;
            if (!dir) return;

            const inner = (e.target as HTMLElement).closest(
              "[data-scroll]",
            ) as HTMLElement | null;
            if (inner && ay > ax) {
              const atEnd =
                inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 2;
              const atStart = inner.scrollTop <= 2;
              if (dir > 0 && !atEnd) return;
              if (dir < 0 && !atStart) return;
            }
            goTo(current + dir);
          };

          /* ---- input: keyboard ---- */
          const onKey = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement | null;
            if (
              el?.closest("input, textarea, select, [contenteditable='true']")
            )
              return;
            if (
              e.key === "ArrowDown" ||
              e.key === "PageDown" ||
              e.key === "ArrowRight"
            ) {
              e.preventDefault();
              goTo(current + 1);
            } else if (
              e.key === "ArrowUp" ||
              e.key === "PageUp" ||
              e.key === "ArrowLeft"
            ) {
              e.preventDefault();
              goTo(current - 1);
            } else if (e.key === "Home") {
              e.preventDefault();
              goTo(0);
            } else if (e.key === "End") {
              e.preventDefault();
              goTo(total - 1);
            }
          };

          root.addEventListener("wheel", onWheel, { passive: false });
          root.addEventListener("touchstart", onTouchStart, { passive: true });
          root.addEventListener("touchmove", onTouchMove, { passive: false });
          root.addEventListener("touchend", onTouchEnd, { passive: true });
          window.addEventListener("keydown", onKey);

          /* ---- keep sizes right on resize / rotate / address-bar changes ---- */
          let raf = 0;
          const onResize = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
              setNavH();
              fit();
              placeMarker();
            });
          };
          window.addEventListener("resize", onResize);
          document.fonts?.ready.then(onResize);

          return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("keydown", onKey);
            root.removeEventListener("wheel", onWheel);
            root.removeEventListener("touchstart", onTouchStart);
            root.removeEventListener("touchmove", onTouchMove);
            root.removeEventListener("touchend", onTouchEnd);
            goToRef.current = null;
            markerTl?.kill();
            turnTl?.kill();
            root.classList.remove(
              styles.isPaged,
              styles.isBook,
              styles.isPhone,
            );
            delete root.dataset.layout;
            root.style.removeProperty("--nav-h");
            root.style.removeProperty("--m-fs");
            leaves.forEach((l) => {
              l.removeAttribute("aria-hidden");
              l.removeAttribute("data-scroll");
            });
            navItems.forEach((b) => b.removeAttribute("aria-current"));
            dotItems.forEach((b) => b.removeAttribute("aria-current"));
            gsap.set(
              [
                ...leaves,
                ...shades,
                ...navItems,
                ...dotItems,
                marker,
                ...Array.from(
                  root.querySelectorAll("[data-part], [data-aside]"),
                ),
              ],
              { clearProps: "all" },
            );
          };
        }

        /* ============ STACKED (very short screens, normal scroll) ========= */
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

    return () => {
      mm.revert();
    };
  }, []);

  // clicking a step in the left rail / a dot goes to that page
  const goToStep = (i: number) => {
    goToRef.current?.(i);
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
          <FlowLineOne />
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

            {/* Page dots (phone only) */}
            <div
              ref={dotsRef}
              className={styles.dotsNav}
              role="group"
              aria-label="Experience pages"
            >
              {experiences.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.dot} ${i === 0 ? styles.dotActive : ""}`}
                  onClick={() => goToStep(i)}
                  aria-label={`Go to ${item.role}`}
                />
              ))}
            </div>
          </aside>

          {/* Minimalist Architectural Scroll Timeline Stream */}
          <section aria-label="Experience timeline" className={styles.slides}>
            <div ref={slidesRef} className={styles.leafStack}>
              {experiences.map((item) => (
                <article key={item.id} className={styles.slide}>
                  {/* Timeline Axis Node (stacked layout only) */}
                  <div className={styles.timelineNode} aria-hidden="true" />

                  {/* Column A: header + narrative */}
                  <div className={`${styles.slideCol} ${styles.colFirst}`}>
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
                  <div className={`${styles.slideCol} ${styles.colLast}`}>
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

                  {/* darkens the page while it sinks into the stack */}
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
