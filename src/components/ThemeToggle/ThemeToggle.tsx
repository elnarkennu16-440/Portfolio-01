import React from "react";
import { Sun, Moon } from "lucide-react";
import type { Theme } from "../../hooks/useTheme";
import styles from "./ThemeToggle.module.css";

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
