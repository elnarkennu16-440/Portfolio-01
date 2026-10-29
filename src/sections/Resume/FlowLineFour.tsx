import React, { useEffect, useRef } from "react";
import styles from "./FlowLineFour.module.css";

/**
 * FlowLineFour  -  decorative thin curves for the Resume page.
 *
 * HOW TO USE (in Resume.tsx, unchanged):
 *   import { FlowLineFour } from "./FlowLineFour";
 *   <div className={styles.column}>
 *     <FlowLineFour anchorRef={paperWrapRef} />
 *     <h1 className={styles.mainTitle}>RESUME</h1>
 *
 * Two lines, purely visual (behind everything, no pointer events, hidden for
 * screen readers, no layout impact, never drawn over the resume paper):
 *   - LEFT / TOP line: starts at the left screen edge under the navbar, loops
 *     around the left of the title + paragraph, runs under the buttons and
 *     stops exactly on the top edge of the resume paper.
 *   - RIGHT line: a short curve from the right edge of the paper to the right
 *     screen edge.
 * Shown on screens 1100px and wider only.
 *
 * HOW THE SHAPE IS MADE
 *   The curves are NOT hand-typed Bezier numbers any more. Below are simple
 *   waypoints (TOP_POINTS / RIGHT_POINTS). A smoothing function turns them
 *   into one continuous curve with no corners and no kinks, at any screen size.
 *   To change the route, move the waypoints (keep them evenly spaced and the
 *   turns gentle, and the line stays smooth).
 *
 * HOW IT ANIMATES
 *   The line is drawn like a pen, slowly, from its start to its end (see the
 *   CSS file for the timing). It starts only after the line has been measured,
 *   so there is no flash / blink.
 */

type Pt = [number, number];

/* Waypoints in "reference pixels". They are scaled to the real size of each
   line, so the route always lines up with the page. */
const TOP_REF = { w: 626, h: 352 }; // left screen edge .. paper center, navbar .. paper top
const RIGHT_REF = { w: 175, h: 80 }; // paper right edge .. right screen edge

const TOP_POINTS: Pt[] = [
  [-6, 10],
  [28, 40],
  [66, 54],
  [108, 52],
  [150, 44],
  [182, 48],
  [203, 70],
  [208, 104],
  [192, 138],
  [166, 168],
  [138, 198],
  [116, 232],
  [104, 266],
  [110, 296],
  [136, 316],
  [182, 325],
  [250, 328],
  [330, 326],
  [410, 321],
  [490, 321],
  [552, 329],
  [596, 343],
  [626, 352],
];

const RIGHT_POINTS: Pt[] = [
  [0, 30],
  [22, 42],
  [60, 51],
  [105, 54],
  [145, 50],
  [175, 43],
];

/** how far below the top edge of the paper the right line sits (px) */
const RIGHT_LINE_OFFSET = 150;

/**
 * Turns waypoints into one smooth SVG path (cardinal spline with chord-length
 * spacing). The curve passes through every point, has no corners, and does
 * not overshoot when the points are unevenly spaced.
 */
function smoothPath(pts: Pt[]): string {
  const n = pts.length;
  if (n < 2) return "";
  const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6;

  // direction (tangent) at every point
  const tan: Pt[] = pts.map((p, i) => {
    if (i === 0) {
      const l = dist(p, pts[1]);
      return [(pts[1][0] - p[0]) / l, (pts[1][1] - p[1]) / l];
    }
    if (i === n - 1) {
      const l = dist(pts[n - 2], p);
      return [(p[0] - pts[n - 2][0]) / l, (p[1] - pts[n - 2][1]) / l];
    }
    const a = pts[i - 1];
    const b = pts[i + 1];
    const l = dist(a, p) + dist(p, b);
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  });

  const f = (v: number) => v.toFixed(2);
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const k = dist(p0, p1) / 3;
    d +=
      ` C ${f(p0[0] + tan[i][0] * k)} ${f(p0[1] + tan[i][1] * k)}` +
      ` ${f(p1[0] - tan[i + 1][0] * k)} ${f(p1[1] - tan[i + 1][1] * k)}` +
      ` ${f(p1[0])} ${f(p1[1])}`;
  }
  return d;
}

