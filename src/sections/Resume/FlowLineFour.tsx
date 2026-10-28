import React, { useEffect, useRef } from "react";
import styles from "./FlowLineFour.module.css";

/**
 * FlowLineFour - decorative thin curves for the Resume page.
 *
 * Usage (unchanged):
 *   <FlowLineFour anchorRef={paperWrapRef} />
 *
 * ONE full-width svg that sits BEHIND everything (z-index -1). It holds 3 lines:
 *   1) LEFT line  : starts at the left screen edge, loops around the title /
 *                   paragraph, runs down the left side and goes in UNDER the
 *                   left edge of the resume paper.
 *   2) ARC line   : comes out from under the paper, rises between the two
 *                   button groups and goes back under the paper.
 *   3) RIGHT line : starts at the right edge of the paper and runs to the
 *                   right screen edge.
 * The paper is opaque and above the svg, so the parts that go "under" it are
 * simply hidden.  Shown on screens 1100px and wider only.
 *
 * SMOOTHNESS: the paths are built in REAL PIXELS (viewBox = real size, nothing
 * stretched), from a few guide points, joined with matching tangents at every
 * point -> no kinks / "balikô".
 */

type Pt = [number, number];

/* ── GUIDE POINTS ───────────────────────────────────────────────────────────
 * LEFT line  : [x as fraction of the LEFT MARGIN (0 = screen edge, 1 = paper's
 *               left edge), y as fraction of the paper-top height]
 * ARC line   : [x as fraction of the PAPER WIDTH, y in px relative to paper top
 *               (negative = above the paper)]
 * RIGHT line : [x as fraction of the RIGHT MARGIN (0 = paper's right edge,
 *               1 = screen edge), y in px below paper top]
 * ─────────────────────────────────────────────────────────────────────────── */
const LEFT_POINTS: Pt[] = [
  [0.0, 0.118],
  [0.3, 0.185],
  [0.8, 0.09],
  [0.98, 0.07],
  [1.19, 0.12],
  [1.255, 0.2],
  [1.22, 0.29],
  [0.88, 0.43],
  [0.43, 0.54],
  [0.28, 0.65],
  [0.26, 0.88],
  [0.33, 1.02],
  [0.5, 1.15],
  [0.75, 1.215],
  [1.08, 1.2],
];

const ARC_POINTS: Pt[] = [
  [0.285, 5],
  [0.35, -30],
  [0.404, -66],
  [0.46, -75],
  [0.57, -47],
  [0.65, -16],
  [0.74, -7],
  [0.8, 3],
];

const RIGHT_POINTS: Pt[] = [
  [-0.03, 112],
  [0.12, 134],
  [0.36, 155],
  [0.7, 172],
  [1.0, 187],
];

/** Smooth curve through absolute pixel points (shared tangent at each point,
 *  handle length follows segment length -> no corners, no overshoot). */
function buildSmoothPath(p: Pt[]): string {
  const n = p.length;
  if (n < 2) return "";

  const tangents: Pt[] = p.map((_, i) => {
    const prev = p[Math.max(0, i - 1)];
    const next = p[Math.min(n - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    return [dx / len, dy / len];
  });

  const k = 0.36; // handle length (fraction of segment length)
  let d = `M ${p[0][0].toFixed(2)} ${p[0][1].toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const a = p[i];
    const b = p[i + 1];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const c1: Pt = [
      a[0] + tangents[i][0] * seg * k,
      a[1] + tangents[i][1] * seg * k,
    ];
    const c2: Pt = [
      b[0] - tangents[i + 1][0] * seg * k,
      b[1] - tangents[i + 1][1] * seg * k,
    ];
    d += ` C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)}, ${c2[0].toFixed(2)} ${c2[1].toFixed(2)}, ${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
  }
  return d;
}

interface FlowLineFourProps {
  /** the resume paper wrapper (the lines are placed relative to it) */
  anchorRef: React.RefObject<HTMLElement | null>;
}

export const FlowLineFour: React.FC<FlowLineFourProps> = ({ anchorRef }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const leftPathRef = useRef<SVGPathElement>(null);
  const arcPathRef = useRef<SVGPathElement>(null);
  const rightPathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const leftPath = leftPathRef.current;
    const arcPath = arcPathRef.current;
    const rightPath = rightPathRef.current;
    const anchor = anchorRef.current;
    const column = svg?.parentElement;
    if (!svg || !leftPath || !arcPath || !rightPath || !anchor || !column)
      return;

    if (getComputedStyle(column).position === "static") {
      column.style.position = "relative";
    }

    const measure = () => {
      // hidden on small screens (display: none) -> nothing to draw
      const first = svg.getBoundingClientRect();
      if (first.width < 1) return;

      const paper = anchor.getBoundingClientRect();
      const P = paper.top - first.top; // paper top, in svg coordinates
      if (P < 1) return;

      // make the svg tall enough to hold the parts below the paper's top edge
      const H = Math.round(Math.max(P * 1.3, P + 260));
      svg.style.height = `${H}px`;

      const W = first.width;
      const paperLeft = paper.left - first.left;
      const paperRight = paper.right - first.left;
      const paperW = paper.width;
      const rightMargin = Math.max(0, W - paperRight);
      const s = Math.min(1, Math.max(0.6, paperW / 900)); // scale heights on narrow layouts

      const leftPts: Pt[] = LEFT_POINTS.map(([fx, fy]) => [
        fx * paperLeft,
        fy * P,
      ]);
      const arcPts: Pt[] = ARC_POINTS.map(([fx, dy]) => [
        paperLeft + fx * paperW,
        P + dy * s,
      ]);
      const rightPts: Pt[] = RIGHT_POINTS.map(([fx, dy]) => [
        paperRight + fx * rightMargin,
        P + dy * s,
      ]);

      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      leftPath.setAttribute("d", buildSmoothPath(leftPts));
      arcPath.setAttribute("d", buildSmoothPath(arcPts));
      rightPath.setAttribute("d", buildSmoothPath(rightPts));

      // animation starts only now (after the first real measurement)
      svg.dataset.ready = "true";
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(column);
    ro.observe(anchor);
    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [anchorRef]);

  return (
    <svg
      ref={svgRef}
      className={styles.flowLine}
      aria-hidden="true"
      focusable="false"
    >
      <path
        ref={leftPathRef}
        className={`${styles.drawPath} ${styles.pathLeft}`}
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        ref={arcPathRef}
        className={`${styles.drawPath} ${styles.pathArc}`}
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        ref={rightPathRef}
        className={`${styles.drawPath} ${styles.pathRight}`}
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
};

export default FlowLineFour;
