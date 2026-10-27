import React, { useId, useState } from "react";
import { useVisitorCount } from "../../hooks/useVisitorCount";
import styles from "./LiveViewTracker.module.css";

interface LiveViewTrackerProps {
  className?: string;
}

type Mood = "wow" | "suspicious" | "smug" | "shy" | "deadpan";

const MOODS: Mood[] = ["wow", "suspicious", "smug", "shy", "deadpan"];
const MAX_AVATARS = 3;

// Strict monochrome palette
const W = "#FFFFFF";
const K = "#111111";

// "light" = white tile / black art, "dark" = black tile / white art
const DISC: Record<Mood, "light" | "dark"> = {
  wow: "light",
  suspicious: "dark",
  smug: "light",
  shy: "dark",
  deadpan: "light",
};

const art = (color: string, width = 1.3) => ({
  stroke: color,
  strokeWidth: width,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
});

const Character: React.FC<{ mood: Mood }> = ({ mood }) => {
  switch (mood) {
    // Arch-shaped body, surprised
    case "wow":
      return (
        <>
          <path d="M4 15Q8 3 20 4" {...art(K, 1.2)} />
          <path d="M27 8l1.5-2.5M30 11.5l2.5-1" {...art(K, 1.2)} />
          <path d="M9 37V19a9 9 0 0 1 18 0V37Z" fill={K} />
          <circle cx="14.5" cy="17.5" r="1.5" fill={W} />
          <circle cx="21.5" cy="17.5" r="1.5" fill={W} />
          <ellipse cx="18" cy="23.5" rx="1.6" ry="2.2" fill={W} />
        </>
      );

    // Tilted rounded square, side-eye, crossed arms
    case "suspicious":
      return (
        <>
          <path d="M5 37Q9 29 18 31Q27 29 31 37" {...art(W)} />
          <path d="M12 33.5L24 36" {...art(W)} />
          <g transform="rotate(-8 18 17)">
            <rect x="8" y="8" width="20" height="18" rx="7" fill={W} />
            <path d="M11 13L16 14.5M25 13L20 14.5" {...art(K, 1.4)} />
            <circle
              cx="13.5"
              cy="18.5"
              r="2.3"
              fill={W}
              stroke={K}
              strokeWidth="1.2"
            />
            <circle
              cx="22.5"
              cy="18.5"
              r="2.3"
              fill={W}
              stroke={K}
              strokeWidth="1.2"
            />
            <circle cx="14.7" cy="18.7" r="1" fill={K} />
            <circle cx="23.7" cy="18.7" r="1" fill={K} />
            <path d="M14 23.5H22" {...art(K, 1.4)} />
          </g>
        </>
      );

    // Diamond head, half-lidded eyes, smirk
    case "smug":
      return (
        <>
          <path d="M29 5v4M27 7h4" {...art(K, 1.2)} />
          <path d="M4 26Q3 19 7 14" {...art(K, 1.2)} />
          <rect
            x="9.5"
            y="9.5"
            width="17"
            height="17"
            rx="4"
            fill={K}
            transform="rotate(45 18 18)"
          />
          <path d="M11.5 17.5h5a2.5 2.5 0 0 1-5 0z" fill={W} />
          <path d="M19.5 17.5h5a2.5 2.5 0 0 1-5 0z" fill={W} />
          <path d="M14 22.5Q19 25.5 23 21.5" {...art(W, 1.4)} />
        </>
      );

    // Cloud blob, shy, hands covering
    case "shy":
      return (
        <>
          <path d="M15 7.5Q16 3 18 5.5Q20 3 21 7.5" {...art(W, 1.2)} />
          <path
            d="M18 7C25 6 30 11 29 18C30 25 24 29 18 28C11 29 6 25 7 18C6 11 11 6 18 7Z"
            fill={W}
          />
          <path d="M11.5 17q2-2.6 4 0M20.5 17q2-2.6 4 0" {...art(K, 1.4)} />
          <ellipse cx="11" cy="21.5" rx="2" ry="1.2" fill={K} opacity="0.22" />
          <ellipse cx="25" cy="21.5" rx="2" ry="1.2" fill={K} opacity="0.22" />
          <path d="M16 23q2 2 4 0" {...art(K, 1.4)} />
          <path d="M8 34Q9.5 28 15 29.5M28 34Q26.5 28 21 29.5" {...art(W)} />
        </>
      );

    // Rounded triangle, bored, sweat drop
    case "deadpan":
    default:
      return (
        <>
          <path d="M4 12Q6 7 11 5" {...art(K, 1.2)} />
          <path d="M29 9q2 2.5 0 4q-2-1.5 0-4z" fill={K} />
          <path
            d="M18 7L29 28H7Z"
            fill={K}
            stroke={K}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M12.5 18.5H16.5M19.5 18.5H23.5" {...art(W, 1.4)} />
          <circle cx="14.5" cy="22" r="1.4" fill={W} />
          <circle cx="21.5" cy="22" r="1.4" fill={W} />
          <path d="M15.5 26H20.5" {...art(W, 1.4)} />
        </>
      );
  }
};

const CharacterAvatar: React.FC<{ mood: Mood }> = ({ mood }) => {
  const clipId = `clip-${useId().replace(/:/g, "")}`;
  const isLight = DISC[mood] === "light";

  return (
    <div className={styles.avatarDisc} aria-hidden="true">
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.faceSvg}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x="0.5" y="0.5" width="35" height="35" rx="9" />
          </clipPath>
        </defs>
        <rect
          x="0.5"
          y="0.5"
          width="35"
          height="35"
          rx="9"
          fill={isLight ? W : K}
        />
        <g clipPath={`url(#${clipId})`}>
          <Character mood={mood} />
        </g>
        <rect
          x="1"
          y="1"
          width="34"
          height="34"
          rx="8.6"
          stroke={isLight ? K : W}
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
};

export const LiveViewTracker: React.FC<LiveViewTrackerProps> = ({
  className = "",
}) => {
  const { count } = useVisitorCount();

  // Random starting character per page load (stable while the page is open)
  const [offset] = useState(() => Math.floor(Math.random() * MOODS.length));

  // Always at least 1 (the current viewer)
  const displayCount = Math.max(1, count || 1);
  const isMultiple = displayCount > 1;
  const avatarCount = Math.min(displayCount, MAX_AVATARS);

  return (
    <div
      className={`${styles.floatingTrackerContainer} ${className}`}
      role="status"
      aria-label={`${displayCount} ${isMultiple ? "viewers" : "viewer"} viewing now`}
    >
      <div className={styles.avatarCluster}>
        {Array.from({ length: avatarCount }).map((_, i) => (
          <CharacterAvatar key={i} mood={MOODS[(offset + i) % MOODS.length]} />
        ))}
      </div>

      <div className={styles.trackerPill}>
        <span className={styles.countDigit}>{displayCount}</span>
        <span className={styles.textLabel}>
          {isMultiple ? "VIEWERS" : "VIEWER"}
        </span>
      </div>
    </div>
  );
};
