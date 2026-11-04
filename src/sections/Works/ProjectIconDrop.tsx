import React, { useEffect, useRef } from "react";
import styles from "./ProjectIconDrop.module.css";
import {
  CRACK_SPAN,
  MAX_CRACKS,
  ZERO_POSE,
  buildDropPlan,
  clamp,
  easeInOutCubic,
  easeOutCubic,
  halfExtent,
  personalityFromKey,
  pointInPolygon,
  poseToTransform,
  relaxBounds,
  towerSilhouette,
  translationBounds,
} from "./projectIconDropPhysics";
import type { Bounds, Crack, Pose, Rect } from "./projectIconDropPhysics";

/**
 * ProjectIconDrop
 *
 * Wraps the project's logo tile (the raised square on the toppled tower) and adds:
 *   1. CLICK anywhere on the tower (cover, title, tech icons, the tower body itself...)
 *      -> the logo accidentally falls: slow, realistic, bounces, cracks, and lands at a
 *      random spot that is always INSIDE the tower's front face.
 *      Buttons / links (Overview, Live, GitHub) and clicks outside the tower do nothing.
 *   2. DRAG the fallen logo back to its empty socket -> it heals (cracks fade away,
 *      the plate glides back into place).
 *
 * All animation is driven imperatively (requestAnimationFrame + direct style writes),
 * so React never re-renders while it plays. Only the logo tile moves, nothing else.
 */

type Phase = "idle" | "dropping" | "fallen" | "dragging" | "healing";

interface DroppableLogoTileProps {
  /** the tile's visual class (styles.logoTile from ViewAllProjects.module.css) */
  className: string;
  children: React.ReactNode;
  /** project number or id: gives each project its own style of falling */
  projectKey: string;
}

const CRACK_SLOTS = Array.from({ length: MAX_CRACKS }, (_, i) => i);

const LIFT_SHADOW =
  "1px -1px 0 var(--t-tile-extrude-1), 2px -2px 0 var(--t-tile-extrude-2), " +
  "3px -3px 0 var(--t-tile-extrude-3), 0 20px 24px -6px rgba(0, 0, 0, 0.6)";

const toRect = (r: DOMRect): Rect => ({
  left: r.left,
  top: r.top,
  right: r.right,
  bottom: r.bottom,
});

