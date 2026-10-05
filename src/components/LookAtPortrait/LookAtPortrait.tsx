import React, { useRef } from "react";
import { siteContent } from "../../content/siteContent";
import { useLookAtPointer, LOOK_FRAMES } from "../../hooks/useLookAtPointer";
import styles from "./LookAtPortrait.module.css";

export const LookAtPortrait: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeDirection, previousDirection } = useLookAtPointer({
    containerRef,
    basePath: siteContent.lookGrid.basePath,
  });

  return (
    <div
      ref={containerRef}
      className={styles.stage}
      role="img"
      aria-label={`Interactive portrait of ${siteContent.meta.name}, following cursor direction`}
    >
      {/* Background Soft Grayscale Aura */}
      <div className={styles.backdropAura} aria-hidden="true" />

      {/* Layered 9-Angle Head Direction Cutouts with zero-blink solid base */}
      <div className={styles.portraitWrapper}>
        {LOOK_FRAMES.map((frame) => {
          const isActive = frame.id === activeDirection;
          const isPrevious = frame.id === previousDirection && !isActive;

          let stateClass = "";
          if (isActive) {
            stateClass = styles.frameActive;
          } else if (isPrevious) {
            stateClass = styles.framePrevious;
          }

          return (
            <img
              key={frame.id}
              src={`${siteContent.lookGrid.basePath}${frame.file}`}
              alt={frame.label}
              width={1024}
              height={1024}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className={`${styles.frameImage} ${stateClass}`}
              aria-hidden={!isActive}
            />
          );
        })}
      </div>
    </div>
  );
};
