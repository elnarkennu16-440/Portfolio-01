import React, { useEffect, useRef } from "react";
import styles from "./ScrollProgress.module.css";

export const ScrollProgress: React.FC = () => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If native CSS scroll-timeline is supported, CSS handles the animation directly
    if (typeof CSS !== "undefined" && CSS.supports && CSS.supports("animation-timeline", "scroll()")) {
      return;
    }

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = docHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / docHeight)) : 0;
          if (barRef.current) {
            barRef.current.style.setProperty("--scroll-progress", progress.toString());
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return <div ref={barRef} className={styles.progressBar} aria-hidden="true" />;
};
