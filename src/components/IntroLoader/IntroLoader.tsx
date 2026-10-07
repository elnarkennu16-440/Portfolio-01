import React, { useState, useEffect } from "react";
import logoImg from "../../assets/logo/KE-LOGO-.png";
import styles from "./IntroLoader.module.css";

interface IntroLoaderProps {
  onComplete?: () => void;
  onStartTransition?: () => void;
  durationMs?: number;
}

export const IntroLoader: React.FC<IntroLoaderProps> = ({
  onComplete,
  onStartTransition,
  durationMs = 2000,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Exactly 2.0s smooth loading duration
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      if (onStartTransition) {
        onStartTransition();
      }
    }, durationMs);

    // Fade-out transition completion into hero page
    const completeTimer = setTimeout(() => {
      setIsDone(true);
      if (onComplete) {
        onComplete();
      }
    }, durationMs + 650);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [durationMs, onComplete, onStartTransition]);

  if (isDone) return null;

  return (
    <div
      className={`${styles.overlay} ${isExiting ? styles.overlayExiting : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Kennu Elnar portfolio"
    >
      {/* Center Stage */}
      <div className={styles.stage}>
        {/* Concentric 1:1 Circular Lines (True geometric circles, not oval/egg) */}
        <div className={styles.ringsContainer} aria-hidden="true">
          {/* Outer circular line */}
          <div className={styles.spinRingOuter} />
          {/* Middle subtle architectural circular line */}
          <div className={styles.spinRingMiddle} />
          {/* Inner counter-spinning circular line */}
          <div className={styles.spinRingInner} />
          {/* Soft ambient glow behind logo */}
          <div className={styles.ambientGlow} />
        </div>

        {/* Center Official Logo - Preserving the enlarged, balanced size */}
        <div className={styles.logoWrapper}>
          <img
            src={logoImg}
            alt="Kennu Elnar Official Logo"
            className={styles.logoImage}
            width={212}
            height={235}
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
};
