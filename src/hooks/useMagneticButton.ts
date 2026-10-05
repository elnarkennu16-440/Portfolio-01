import { useEffect, useRef } from "react";

/**
 * Lightweight magnetic micro-interaction for primary action buttons.
 * Strictly limited to fine-pointer devices (mouse/trackpad, max +-5px).
 * Automatically skipped on touch devices and when prefers-reduced-motion is active.
 */
export function useMagneticButton<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!hasFinePointer || prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10; // max +-5px
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10; // max +-5px
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    };

    const handleMouseLeave = () => {
      el.style.transform = "";
    };

    el.addEventListener("mousemove", handleMouseMove, { passive: true });
    el.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.style.transform = "";
    };
  }, []);

  return ref;
}
