/**
 * pageTurnEngine.ts  -  shared "page turn" engine for Experience, Workflows
 * and Services.
 *
 * Put this file in:  src/sections/ProfessionalOverview/pageTurnEngine.ts
 *
 * Same look and same behaviour as before (one scroll / swipe = one page,
 * pages stack on the left, new page comes from the right). What changed is
 * HOW it is drawn, so it stays smooth on phones and desktop:
 *
 *  1. The dark "shade" overlay and the text parts are promoted to their own
 *     GPU layers while they animate, so a frame no longer repaints a whole
 *     page (this was the main cause of the lag, see the CSS patch too).
 *  2. The scroll is unlocked as soon as the page has landed, not after every
 *     text line finished revealing, so it never feels like it "waits".
 *  3. Swipes start the turn while the finger is still moving (no wait for
 *     the finger to lift).
 *  4. "Fit text to screen" is cheaper (a few measurements instead of ~15) and
 *     is not re-run when only the mobile address bar moves.
 *  5. Phones: flat slide (no 3D tilt) and a simple slide-fade for the
 *     outcomes box instead of the clip-path wipe. Desktop keeps both.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ---------------------------- tweak these ---------------------------------
   DURATION        : how long one page turn takes (seconds).
   ENTER_X         : where the next page waits, in % of its own width.
   TURN_DEG        : small 3D swing of the incoming page on desktop.
   TURN_DEG_PHONE  : same for phones (0 = flat slide, much lighter to draw).
   STACK_OFFSET_X  : how far each older page sticks out on the left (px).
   STACK_SHRINK    : how much smaller each older page gets (0.035 = 3.5%).
   WHEEL_THRESHOLD : how much wheel/trackpad movement counts as "one scroll".
   WHEEL_IDLE_MS   : after a page turn the wheel must be quiet this long
                     before the next scroll is accepted (one scroll = one page).
   ------------------------------------------------------------------------- */
const DURATION = 0.9;
const ENTER_X = 110;
const TURN_DEG = 10;
const TURN_DEG_PHONE = 0;
const STACK_OFFSET_X = 10;
const STACK_OFFSET_X_PHONE = 5;
const STACK_SHRINK = 0.035;
const MAX_VISIBLE_DEPTH = 3;
const SHADE_BY_DEPTH = [0, 0.18, 0.32, 0.45];
const WHEEL_THRESHOLD = 40;
const WHEEL_IDLE_MS = 140;
const SWIPE_Y_PX = 40;
const SWIPE_X_PX = 60;

export interface PageTurnClasses {
  isPaged: string;
  isBook: string;
  isPhone: string;
  navActive: string;
  dotActive: string;
}

export interface PageTurnOptions {
  root: HTMLElement;
  header: HTMLElement;
  stage: HTMLElement;
  stack: HTMLElement;
  nav: HTMLElement;
  dots: HTMLElement;
  marker: HTMLElement;
  classes: PageTurnClasses;
  /** the page keeps this ref so the rail / dots can call goTo(i) */
  goToRef: { current: ((i: number) => void) | null };
  /** Services + Workflows: also shrink text to fit on desktop. Experience: false */
  fitDesktop?: boolean;
  /** Experience: reveal parts from the side while scrolling the short-screen layout */
  stackedReveal?: boolean;
}

type Rest = {
  x: number;
  xPercent: number;
  scale: number;
  rotateY: number;
  opacity: number;
  shade: number;
};

