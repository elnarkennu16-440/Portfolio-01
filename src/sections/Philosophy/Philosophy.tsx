import React, { useRef, useState, useEffect, useCallback } from "react";
import styles from "./Philosophy.module.css";

interface PhilosophySlide {
  number: string;
  prefix: string;
  highlight: string;
  subtext: string;
}

const PHILOSOPHY_SLIDES: PhilosophySlide[] = [
  {
    number: "01",
    prefix: "Returning to the basics of",
    highlight: "good form and order?",
    subtext: "Structuring the simplest version before adding extra layers.",
  },
  {
    number: "02",
    prefix: "Rebuilding from practical lessons",
    highlight: "rather than shortcuts?",
    subtext: "Setting up a dependable run one steady block at a time.",
  },
  {
    number: "03",
    prefix: "Or maybe focusing on what",
    highlight: "people actually use?",
    subtext: "Cutting down the excess until only the essentials remain.",
  },
];

/**
 * Calculates continuous, smooth cross-fading, blur, and subtle translateY.
 * Guarantees that at NO point is the screen blank:
 * - Slide 0 stays solid at start
 * - Slide 1 has a solid plateau in the middle
 * - Slide 2 stays 100% visible and sharp all the way to the end
 */
function getSlideStyle(index: number, cursor: number) {
  let opacity = 0;
  let blur = 0;
  let translateY = 0;

  if (index === 0) {
    if (cursor <= 0.35) {
      opacity = 1;
      blur = 0;
      translateY = 0;
    } else if (cursor < 0.75) {
      const p = (cursor - 0.35) / 0.4;
      opacity = 1 - p;
      blur = p * 8;
      translateY = -p * 26;
    } else {
      opacity = 0;
      blur = 8;
      translateY = -26;
    }
  } else if (index === 1) {
    if (cursor < 0.35) {
      opacity = 0;
      blur = 8;
      translateY = 26;
    } else if (cursor < 0.75) {
      const p = (cursor - 0.35) / 0.4;
      opacity = p;
      blur = (1 - p) * 8;
      translateY = (1 - p) * 26;
    } else if (cursor <= 1.25) {
      opacity = 1;
      blur = 0;
      translateY = 0;
    } else if (cursor < 1.65) {
      const p = (cursor - 1.25) / 0.4;
      opacity = 1 - p;
      blur = p * 8;
      translateY = -p * 26;
    } else {
      opacity = 0;
      blur = 8;
      translateY = -26;
    }
  } else if (index === 2) {
    if (cursor < 1.25) {
      opacity = 0;
      blur = 8;
      translateY = 26;
    } else if (cursor < 1.65) {
      const p = (cursor - 1.25) / 0.4;
      opacity = p;
      blur = (1 - p) * 8;
      translateY = (1 - p) * 26;
    } else {
      // Retains full 100% opacity, 0 blur, 0 translateY until end of track!
      opacity = 1;
      blur = 0;
      translateY = 0;
    }
  }

  return {
    opacity,
    filter: blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : "none",
    transform: `translate3d(0, ${translateY.toFixed(1)}px, 0)`,
    visibility: (opacity > 0.01 ? "visible" : "hidden") as "visible" | "hidden",
    pointerEvents: (opacity > 0.5 ? "auto" : "none") as "auto" | "none",
  };
}

export const Philosophy: React.FC = () => {
  const trackRef = useRef<HTMLElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // High-performance scroll tracking via requestAnimationFrame
  const updateScroll = useCallback(() => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const scrollableDistance =
      trackRef.current.offsetHeight - window.innerHeight;

    if (scrollableDistance <= 0) {
      setScrollProgress(0);
      setActiveIndex(0);
      return;
    }

    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));
    setScrollProgress(progress);

    if (progress < 0.35) {
      setActiveIndex(0);
    } else if (progress < 0.75) {
      setActiveIndex(1);
    } else {
      setActiveIndex(2);
    }
  }, []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    updateScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [updateScroll]);

  const handleStepClick = (index: number) => {
    if (!trackRef.current) return;
    const scrollableDistance =
      trackRef.current.offsetHeight - window.innerHeight;
    const trackTopInDoc =
      trackRef.current.getBoundingClientRect().top + window.scrollY;
    const targetProgress = index === 0 ? 0.05 : index === 1 ? 0.55 : 0.92;
    const targetY = trackTopInDoc + targetProgress * scrollableDistance;

    window.scrollTo({
      top: targetY,
      behavior: "smooth",
    });
  };

  // Cursor continuous float: 0.0 to 2.0
  const cursor = scrollProgress * 2.0;

  return (
    <section
      ref={trackRef}
      className={styles.scrollSection}
      aria-label="Philosophy and Approach"
    >
      <div className={styles.stickyStage}>
        {/* Background Flowing Hairline Curves matching Hero Section */}
        <svg
          className={styles.backgroundCurve}
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M-40,250 C360,120 540,680 920,520 C1280,360 1380,720 1520,680"
            className={styles.curvePath}
          />
          <path
            d="M-20,720 C280,820 620,310 980,420 C1240,510 1390,280 1500,220"
            className={styles.curvePathSecondary}
          />
        </svg>

        <div className={styles.containerInner}>
          {/* Left Column: Progress Bar & Step Stack */}
          <div className={styles.indicatorCol} aria-hidden="true">
            <div className={styles.quoteBadge}>“</div>

            <div className={styles.trackContainer}>
              <div
                className={styles.trackFill}
                style={{
                  height: `${Math.min(100, Math.max(6, scrollProgress * 100))}%`,
                }}
              />
            </div>

            <div className={styles.stepsStack} role="tablist">
              {PHILOSOPHY_SLIDES.map((slide, idx) => {
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={slide.number}
                    type="button"
                    className={`${styles.stepNumberBtn} ${
                      isActive ? styles.stepNumberActive : ""
                    }`}
                    onClick={() => handleStepClick(idx)}
                    aria-label={`Jump to philosophy quote ${slide.number}`}
                  >
                    {slide.number}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Statement Area with Guaranteed Non-blank Cross-switch */}
          <div className={styles.statementArea}>
            {PHILOSOPHY_SLIDES.map((slide, idx) => {
              const slideStyle = getSlideStyle(idx, cursor);

              return (
                <div
                  key={slide.number}
                  className={styles.statementSlide}
                  style={slideStyle}
                  aria-hidden={slideStyle.opacity < 0.5}
                >
                  <h3 className={styles.mainHeading}>
                    {slide.prefix}{" "}
                    <span className={styles.highlight}>{slide.highlight}</span>
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
