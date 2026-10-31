import React, { useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import type { Theme } from "../../hooks/useTheme";
import styles from "./ThemeToggle.module.css";

/** Announces every theme change to the whole page (AboutScene's 3D street listens).
 *  Keep this string in sync with THEME_EVENT in AboutScene.tsx. */
const THEME_CHANGE_EVENT = "kennu:themechange";

interface ThemeToggleProps {
  theme: Theme;
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onToggle,
}) => {
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: theme }),
    );
  }, [theme]);

  return (
    <button
      type="button"
      className={styles.toggleButton}
      onClick={onToggle}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
    >
      <div className={styles.iconWrapper} aria-hidden="true">
        <Sun className={`${styles.icon} ${styles.sunIcon}`} />
        <Moon className={`${styles.icon} ${styles.moonIcon}`} />
      </div>
    </button>
  );
};
