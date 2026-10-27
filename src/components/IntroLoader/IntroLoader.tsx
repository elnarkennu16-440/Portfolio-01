import React, { useState, useEffect, useRef } from "react";
import logoImg from "../../assets/logo/KE-LOGO-.png";
import styles from "./IntroLoader.module.css";

interface IntroLoaderProps {
  onComplete?: () => void;
  onStartTransition?: () => void;
  durationMs?: number;
}

/**
 * NEW: name of the event the loader fires the moment it starts exiting.
 * The Navbar listens to it and flies the logo from the loader to the navbar.
 * (Same string is used in Navbar.tsx)
 */
const LOGO_HANDOFF_EVENT = "ke:intro-logo-handoff";

export const IntroLoader: React.FC<IntroLoaderProps> = ({
  onComplete,
  onStartTransition,
  durationMs = 2000,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // NEW: ref to the loader logo so we can read its exact on-screen position
  const logoRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // Exactly 2.0s smooth loading duration
    const exitTimer = setTimeout(() => {
      // NEW: tell the Navbar where the logo is right now (loader animation untouched)
      try {
        const el = logoRef.current;
        if (el) {
          const r = el.getBoundingClientRect();
          const detail = {
            left: r.left,
            top: r.top,
            width: r.width,
            height: r.height,
            at: Date.now(),
          };
          (
            window as unknown as { __keIntroLogoHandoff?: typeof detail }
          ).__keIntroLogoHandoff = detail;
          window.dispatchEvent(new CustomEvent(LOGO_HANDOFF_EVENT, { detail }));
        }
      } catch {
        /* handoff is optional, never block the loader */
      }

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
            ref={logoRef}
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
