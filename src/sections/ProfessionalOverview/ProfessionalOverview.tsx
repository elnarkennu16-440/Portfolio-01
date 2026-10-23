import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { siteContent } from "../../content/siteContent";
import styles from "./ProfessionalOverview.module.css";

type SubpageId = "experience" | "workflows" | "services";

export interface ProfessionalOverviewProps {
  onOpenSubpage?: (subpage: SubpageId) => void;
}

/* ────────────────────────────────────────────────────────────────────────────
 * PINNED HORIZONTAL SCROLL
 * The section is tall; its inner stage is pinned (sticky) while you scroll.
 * Vertical scroll moves a row of slides sideways:
 *   slide 0 = intro, slides 1..3 = Experience / Workflows / Services.
 * SEGMENT_HOLD   share of each scroll segment where the slide just STAYS (reads),
 *                the rest of the segment is the sideways move.
 * TAIL           share of the total scroll where the LAST slide stays pinned
 *                before the page continues.
 * SMOOTHING      0-1, how quickly the motion catches up with the scroll (lower = floatier).
 * ──────────────────────────────────────────────────────────────────────────── */
const SEGMENT_HOLD = 0.42;
const TAIL = 0.12;
const SMOOTHING = 0.11;

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// scroll progress (0..1) -> slide position (0..last), with holds between moves
const toPosition = (progress: number, last: number) => {
  const s = clamp(progress / (1 - TAIL)) * last;
  if (s >= last) return last;
  const i = Math.floor(s);
  const f = s - i;
  const t = clamp((f - SEGMENT_HOLD) / (1 - SEGMENT_HOLD));
  return i + easeInOut(t);
};

interface DetailItem {
  label: string;
  title: string;
  sub?: string;
}

// The small columns under each title — all taken from the existing siteContent data
const getDetails = (id: string): DetailItem[] => {
  const po = siteContent.professionalOverview;
  if (id === "experience") {
    return po.experiences.map((e) => ({
      label: e.period,
      title: e.role,
      sub: e.company,
    }));
  }
  if (id === "workflows") {
    return po.workflows.map((w) => ({
      label: `Phase ${w.step}`,
      title: w.title,
    }));
  }
  if (id === "services") {
    return po.services.map((s) => ({
      label: s.category,
      title: s.title,
    }));
  }
  return [];
};

/* Phones use the SAME pinned sliding animation as desktop.
 * MOBILE_MAX  viewport width (px) treated as "phone".
 * Phones are never switched to the stacked layout because of their height
 * (the browser address bar changes the height while scrolling, which made the
 * section flip between pinned and stacked). */
const MOBILE_MAX = 768;

const isMobileViewport = () =>
  typeof window !== "undefined" && window.innerWidth <= MOBILE_MAX;

const shouldStack = () => {
  if (typeof window === "undefined") return false;
  if (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return true;
  }
  // Phones always keep the pinned sliding animation, whatever their height.
  if (isMobileViewport()) return false;
  // Desktop: unchanged (very short windows stay stacked).
  return window.innerHeight < 560;
};