function buildPath(
  points: Pt[],
  ref: { w: number; h: number },
  w: number,
  h: number,
) {
  const sx = w / ref.w;
  const sy = h / ref.h;
  return smoothPath(points.map(([x, y]) => [x * sx, y * sy] as Pt));
}

interface FlowLineFourProps {
  /** the element the line must stop at (the resume paper wrapper) */
  anchorRef: React.RefObject<HTMLElement | null>;
}

export const FlowLineFour: React.FC<FlowLineFourProps> = ({ anchorRef }) => {
  const topRef = useRef<SVGSVGElement>(null);
  const rightRef = useRef<SVGSVGElement>(null);
  const topPathRef = useRef<SVGPathElement>(null);
  const rightPathRef = useRef<SVGPathElement>(null);

  // useEffect (not useLayoutEffect): the paper is rendered AFTER this
  // component, so its ref is only filled once everything has mounted.
  useEffect(() => {
    const topSvg = topRef.current;
    const rightSvg = rightRef.current;
    const topPath = topPathRef.current;
    const rightPath = rightPathRef.current;
    const anchor = anchorRef.current;
    const column = topSvg?.parentElement;
    if (!topSvg || !rightSvg || !topPath || !rightPath || !anchor || !column)
      return;

    // the lines are positioned from the column; make sure it is a positioning
    // context (the CSS does this too, this covers browsers without :has)
    if (getComputedStyle(column).position === "static") {
      column.style.position = "relative";
    }

    let drawn = false;
    let raf = 0;

    // fit one line to the real pixel size of its svg, so 1px stays 1px
    const fitLine = (
      svg: SVGSVGElement,
      path: SVGPathElement,
      pts: Pt[],
      ref: { w: number; h: number },
    ) => {
      const r = svg.getBoundingClientRect();
      if (r.width < 50 || r.height < 20) return false;
      svg.setAttribute(
        "viewBox",
        `0 0 ${r.width.toFixed(1)} ${r.height.toFixed(1)}`,
      );
      path.setAttribute("d", buildPath(pts, ref, r.width, r.height));
      svg.style.setProperty("--len", String(Math.ceil(path.getTotalLength())));
      return true;
    };

    const measure = () => {
      const paperTop =
        anchor.getBoundingClientRect().top - column.getBoundingClientRect().top;
      // the top line starts at the bottom of the navbar (a bit above the column)
      const lift = -(parseFloat(getComputedStyle(topSvg).top) || 0);

      topSvg.style.height = `${Math.max(0, paperTop + lift)}px`;
      rightSvg.style.top = `${paperTop + RIGHT_LINE_OFFSET}px`;

      const okTop = fitLine(topSvg, topPath, TOP_POINTS, TOP_REF);
      const okRight = fitLine(rightSvg, rightPath, RIGHT_POINTS, RIGHT_REF);

      // start drawing once, only after both lines have a real size
      if (okTop && okRight && !drawn) {
        drawn = true;
        raf = requestAnimationFrame(() => {
          raf = requestAnimationFrame(() => {
            topSvg.dataset.draw = "true";
            rightSvg.dataset.draw = "true";
          });
        });
      }
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(column);
    ro.observe(anchor);
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [anchorRef]);

  return (
    <>
      {/* LEFT / TOP line: ends on the top edge of the paper */}
      <svg
        ref={topRef}
        className={`${styles.flowLine} ${styles.lineTop}`}
        aria-hidden="true"
        focusable="false"
      >
        <path
          ref={topPathRef}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="butt"
          strokeLinejoin="round"
        />
      </svg>

      {/* RIGHT line: from the right edge of the paper to the right screen edge */}
      <svg
        ref={rightRef}
        className={`${styles.flowLine} ${styles.lineRight}`}
        aria-hidden="true"
        focusable="false"
      >
        <path
          ref={rightPathRef}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="butt"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};

export default FlowLineFour;
