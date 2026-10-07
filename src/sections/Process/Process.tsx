import React, { useState, useEffect, useRef } from "react";
import { siteContent, ProcessStep } from "../../content/siteContent";
import { getPlaceholderDebugAttr } from "../../utils/debugContent";
import styles from "./Process.module.css";

export const Process: React.FC = () => {
  const { process } = siteContent;
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  // Scrambled initial state: Phase 04, Phase 02, Phase 01, Phase 03
  const [slotSteps, setSlotSteps] = useState<ProcessStep[]>([
    process.steps[3], // Slot 1 initially holds Phase 04 (Report)
    process.steps[1], // Slot 2 initially holds Phase 02 (Plan)
    process.steps[0], // Slot 3 initially holds Phase 01 (Understand)
    process.steps[2], // Slot 4 initially holds Phase 03 (Test & Build)
  ]);

  const [flippingSlots, setFlippingSlots] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);
  const [solvedSlots, setSolvedSlots] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);

  // Guaranteed Automatic Scroll Detection: fires without failing on clicks, scrolls, or navbar links
  useEffect(() => {
    const checkVisibility = () => {
      if (hasTriggered || !gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      // When the card borders enter into comfortable view:
      if (rect.top < window.innerHeight * 0.88 && rect.bottom > 40) {
        setHasTriggered(true);
      }
    };

    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility, { passive: true });

    // Check immediately on load and after short delays (e.g. for navbar anchor clicks like #process)
    checkVisibility();
    const t1 = setTimeout(checkVisibility, 200);
    const t2 = setTimeout(checkVisibility, 600);

    return () => {
      window.removeEventListener("scroll", checkVisibility);
      window.removeEventListener("resize", checkVisibility);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [hasTriggered]);

  // AUTOMATIC RUBIK'S CUBE SWITCHING: runs completely on its own once scrolled into view!
  useEffect(() => {
    if (!hasTriggered) return;

    // Reset to scrambled state to guarantee user sees: 04, 02, 01, 03
    setSlotSteps([
      process.steps[3], // Phase 04
      process.steps[1], // Phase 02
      process.steps[0], // Phase 01
      process.steps[2], // Phase 03
    ]);
    setFlippingSlots([false, false, false, false]);
    setSolvedSlots([false, false, false, false]);

    // 1. Hold scrambled layout for 1.3s so the user clearly sees the out-of-order phases
    // 2. Step 1 (t = 1.3s): Slot 1 twists 90deg on Y axis, switches from 04 to 01 Understand, and snaps forward!
    const timer1 = setTimeout(() => {
      setFlippingSlots([true, false, false, false]);
      setTimeout(() => {
        setSlotSteps((prev) => [process.steps[0], prev[1], prev[2], prev[3]]);
        setFlippingSlots([false, false, false, false]);
        setSolvedSlots([true, false, false, false]);
      }, 450);
    }, 1300);

    // 3. Step 2 (t = 2.4s): Slot 2 twists and locks into 02 Plan!
    const timer2 = setTimeout(() => {
      setFlippingSlots([false, true, false, false]);
      setTimeout(() => {
        setSlotSteps((prev) => [prev[0], process.steps[1], prev[2], prev[3]]);
        setFlippingSlots([false, false, false, false]);
        setSolvedSlots([true, true, false, false]);
      }, 450);
    }, 2400);

    // 4. Step 3 (t = 3.5s): Slot 3 twists 90deg on Y axis, switches from 01 to 03 Test & Build, and snaps forward!
    const timer3 = setTimeout(() => {
      setFlippingSlots([false, false, true, false]);
      setTimeout(() => {
        setSlotSteps((prev) => [prev[0], prev[1], process.steps[2], prev[3]]);
        setFlippingSlots([false, false, false, false]);
        setSolvedSlots([true, true, true, false]);
      }, 450);
    }, 3500);

    // 5. Step 4 (t = 4.6s): Slot 4 twists 90deg on Y axis, switches from 03 to 04 Report, and snaps forward!
    const timer4 = setTimeout(() => {
      setFlippingSlots([false, false, false, true]);
      setTimeout(() => {
        setSlotSteps((prev) => [prev[0], prev[1], prev[2], process.steps[3]]);
        setFlippingSlots([false, false, false, false]);
        setSolvedSlots([true, true, true, true]);
      }, 450);
    }, 4600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [hasTriggered, process.steps]);

  return (
    <section
      id="process"
      className={`${styles.processSection} ${styles.isRevealed}`}
      aria-label="Development and QA Process"
      data-debug-content={getPlaceholderDebugAttr(process.status)}
    >
      {/* Faint Background Watermark */}
      <div className={`ghostWatermark ${styles.watermark}`} aria-hidden="true">
        {process.faintWatermark}
      </div>

      <div className="container">
        {/* Section Header with Left Accent Bar */}
        <div className={styles.headerRow}>
          <div className={styles.sectionHeader}>
            <div className={styles.titleAccentBar} aria-hidden="true" />
            {process.sectionNumber ? (
              <span className={styles.sectionNumber}>
                {process.sectionNumber}
              </span>
            ) : null}
            <h2 className={styles.sectionTitle}>{process.sectionTitle}</h2>
          </div>

          <div className={styles.headerUnderline} aria-hidden="true" />
        </div>

        <p className={styles.introText}>{process.intro}</p>

        {/* 4 Process Step Cards: 100% Pantay-Pantay Level Grid with Automatic Rubik's Face Switching */}
        <div ref={gridRef} className={styles.stepsGrid}>
          {slotSteps.map((step: ProcessStep, index: number) => {
            const isFlipping = flippingSlots[index];
            const isSolved = solvedSlots[index];

            return (
              <div
                key={`slot-${index}`}
                className={`${styles.stepCard} ${
                  isFlipping ? styles.isFlipping : ""
                } ${isSolved ? styles.isSolved : ""}`}
              >
                <div className={styles.cardInnerContent}>
                  <div className={styles.stepTopRow}>
                    <span className={styles.stepNumber}>{step.number}</span>
                    <span className={styles.stepStageBadge}>PHASE</span>
                  </div>

                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepSummary}>{step.summary}</p>
                  <p className={styles.stepDetails}>{step.details}</p>

                  {/* Purposeful Card Footer */}
                  <div className={styles.stepCardFooter}>
                    <span>PHASE {step.number} / 04</span>
                    <span aria-hidden="true">+</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