export const ProfessionalOverview: React.FC<ProfessionalOverviewProps> = ({
  onOpenSubpage,
}) => {
  const { professionalOverview } = siteContent;
  const pillars = professionalOverview.pillars;
  const slideCount = pillars.length + 1; // + intro slide
  const last = slideCount - 1;

  // stacked = plain vertical layout (reduced motion / very short desktop windows): no pinning at all
  const [stacked, setStacked] = useState<boolean>(shouldStack);
  const [activeIdx, setActiveIdx] = useState(0);

  const sectionRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

  const ghostText = useMemo(
    () =>
      [
        professionalOverview.faintWatermark || "OVERVIEW",
        ...pillars.map((p) => p.title),
      ]
        .join("   ·   ")
        .toUpperCase(),
    [professionalOverview.faintWatermark, pillars],
  );

  // react to reduced-motion / viewport changes
  useEffect(() => {
    const mq =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    const check = () => setStacked(shouldStack());
    window.addEventListener("resize", check);
    mq?.addEventListener?.("change", check);
    return () => {
      window.removeEventListener("resize", check);
      mq?.removeEventListener?.("change", check);
    };
  }, []);

  // The scroll-driven motion
  useEffect(() => {
    if (stacked) return;

    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const track = trackRef.current;
    if (!section || !sticky || !track) return;

    let raf = 0;
    let current = 0;
    let target = 0;
    let lastPos = 0;
    let lastActive = -1;

    const measure = () => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - sticky.offsetHeight;
      target = total > 0 ? clamp(-rect.top / total) : 0;
    };

    const apply = (p: number, settled: boolean) => {
      const pos = toPosition(p, last);
      const v = pos - lastPos;
      lastPos = pos;

      track.style.transform = `translate3d(${(-pos * 100) / slideCount}%,0,0)`;
      if (ghostRef.current) {
        ghostRef.current.style.transform = `translate3d(${-pos * 26}vw,0,0)`;
      }

      // "echo": the heading leaves a faint trail behind while it moves sideways
      // (softer on phones so the titles stay clean on narrow screens)
      const mobile = isMobileViewport();
      const echo = settled ? 0 : clamp(v * 420, -26, 26) * (mobile ? 0.3 : 1);
      const blur = settled
        ? 0
        : Math.min(Math.abs(v) * 70, 2.5) * (mobile ? 0.4 : 1);
      sticky.style.setProperty("--echo", `${echo.toFixed(2)}px`);
      sticky.style.setProperty("--blur", `${blur.toFixed(2)}px`);

      slideRefs.current.forEach((el, i) => {
        if (!el) return;
        const d = Math.min(Math.abs(i - pos), 1);
        el.style.opacity = String(1 - d * 0.55);
      });

      const idx = Math.round(pos);
      if (idx !== lastActive) {
        lastActive = idx;
        setActiveIdx(idx);
      }
    };

    const tick = () => {
      const diff = target - current;
      if (Math.abs(diff) < 0.00015) {
        current = target;
        apply(current, true);
        raf = 0;
        return;
      }
      current += diff * SMOOTHING;
      apply(current, false);
      raf = requestAnimationFrame(tick);
    };

    const kick = () => {
      measure();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    // start exactly where the page currently is (no jump on load / refresh)
    measure();
    current = target;
    apply(current, true);

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);

    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      if (raf) cancelAnimationFrame(raf);
      track.style.transform = "";
      if (ghostRef.current) ghostRef.current.style.transform = "";
      slideRefs.current.forEach((el) => {
        if (el) el.style.opacity = "";
      });
    };
  }, [stacked, last, slideCount]);

  // jump to a slide (tabs / intro columns)
  const goTo = useCallback(
    (index: number) => {
      const section = sectionRef.current;
      const sticky = stickyRef.current;
      if (!section) return;

      if (stacked) {
        slideRefs.current[index]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }

      const total = section.offsetHeight - (sticky?.offsetHeight ?? 0);
      const top =
        section.getBoundingClientRect().top +
        window.scrollY +
        (index / last) * (1 - TAIL) * total;
      window.scrollTo({ top, behavior: "smooth" });
    },
    [stacked, last],
  );

  const handleOpen = (id: string) => {
    if (
      onOpenSubpage &&
      (id === "experience" || id === "workflows" || id === "services")
    ) {
      onOpenSubpage(id);
    }
  };

  const interactive = (i: number) => stacked || i === activeIdx;

  return (
    <section
      id="professional-overview"
      ref={sectionRef}
      className={`${styles.section} ${stacked ? styles.stacked : ""}`}
      style={{ "--slides": slideCount } as React.CSSProperties}
      aria-labelledby="professional-overview-heading"
    >
      <div ref={stickyRef} className={styles.sticky}>
        {/* Big faint words in the background — they drift slower than the slides (parallax) */}
        <div className={styles.ghost} aria-hidden="true">
          <div ref={ghostRef} className={styles.ghostText}>
            {ghostText}
          </div>
        </div>

        <div
          ref={trackRef}
          className={styles.track}
          style={stacked ? undefined : { width: `${slideCount * 100}%` }}
        >
          {/* ── Slide 0: intro ── */}
          <div
            ref={(el) => {
              slideRefs.current[0] = el;
            }}
            className={styles.slide}
            role="group"
            aria-roledescription="slide"
            aria-label={`1 of ${slideCount}`}
            aria-hidden={!interactive(0)}
          >
            <div className={styles.slideInner}>
              <div className={styles.metaRow}>
                <span className={styles.accentBar} aria-hidden="true" />
                <span className={styles.metaText}>
                  {professionalOverview.sectionTitle || "PROFESSIONAL OVERVIEW"}
                </span>
              </div>

              <h2
                id="professional-overview-heading"
                className={styles.headline}
              >
                {professionalOverview.lead}
              </h2>

              <p className={styles.summary}>{professionalOverview.intro}</p>
            </div>
          </div>

          {/* ── Slides 1..n: Experience / Workflows / Services ── */}
          {pillars.map((pillar, index) => {
            const slideIndex = index + 1;
            const details = getDetails(pillar.id);

            return (
              <div
                key={pillar.id}
                ref={(el) => {
                  slideRefs.current[slideIndex] = el;
                }}
                className={styles.slide}
                role="group"
                aria-roledescription="slide"
                aria-label={`${slideIndex + 1} of ${slideCount}`}
                aria-hidden={!interactive(slideIndex)}
              >
                <div className={styles.slideInner}>
                  <div className={styles.metaRow}>
                    <span className={styles.accentBar} aria-hidden="true" />
                    <span className={styles.metaText}>
                      {pillar.number} — {pillar.tagline}
                    </span>
                    <span className={styles.countBadge}>{pillar.count}</span>
                  </div>

                  <h3 className={styles.bigTitle}>{pillar.title}</h3>

                  <p className={styles.summary}>{pillar.summary}</p>

                  {details.length > 0 && (
                    <ul
                      className={styles.detailGrid}
                      style={
                        { "--cols": details.length } as React.CSSProperties
                      }
                    >
                      {details.map((d) => (
                        <li
                          key={`${d.label}-${d.title}`}
                          className={styles.detailItem}
                        >
                          <span className={styles.detailLabel}>{d.label}</span>
                          <span className={styles.detailTitle}>{d.title}</span>
                          {d.sub ? (
                            <span className={styles.detailSub}>{d.sub}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    type="button"
                    className={styles.cta}
                    onClick={() => handleOpen(pillar.id)}
                    tabIndex={interactive(slideIndex) ? 0 : -1}
                    aria-label={`Open ${pillar.title} subpage`}
                  >
                    <span className={styles.ctaLabel}>{pillar.cta}</span>
                    <svg
                      className={styles.ctaArrow}
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
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom-left: tabs (jump to a slide) */}
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Professional overview"
        >
          {pillars.map((pillar, i) => (
            <button
              key={pillar.id}
              type="button"
              role="tab"
              aria-selected={activeIdx === i + 1}
              className={`${styles.tab} ${activeIdx === i + 1 ? styles.tabActive : ""}`}
              onClick={() => goTo(i + 1)}
            >
              {pillar.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProfessionalOverview;
