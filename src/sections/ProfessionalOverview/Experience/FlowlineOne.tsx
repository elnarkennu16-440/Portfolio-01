import React from "react";
import styles from "./FlowlineOne.module.css";

/**
 * FlowLineOne  -  decorative thin curve for the Experience page.
 *
 * HOW TO USE (in Experience.tsx):
 *   1) import { FlowLineOne } from "./FlowLineOne";
 *   2) put <FlowLineOne /> as the FIRST child inside the stage div:
 *        <div ref={stageRef} className={styles.stage}>
 *          <FlowLineOne />
 *          <aside className={styles.stageAside}>
 *
 * It is purely visual: absolutely positioned, behind everything, no pointer
 * events, hidden for screen readers. It takes no space (no layout impact) and
 * only shows in the desktop "book" layout.
 *
 * Curve: starts at the top-left corner of the card, passes behind the title and the
 * rail, ends at the bottom-left of the screen
 *
 * Coordinates: viewBox "-300 0 1300 1000"
 *   x = 0     -> left edge of the page's left column
 *   x = 1000  -> left edge of the page card
 *   x < 0     -> outside the content, toward the screen edge
 *   y = 0..1000 -> top..bottom of the stage (below the navbar)
 */
export const FlowLineOne: React.FC = () => (
  <svg
    className={styles.flowLine}
    viewBox="-300 0 1300 1000"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="
    M 994 17
    C 900 35 768 80 766 150
    C 764 215 740 262 610 312
    C 480 362 330 370 215 455
    C 120 525 118 600 112 690
    C 106 770 60 830 -136 980
      "
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

export default FlowLineOne;
