import { useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "kennu_portfolio_theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored === "light" || stored === "dark") return stored;
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    } catch {
      // Fallback for restricted storage environments
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage write errors
    }
  }, [theme]);

  const toggleTheme = useCallback(
    (e?: React.MouseEvent | MouseEvent) => {
      const nextTheme: Theme = theme === "light" ? "dark" : "light";

      // Calculate click point or fallback to toggle position
      const x = e ? e.clientX : window.innerWidth - 60;
      const y = e ? e.clientY : 30;

      // Calculate the maximum distance to any viewport corner
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Modern View Transitions API with circular ripple expansion (Video 2 reference)
      if (
        !prefersReducedMotion &&
        typeof document !== "undefined" &&
        "startViewTransition" in document
      ) {
        document.documentElement.classList.add("view-transition-active");

        const transition = (
          document as unknown as {
            startViewTransition: (cb: () => void) => {
              ready: Promise<void>;
              finished: Promise<void>;
            };
          }
        ).startViewTransition(() => {
          document.documentElement.setAttribute("data-theme", nextTheme);
          setTheme(nextTheme);
        });

        transition.ready.then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ];

          document.documentElement.animate(
            {
              clipPath,
            },
            {
              duration: 550,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              pseudoElement: "::view-transition-new(root)",
            },
          );
        });

        transition.finished.finally(() => {
          document.documentElement.classList.remove("view-transition-active");
        });
      } else {
        document.documentElement.setAttribute("data-theme", nextTheme);
        setTheme(nextTheme);
      }
    },
    [theme],
  );

  return { theme, toggleTheme };
}
