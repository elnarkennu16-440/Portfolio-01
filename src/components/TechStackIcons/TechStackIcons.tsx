import React from "react";
import styles from "./TechStackIcons.module.css";

interface TechStackIconsProps {
  tags: string[];
}

export const TechStackIcons: React.FC<TechStackIconsProps> = ({ tags }) => {
  const getIconForTag = (tag: string) => {
    const normalized = tag.toLowerCase().trim();

    if (normalized.includes("react")) {
      return (
        <svg
          viewBox="0 0 24 24"
          width="17"
          height="17"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <ellipse
            cx="12"
            cy="12"
            rx="10"
            ry="4.2"
            transform="rotate(0 12 12)"
          />
          <ellipse
            cx="12"
            cy="12"
            rx="10"
            ry="4.2"
            transform="rotate(60 12 12)"
          />
          <ellipse
            cx="12"
            cy="12"
            rx="10"
            ry="4.2"
            transform="rotate(120 12 12)"
          />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
        </svg>
      );
    }

    if (normalized.includes("typescript")) {
      return (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
          aria-hidden="true"
        >
          <rect
            x="2"
            y="2"
            width="20"
            height="20"
            rx="3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M5.5 8h6M8.5 8v8M14 16c1.2.6 2.5.6 3.4 0 .8-.5.8-1.5.2-2.1-.8-.8-2.6-1-3-1.8-.4-.7-.2-1.7.5-2.2.9-.6 2.2-.6 3.4 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );
    }

    if (normalized.includes("javascript")) {
      return (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="currentColor"
          aria-hidden="true"
        >
          <rect
            x="2"
            y="2"
            width="20"
            height="20"
            rx="3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M8 12.5v2.2c0 1.2-.8 1.8-1.8 1.8-.8 0-1.4-.4-1.7-.9M13.5 16c1.2.6 2.5.6 3.4 0 .8-.5.8-1.5.2-2.1-.8-.8-2.6-1-3-1.8-.4-.7-.2-1.7.5-2.2.9-.6 2.2-.6 3.4 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );
    }

    if (normalized.includes("laravel")) {
      return (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" />
          <path d="M12 12l9-5M12 12v10M12 12L3 7" />
          <path d="M7.5 4.5l9 5M16.5 14.5l-4.5 2.5" />
        </svg>
      );
    }

    if (normalized.includes("tailwind")) {
      return (
        <svg
          viewBox="0 0 24 24"
          width="17"
          height="17"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z" />
        </svg>
      );
    }

    if (normalized.includes("php")) {
      return (
        <svg
          viewBox="0 0 24 24"
          width="17"
          height="17"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <ellipse cx="12" cy="12" rx="10" ry="7" />
          <path d="M6 14V9.5h2a1.5 1.5 0 011.5 1.5v0A1.5 1.5 0 018 12.5H6M11.5 9.5V14M11.5 11h2.5a1.5 1.5 0 011.5 1.5v0a1.5 1.5 0 01-1.5 1.5H11.5M17 14V9.5h2a1.5 1.5 0 011.5 1.5v0a1.5 1.5 0 01-1.5 1.5H17" />
        </svg>
      );
    }

    if (
      normalized.includes("mysql") ||
      normalized.includes("postgres") ||
      normalized.includes("database")
    ) {
      return (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
        </svg>
      );
    }

    if (
      normalized.includes("rbac") ||
      normalized.includes("security") ||
      normalized.includes("spatie")
    ) {
      return (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2l8 4v6c0 5.25-3.4 10.15-8 11.5-4.6-1.35-8-6.25-8-11.5V6l8-4z" />
          <path d="M9.5 11.5l2 2 3.5-3.5" />
        </svg>
      );
    }

    if (
      normalized.includes("qa") ||
      normalized.includes("testing") ||
      normalized.includes("manual")
    ) {
      return (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      );
    }

    if (
      normalized.includes("cart") ||
      normalized.includes("checkout") ||
      normalized.includes("commerce")
    ) {
      return (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
          <path d="M3 3h2l2.68 12.39a2 2 0 002 1.61h8.72a2 2 0 002-1.61L22 7H6" />
        </svg>
      );
    }

    if (normalized.includes("css") || normalized.includes("style")) {
      return (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 3l1.5 16.5L12 22l6.5-2.5L20 3H4z" />
          <path d="M16.5 7H7.5l.4 4.5h8.1l-.6 6-4 1.2-4-1.2-.3-2.5" />
        </svg>
      );
    }

    if (
      normalized.includes("admin") ||
      normalized.includes("panel") ||
      normalized.includes("information")
    ) {
      return (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    }

    // Default code icon
    return (
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    );
  };

  return (
    <ul className={styles.techStackIconsList} aria-label="Technologies used">
      {tags.map((tag) => (
        <li
          key={tag}
          className={styles.techIconBadge}
          title={tag}
          aria-label={tag}
        >
          {getIconForTag(tag)}
          <span className={styles.srOnly}>{tag}</span>
        </li>
      ))}
    </ul>
  );
};
