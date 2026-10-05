import { useEffect, useRef, useState } from "react";

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useScrollReveal<T extends HTMLElement>(options: ScrollRevealOptions = {}) {
  const { threshold = 0.15, rootMargin = "0px 0px -40px 0px" } = options;
  const elementRef = useRef<T | null>(null);

  // Check prefers-reduced-motion: if reduced, reveal immediately with zero motion delay
  const [isRevealed, setIsRevealed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (isRevealed) return;

    const el = elementRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsRevealed(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, isRevealed]);

  return { elementRef, isRevealed };
}