export const DroppableLogoTile: React.FC<DroppableLogoTileProps> = ({
  className,
  children,
  projectKey,
}) => {
  const slotRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const flashRef = useRef<HTMLSpanElement>(null);
  const sheenRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const slot = slotRef.current;
    const tile = tileRef.current;
    const svg = svgRef.current;
    const flashEl = flashRef.current;
    const sheenEl = sheenRef.current;
    if (!slot || !tile || !svg || !flashEl || !sheenEl) return;

    const card = slot.closest<HTMLElement>("[data-project-card]");
    if (!card) return;

    // the tower's front face = the card's direct child that contains this tile
    let front: HTMLElement = slot;
    while (front.parentElement && front.parentElement !== card) {
      front = front.parentElement;
    }

    const darkPaths = Array.from(
      svg.querySelectorAll<SVGPathElement>('[data-crack="dark"]'),
    );
    const lightPaths = Array.from(
      svg.querySelectorAll<SVGPathElement>('[data-crack="light"]'),
    );
    const personality = personalityFromKey(projectKey);

    /* ------------------------------------------------------------- state */
    let phase: Phase = "idle";
    let raf = 0;
    let pose: Pose = ZERO_POSE;
    let restPose: Pose = ZERO_POSE;
    let cracks: Crack[] = [];
    let crackLevel = 0;
    let downAt: { x: number; y: number } | null = null;

    interface DragState {
      id: number;
      startX: number;
      startY: number;
      baseX: number;
      baseY: number;
      targetX: number;
      targetY: number;
      curX: number;
      curY: number;
      swing: number;
      lift: number;
      last: number;
      rest: Pose;
      bounds: Bounds;
      snap: number;
    }
    let drag: DragState | null = null;

    /* ----------------------------------------------------------- helpers */
    const cancelFrame = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const setPhase = (next: Phase) => {
      phase = next;
      slot.dataset.phase = next;
      if (next === "idle") {
        tile.style.transform = "";
        tile.style.transition = "";
        tile.style.willChange = "";
        tile.style.touchAction = "";
        tile.style.cursor = "";
        tile.style.boxShadow = "";
        delete slot.dataset.near;
      } else {
        // no CSS transform transition while we animate it ourselves
        tile.style.transition = "box-shadow 0.25s ease";
        tile.style.willChange = "transform";
        tile.style.touchAction = "none";
        tile.style.cursor =
          next === "dragging" ? "grabbing" : next === "fallen" ? "grab" : "";
      }
    };

    const applyPose = (p: Pose) => {
      pose = p;
      tile.style.transform = poseToTransform(p);
    };

    const loadCracks = (list: Crack[]) => {
      cracks = list;
      for (let i = 0; i < MAX_CRACKS; i++) {
        const d = list[i] ? list[i].d : "";
        darkPaths[i]?.setAttribute("d", d);
        lightPaths[i]?.setAttribute("d", d);
      }
    };

    const setCrackLevel = (level: number) => {
      crackLevel = level;
      svg.style.visibility = level <= 0.001 ? "hidden" : "visible";
      for (let i = 0; i < cracks.length; i++) {
        const p = clamp((level - cracks[i].start) / CRACK_SPAN, 0, 1);
        const off = (1 - p).toFixed(3);
        darkPaths[i]?.setAttribute("stroke-dashoffset", off);
        lightPaths[i]?.setAttribute("stroke-dashoffset", off);
      }
    };

    const setFlash = (v: number) => {
      flashEl.style.opacity = v <= 0.002 ? "0" : v.toFixed(3);
    };

    const setSheen = (u: number) => {
      if (u <= 0 || u >= 1) {
        sheenEl.style.opacity = "0";
        sheenEl.style.transform = "translateX(-100%)";
        return;
      }
      sheenEl.style.opacity = "1";
      sheenEl.style.transform = `translateX(${(-100 + 200 * u).toFixed(1)}%)`;
    };

    const collectKeepOut = (): Rect[] =>
      Array.from(card.querySelectorAll<HTMLElement>("a, button"))
        .filter((el) => !tile.contains(el))
        .map((el) => toRect(el.getBoundingClientRect()))
        .filter((r) => r.right > r.left && r.bottom > r.top);

    /* -------------------------------------------------------------- DROP */
    const startDrop = () => {
      cancelFrame();
      const calm =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const plan = buildDropPlan({
        home: toRect(slot.getBoundingClientRect()),
        front: toRect(front.getBoundingClientRect()),
        personality,
        keepOut: collectKeepOut(),
        calm,
      });
      loadCracks(plan.cracks);
      setCrackLevel(0);
      setFlash(0);
      setSheen(0);
      setPhase("dropping");

      let t0 = 0;
      const step = (now: number) => {
        if (!t0) t0 = now;
        const t = (now - t0) / 1000;
        if (t >= plan.duration) {
          applyPose(plan.rest);
          restPose = plan.rest;
          setCrackLevel(1);
          setFlash(0);
          setPhase("fallen");
          raf = 0;
          return;
        }
        applyPose(plan.poseAt(t));
        setCrackLevel(plan.crackAt(t));
        setFlash(plan.flashAt(t));
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    /* -------------------------------------------------------------- HEAL */
    const finishHeal = () => {
      cancelFrame();
      setCrackLevel(0);
      setSheen(0);
      setFlash(0);
      pose = ZERO_POSE;
      restPose = ZERO_POSE;
      setPhase("idle");
    };

    const heal = () => {
      cancelFrame();
      setPhase("healing");
      const from = pose;
      const level0 = crackLevel;
      const dist = Math.hypot(from.x, from.y);
      const dur = clamp(0.85 + dist / 900, 0.85, 1.35) * 1000;
      const arcAmp = clamp(dist * 0.12, 4, 16);
      let t0 = 0;
      const step = (now: number) => {
        if (!t0) t0 = now;
        const u = clamp((now - t0) / dur, 0, 1);
        const e = easeInOutCubic(u);
        const arc = Math.sin(Math.PI * u);
        applyPose({
          x: from.x * (1 - e),
          y: from.y * (1 - e) - arcAmp * arc,
          rz: from.rz * (1 - e),
          rx: from.rx * (1 - e),
          ry: from.ry * (1 - e),
          s: 1 + 0.09 * arc,
        });
        // cracks close up again (tips first), then a soft light sweeps over the plate
        setCrackLevel(
          level0 * (1 - easeInOutCubic(clamp((u - 0.1) / 0.75, 0, 1))),
        );
        setSheen(clamp((u - 0.62) / 0.38, 0, 1));
        if (u >= 1) {
          finishHeal();
          return;
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    /* -------------------------------------------------------------- DRAG */
    const stepDrag = (now: number) => {
      const d = drag;
      if (!d || phase !== "dragging") return;
      const dt = Math.min(0.05, Math.max(0.001, (now - d.last) / 1000));
      d.last = now;
      d.lift = Math.min(1, d.lift + dt / 0.22);
      const k = 1 - Math.exp(-dt * 16);
      const px = d.curX;
      d.curX += (d.targetX - d.curX) * k;
      d.curY += (d.targetY - d.curY) * k;
      const vx = (d.curX - px) / dt;
      d.swing +=
        (clamp(vx * 0.035, -16, 16) - d.swing) * (1 - Math.exp(-dt * 10));
      const le = easeOutCubic(d.lift);
      applyPose({
        x: d.curX,
        y: d.curY,
        rz: d.rest.rz * (1 - le) + d.swing * le,
        rx: d.rest.rx * (1 - le),
        ry: d.rest.ry * (1 - le),
        s: 1 + 0.07 * le,
      });
      const near = Math.hypot(d.targetX, d.targetY) <= d.snap;
      if ((slot.dataset.near === "true") !== near) {
        if (near) slot.dataset.near = "true";
        else delete slot.dataset.near;
      }
      raf = requestAnimationFrame(stepDrag);
    };

    const settleAfterDrag = (d: DragState) => {
      cancelFrame();
      const from = pose;
      const to: Pose = {
        x: d.targetX,
        y: d.targetY,
        rz: d.rest.rz,
        rx: d.rest.rx,
        ry: d.rest.ry,
        s: 1,
      };
      restPose = to;
      setPhase("fallen");
      let t0 = 0;
      const dur = 380;
      const step = (now: number) => {
        if (!t0) t0 = now;
        const u = clamp((now - t0) / dur, 0, 1);
        const e = easeOutCubic(u);
        applyPose({
          x: from.x + (to.x - from.x) * e,
          y: from.y + (to.y - from.y) * e + 2.5 * Math.sin(Math.PI * u),
          rz: from.rz + (to.rz - from.rz) * e,
          rx: from.rx + (to.rx - from.rx) * e,
          ry: from.ry + (to.ry - from.ry) * e,
          s: 1 + (from.s - 1) * (1 - e),
        });
        if (u >= 1) {
          applyPose(to);
          raf = 0;
          return;
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const onTilePointerDown = (e: PointerEvent) => {
      if (phase !== "fallen") return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      try {
        tile.setPointerCapture(e.pointerId);
      } catch {
        /* not fatal */
      }
      cancelFrame(); // also cancels a settle tween that may still be running

      const home = toRect(slot.getBoundingClientRect());
      const size = home.right - home.left;
      const bounds = relaxBounds(
        translationBounds(
          home,
          toRect(front.getBoundingClientRect()),
          halfExtent(size, 16) * 1.1 + 2,
        ),
      );
      const rest = restPose;
      drag = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        baseX: pose.x,
        baseY: pose.y,
        targetX: pose.x,
        targetY: pose.y,
        curX: pose.x,
        curY: pose.y,
        swing: 0,
        lift: 0,
        last: performance.now(),
        rest,
        bounds,
        snap: Math.max(size * 0.8, 52),
      };
      setPhase("dragging");
      tile.style.boxShadow = LIFT_SHADOW;
      raf = requestAnimationFrame(stepDrag);
    };

    const onTilePointerMove = (e: PointerEvent) => {
      const d = drag;
      if (!d || phase !== "dragging" || e.pointerId !== d.id) return;
      d.targetX = clamp(
        d.baseX + (e.clientX - d.startX),
        d.bounds.minX,
        d.bounds.maxX,
      );
      d.targetY = clamp(
        d.baseY + (e.clientY - d.startY),
        d.bounds.minY,
        d.bounds.maxY,
      );
    };

    const onTilePointerEnd = (e: PointerEvent) => {
      const d = drag;
      if (!d || phase !== "dragging" || e.pointerId !== d.id) return;
      try {
        tile.releasePointerCapture(e.pointerId);
      } catch {
        /* not fatal */
      }
      drag = null;
      cancelFrame();
      tile.style.boxShadow = "";
      delete slot.dataset.near;
      const nearHome = Math.hypot(d.targetX, d.targetY) <= d.snap;
      if (e.type !== "pointercancel" && nearHome) heal();
      else settleAfterDrag(d);
    };

    /* ------------------------------------------------------- CLICK (card) */
    const onCardPointerDown = (e: PointerEvent) => {
      downAt = { x: e.clientX, y: e.clientY };
    };

    const onCardClick = (e: MouseEvent) => {
      if (phase !== "idle" || e.button !== 0) return;
      const target = e.target as Element | null;
      // buttons / links (Overview, Live demo, GitHub) are exempt: no drop
      if (
        !target ||
        target.closest('button, a, input, select, textarea, [role="button"]')
      ) {
        return;
      }
      // a mouse drag (e.g. selecting text) is not a click
      if (
        downAt &&
        Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8
      ) {
        return;
      }
      const sel = window.getSelection?.();
      if (sel && !sel.isCollapsed && card.contains(sel.anchorNode)) return;

      // only clicks INSIDE the toppled tower itself count (not the empty corners)
      const poly = towerSilhouette(
        toRect(card.getBoundingClientRect()),
        toRect(front.getBoundingClientRect()),
      );
      if (!pointInPolygon(e.clientX, e.clientY, poly)) return;

      startDrop();
    };

    const preventDefault = (e: Event) => e.preventDefault();

    /* ------------------------------------------------------------ RESIZE */
    // keep a fallen icon inside the tower if the layout changes (resize / rotate phone)
    const keepInsideFace = () => {
      if (phase !== "fallen") return;
      const home = toRect(slot.getBoundingClientRect());
      const size = home.right - home.left;
      const b = relaxBounds(
        translationBounds(
          home,
          toRect(front.getBoundingClientRect()),
          halfExtent(size, restPose.rz) + 4,
        ),
      );
      const x = clamp(restPose.x, b.minX, b.maxX);
      const y = clamp(restPose.y, b.minY, b.maxY);
      if (x !== restPose.x || y !== restPose.y) {
        restPose = { ...restPose, x, y };
        applyPose(restPose);
      }
    };
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(keepInsideFace)
        : null;
    ro?.observe(front);

    card.addEventListener("pointerdown", onCardPointerDown);
    card.addEventListener("click", onCardClick);
    tile.addEventListener("pointerdown", onTilePointerDown);
    tile.addEventListener("pointermove", onTilePointerMove);
    tile.addEventListener("pointerup", onTilePointerEnd);
    tile.addEventListener("pointercancel", onTilePointerEnd);
    tile.addEventListener("dragstart", preventDefault);

    return () => {
      cancelFrame();
      ro?.disconnect();
      card.removeEventListener("pointerdown", onCardPointerDown);
      card.removeEventListener("click", onCardClick);
      tile.removeEventListener("pointerdown", onTilePointerDown);
      tile.removeEventListener("pointermove", onTilePointerMove);
      tile.removeEventListener("pointerup", onTilePointerEnd);
      tile.removeEventListener("pointercancel", onTilePointerEnd);
      tile.removeEventListener("dragstart", preventDefault);
    };
  }, [projectKey]);

  return (
    <div ref={slotRef} className={styles.slot}>
      <div ref={tileRef} className={`${className} ${styles.tile}`}>
        {children}
        <span className={styles.fx} aria-hidden="true">
          <svg
            ref={svgRef}
            className={styles.cracks}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {CRACK_SLOTS.map((i) => (
              <g key={i}>
                <path
                  data-crack="light"
                  className={styles.crackLight}
                  d=""
                  pathLength={1}
                  strokeDasharray="1 2"
                  strokeDashoffset={1}
                  transform="translate(0.9 0.9)"
                />
                <path
                  data-crack="dark"
                  className={styles.crackDark}
                  d=""
                  pathLength={1}
                  strokeDasharray="1 2"
                  strokeDashoffset={1}
                />
              </g>
            ))}
          </svg>
          <span ref={flashRef} className={styles.flash} />
          <span ref={sheenRef} className={styles.sheen} />
        </span>
      </div>
    </div>
  );
};
