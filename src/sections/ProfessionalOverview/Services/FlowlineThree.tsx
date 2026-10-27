import React from "react";
import styles from "./FlowlineThree.module.css";

/**
 * FlowLineThree  -  decorative thin curve for the Services page.
 *
 * HOW TO USE (in Services.tsx):
 *   1) import { FlowLineThree } from "./FlowLineThree";
 *   2) put <FlowLineThree /> as the FIRST child inside the stage div:
 *        <div ref={stageRef} className={styles.stage}>
 *          <FlowLineThree />
 *          <aside className={styles.stageAside}>
 *
 * It is purely visual: absolutely positioned, behind everything, no pointer
 * events, hidden for screen readers. It takes no space (no layout impact) and
 * only shows in the desktop "book" layout.
 *
 * Curve: starts at the top, arcs to the right (bulge next to the card), comes back
 * to the left through the middle of the rail, swings out to the far left
 * below it and ends at the bottom of the screen
 *
 * Coordinates: viewBox "-300 0 1300 1000"
 *   x = 0     -> left edge of the page's left column
 *   x = 1000  -> left edge of the page card
 *   x < 0     -> outside the content, toward the screen edge
 *   y = 0..1000 -> top..bottom of the stage (below the navbar)
 */
export const FlowLineThree: React.FC = () => (
  <svg
    className={styles.flowLine}
    viewBox="-300 0 1300 1000"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="
    M 254 0
    C 364 50 430 48 540 68
    C 640 86 846 170 846 280
    C 846 370 810 461 700 494
    C 610 521 520 520 420 570
    C 350 605 224 646 224 756
    C 224 816 310 833 370 913
    C 400 953 455 975 490 1000
      "
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

export default FlowLineThree;