export function initPageTurn(opts: PageTurnOptions): () => void {
  const {
    root,
    header,
    stage,
    stack,
    nav,
    dots,
    marker,
    classes,
    goToRef,
    fitDesktop = false,
    stackedReveal = false,
  } = opts;

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

      /* ================= STACKED (very short screens) ================== */
      if (!((book || phone) && total > 1)) {
        root.dataset.layout = "stacked";

        if (!stackedReveal || reduce) {
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
      }

      /* ====================== PAGED (desktop + phone) =================== */
      root.classList.add(
        classes.isPaged,
        book ? classes.isBook : classes.isPhone,
      );
      root.dataset.layout = book ? "book" : "phone";

      // only touch the CSS variable when the value really changed
      let navH = -1;
      const setNavH = () => {
        const h = header.offsetHeight;
        if (h !== navH) {
          navH = h;
          root.style.setProperty("--nav-h", `${h}px`);
        }
      };
      setNavH();

      const leaves = slides;
      const shades = leaves.map(
        (l) => l.querySelector<HTMLElement>("[data-shade]") as HTMLElement,
      );

      const offX = phone ? STACK_OFFSET_X_PHONE : STACK_OFFSET_X;
      const d = (n: number) => Math.min(n, MAX_VISIBLE_DEPTH);
      const shift = reduce ? 0 : 56;
      const boxShift = reduce ? 0 : 28;
      const turnDeg = reduce ? 0 : phone ? TURN_DEG_PHONE : TURN_DEG;

      // where a page rests when page `target` is the visible one
      const restState = (j: number, target: number): Rest => {
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
          rotateY: turnDeg,
          opacity: reduce ? 0 : 1,
          shade: 0,
        };
      };

      const hideContent = (leaf: HTMLElement) => {
        gsap.set(q(leaf, "txt"), { opacity: 0, x: shift });
        gsap.set(q(leaf, "rule"), { scaleX: 0, transformOrigin: "0% 50%" });
        if (book) {
          gsap.set(q(leaf, "box"), {
            opacity: 0,
            clipPath: "inset(0% 100% 0% 0% round 6px)",
          });
        } else {
          gsap.set(q(leaf, "box"), { opacity: 0, x: boxShift });
        }
        gsap.set(q(leaf, "pill"), { opacity: 0, y: 8 });
      };

      const showContent = (leaf: HTMLElement) => {
        gsap.set(q(leaf, "txt"), { opacity: 1, x: 0 });
        gsap.set(q(leaf, "rule"), { scaleX: 1 });
        if (book) {
          gsap.set(q(leaf, "box"), {
            opacity: 1,
            clipPath: "inset(0% 0% 0% 0% round 6px)",
          });
        } else {
          gsap.set(q(leaf, "box"), { opacity: 1, x: 0 });
        }
        gsap.set(q(leaf, "pill"), { opacity: 1, y: 0 });
      };

      // own GPU layer for the text parts, only while they animate
      const hint = (leaf: HTMLElement, on: boolean) => {
        const v = on ? "transform, opacity" : "";
        leaf.querySelectorAll<HTMLElement>("[data-part]").forEach((el) => {
          el.style.willChange = v;
        });
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
          force3D: true,
        });
        gsap.set(shades[j], { opacity: s.shade });
        if (j > 0) hideContent(leaf);
      });

      /* ---- shrink text until every page fits the screen ---- */
      const fit = () => {
        if (!(phone || fitDesktop)) return;
        leaves.forEach((l) => l.removeAttribute("data-scroll"));

        let fs = phone
          ? Math.min(17, Math.max(13, window.innerWidth / 30))
          : Math.min(17, Math.max(13, window.innerHeight / 52));
        root.style.setProperty("--m-fs", `${fs}px`);

        // how much too tall is the worst page? (1 = fits)
        const worst = () => {
          let r = 1;
          for (const l of leaves) {
            if (l.scrollHeight > l.clientHeight + 1) {
              r = Math.min(r, l.clientHeight / l.scrollHeight);
            }
          }
          return r;
        };

        // jump close to the right size, then refine (a few measurements only)
        for (let i = 0; i < 10; i++) {
          const r = worst();
          if (r >= 1 || fs <= 9.5) break;
          fs = Math.max(9.5, Math.min(fs - 0.5, Math.floor(fs * r * 2) / 2));
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
          btn.classList.toggle(classes.navActive, on);
          if (on) btn.setAttribute("aria-current", "step");
          else btn.removeAttribute("aria-current");
        });
        dotItems.forEach((btn, k) => {
          const on = k === idx;
          btn.classList.toggle(classes.dotActive, on);
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
        stagger: 0.03,
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
      let moveTl: gsap.core.Timeline | null = null; // the pages moving
      let contentTl: gsap.core.Timeline | null = null; // the text revealing

      const goTo = (rawTarget: number, force = false) => {
        const target = Math.max(0, Math.min(total - 1, rawTarget));
        if (target === current) return;
        if (busy && !force) return;

        const from = current;
        const dir = target > from ? 1 : -1;
        const nx = leaves[target];
        current = target;
        setActive(target);
        moveMarker(from, target);

        // finish what is still running (the new page covers it anyway)
        moveTl?.kill();
        if (contentTl) {
          contentTl.progress(1);
          contentTl.kill();
          contentTl = null;
        }

        busy = true;

        if (dir > 0) {
          hideContent(nx);
          hint(nx, true);
        } else {
          showContent(nx);
        }

        // 1) the pages move (position + opacity only, runs on the GPU)
        const dur = reduce ? 0.5 : DURATION;
        const tl = gsap.timeline({
          onComplete: () => {
            // unlock as soon as the page has landed
            busy = false;
            settleAt = Math.max(settleAt, performance.now() + WHEEL_IDLE_MS);
          },
        });
        moveTl = tl;

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
              force3D: true,
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

        // 2) the text of the new page slides in (own timeline, does not block input)
        if (dir > 0) {
          const t0 = reduce ? 0.2 : 0.45;
          const c = gsap.timeline({ onComplete: () => hint(nx, false) });
          contentTl = c;

          c.to(
            q(nx, "txt"),
            {
              opacity: 1,
              x: 0,
              duration: 0.35,
              ease: "power2.out",
              stagger: 0.012,
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
              book
                ? {
                    opacity: 1,
                    clipPath: "inset(0% 0% 0% 0% round 6px)",
                    duration: 0.4,
                    ease: "power2.inOut",
                    stagger: 0.08,
                  }
                : {
                    opacity: 1,
                    x: 0,
                    duration: 0.4,
                    ease: "power2.out",
                    stagger: 0.08,
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

      /* ---- input: touch swipe (starts while the finger is still moving) ---- */
      let tx = 0;
      let ty = 0;
      let tracking = false;
      let fired = false;

      const decideSwipe = (t: Touch, target: EventTarget | null) => {
        const dx = t.clientX - tx;
        const dy = t.clientY - ty;
        const ax = Math.abs(dx);
        const ay = Math.abs(dy);
        let dir = 0;
        if (ay >= SWIPE_Y_PX && ay > ax) dir = dy < 0 ? 1 : -1;
        else if (ax >= SWIPE_X_PX && ax > ay) dir = dx < 0 ? 1 : -1;
        if (!dir) return false;

        const inner = (target as HTMLElement | null)?.closest?.(
          "[data-scroll]",
        ) as HTMLElement | null;
        if (inner && ay > ax) {
          const atEnd =
            inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 2;
          const atStart = inner.scrollTop <= 2;
          if (dir > 0 && !atEnd) return false;
          if (dir < 0 && !atStart) return false;
        }
        goTo(current + dir);
        return true;
      };

      const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length !== 1) {
          tracking = false;
          return;
        }
        tx = e.touches[0].clientX;
        ty = e.touches[0].clientY;
        tracking = true;
        fired = false;
      };
      const onTouchMove = (e: TouchEvent) => {
        const inner = (e.target as HTMLElement).closest("[data-scroll]");
        if (!inner && e.cancelable) e.preventDefault();
        if (tracking && !fired && e.touches.length === 1) {
          if (decideSwipe(e.touches[0], e.target)) fired = true;
        }
      };
      const onTouchEnd = (e: TouchEvent) => {
        if (!tracking) return;
        tracking = false;
        if (fired) return;
        decideSwipe(e.changedTouches[0], e.target);
      };

      /* ---- input: keyboard ---- */
      const onKey = (e: KeyboardEvent) => {
        const el = e.target as HTMLElement | null;
        if (el?.closest("input, textarea, select, [contenteditable='true']"))
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

      /* ---- keep sizes right on resize / rotate (cheap, debounced) ---- */
      let destroyed = false;
      let raf = 0;
      let lastW = window.innerWidth;
      let lastH = window.innerHeight;

      const refit = (force: boolean) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          if (destroyed) return;
          const w = window.innerWidth;
          const h = window.innerHeight;
          // mobile address bar sliding: tiny height change, nothing to re-measure
          const onlyBarMoved =
            !force && w === lastW && Math.abs(h - lastH) < 120;
          setNavH();
          if (onlyBarMoved) return;
          lastW = w;
          lastH = h;
          fit();
          placeMarker();
        });
      };
      const onResize = () => refit(false);
      window.addEventListener("resize", onResize);
      document.fonts?.ready.then(() => refit(true));

      return () => {
        destroyed = true;
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("keydown", onKey);
        root.removeEventListener("wheel", onWheel);
        root.removeEventListener("touchstart", onTouchStart);
        root.removeEventListener("touchmove", onTouchMove);
        root.removeEventListener("touchend", onTouchEnd);
        goToRef.current = null;
        markerTl?.kill();
        moveTl?.kill();
        contentTl?.kill();
        root.classList.remove(classes.isPaged, classes.isBook, classes.isPhone);
        delete root.dataset.layout;
        root.style.removeProperty("--nav-h");
        root.style.removeProperty("--m-fs");
        leaves.forEach((l) => {
          l.removeAttribute("aria-hidden");
          l.removeAttribute("data-scroll");
          hint(l, false);
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
            ...Array.from(root.querySelectorAll("[data-part], [data-aside]")),
          ],
          { clearProps: "all" },
        );
      };
    },
  );

  return () => {
    mm.revert();
  };
}
