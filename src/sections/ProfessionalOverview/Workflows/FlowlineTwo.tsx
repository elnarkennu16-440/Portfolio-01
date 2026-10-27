import React from "react";
import styles from "./FlowLineTwo.module.css";

/**
 * FlowLineTwo  -  decorative thin curve for the Workflows page.
 *
 * HOW TO USE (in Workflows.tsx):
 *   1) import { FlowLineTwo } from "./FlowLineTwo";
 *   2) put <FlowLineTwo /> as the FIRST child inside the stage div:
 *        <div ref={stageRef} className={styles.stage}>
 *          <FlowLineTwo />
 *          <aside className={styles.stageAside}>
 *
 * It is purely visual: absolutely positioned, behind everything, no pointer
 * events, hidden for screen readers. It takes no space (no layout impact) and
 * only shows in the desktop "book" layout.
 *
 * Curve: starts at the top-left screen edge, loops around the left of the title,
 * runs under the title, then sweeps down through the rail to the bottom-left
 * corner of the card
 *
 * Coordinates: viewBox "-300 0 1300 1000"
 *   x = 0     -> left edge of the page's left column
 *   x = 1000  -> left edge of the page card
 *   x < 0     -> outside the content, toward the screen edge
 *   y = 0..1000 -> top..bottom of the stage (below the navbar)
 */
export const FlowLineTwo: React.FC = () => (
  <svg
    className={styles.flowLine}
    viewBox="-300 0 1300 1000"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="
    M -170 4
    C -110 10 -20 50 -20 120
    C -20 190 -86 190 -86 252
    C -86 300 -40 312 124 312
    C 270 312 400 316 440 340
    C 480 364 520 400 522 450
    C 524 490 560 504 650 508
    C 740 512 790 530 820 570
    C 850 610 874 650 884 700
    C 894 760 940 850 1000 985
      "
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

export default FlowLineTwo;
