import React, { useEffect, useRef } from "react";
import styles from "./HighlightScene.module.css";
import { HighlightInput, createHighlightScene } from "./highlightGl";

export interface HighlightNote {
  /** small index shown in the floating note, e.g. "01" */
  num: string;
  title: string;
  text: string;
}

interface HighlightSceneProps {
  /** one chip per tower (first = the smallest tower, last = the tallest).
   *  Only `num` and `title` float on the tower; `text` is shown in the list. */
  notes: HighlightNote[];
  /** called if WebGL2 is not available (the page then shows the plain text list) */
  onUnsupported?: () => void;
}

/** phones / weak devices: lower resolution cap, ~30 fps */
function isLiteDevice() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (
    window.matchMedia("(max-width: 991px)").matches ||
    (nav.hardwareConcurrency ?? 8) <= 4 ||
    (nav.deviceMemory ?? 8) <= 4
  );
}

/**
 * The 3D "growth towers" graph. Everything 3D is drawn on one <canvas> with
 * WebGL (see highlightGl.ts); the floating notes are plain HTML that follow the
 * tower roofs (only `transform` / `opacity` change, so nothing is repainted).
 */
export const HighlightScene: React.FC<HighlightSceneProps> = ({
  notes,
  onUnsupported,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const noteRefs = useRef<(HTMLDivElement | null)[]>([]);
  const inputRef = useRef<HighlightInput>({ mx: 0, my: 0 });
  const unsupportedRef = useRef(onUnsupported);
  unsupportedRef.current = onUnsupported;

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    /* The WebGL context is only created when the stage is close to the screen (see
       SectionDots.tsx for why: phones allow very few live WebGL contexts). */
    const init = (): (() => void) | undefined => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const shown: boolean[] = [];

      const scene = createHighlightScene(canvas, {
        lite: isLiteDevice(),
        input: inputRef,
        onFrame: (xy, t) => {
          const els = noteRefs.current;
          const n = Math.min(els.length, xy.length / 2);
          for (let i = 0; i < n; i++) {
            const el = els[i];
            if (!el) continue;
            const bob = reduced ? 0 : Math.sin(t * 1.2 + i * 1.3) * 3;
            el.style.transform = `translate3d(${xy[i * 2].toFixed(1)}px, ${(
              xy[i * 2 + 1] + bob
            ).toFixed(1)}px, 0)`;
            // each note appears after its tower has grown
            if (!shown[i] && t > 0.45 + i * 0.2 + 1.1) {
              shown[i] = true;
              el.setAttribute("data-on", "1");
            }
          }
        },
      });

      if (!scene) {
        unsupportedRef.current?.();
        return;
      }

      /* tiny pointer parallax (mouse only, like the hero) */
      const fine = window.matchMedia("(pointer: fine)").matches;
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const r = stage.getBoundingClientRect();
        inputRef.current.mx = ((e.clientX - r.left) / r.width) * 2 - 1;
        inputRef.current.my = ((e.clientY - r.top) / r.height) * 2 - 1;
      };
      const onLeave = () => {
        inputRef.current.mx = 0;
        inputRef.current.my = 0;
      };
      if (fine && !reduced) {
        stage.addEventListener("pointermove", onMove, { passive: true });
        stage.addEventListener("pointerleave", onLeave);
      }

      /* land waves: where the pointer is over the stage (mouse hover, or a tap / touch),
       and clicks / taps that drop a stronger pulse. The scene does the rest. */
      const local = (e: PointerEvent) => {
        const r = stage.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      const onWaveMove = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        const p = local(e);
        const inp = inputRef.current;
        inp.px = p.x;
        inp.py = p.y;
        inp.hover = true;
      };
      const onWaveDown = (e: PointerEvent) => {
        const p = local(e);
        const inp = inputRef.current;
        inp.px = p.x;
        inp.py = p.y;
        inp.hover = true;
        (inp.kicks ??= []).push({ x: p.x, y: p.y });
      };
      const onWaveEnd = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") inputRef.current.hover = false;
      };
      const onWaveLeave = () => {
        inputRef.current.hover = false;
      };
      if (!reduced) {
        stage.addEventListener("pointermove", onWaveMove, { passive: true });
        stage.addEventListener("pointerdown", onWaveDown, { passive: true });
        stage.addEventListener("pointerup", onWaveEnd, { passive: true });
        stage.addEventListener("pointercancel", onWaveEnd, { passive: true });
        stage.addEventListener("pointerleave", onWaveLeave, { passive: true });
      }

      return () => {
        stage.removeEventListener("pointermove", onMove);
        stage.removeEventListener("pointerleave", onLeave);
        stage.removeEventListener("pointermove", onWaveMove);
        stage.removeEventListener("pointerdown", onWaveDown);
        stage.removeEventListener("pointerup", onWaveEnd);
        stage.removeEventListener("pointercancel", onWaveEnd);
        stage.removeEventListener("pointerleave", onWaveLeave);
        scene.dispose();
      };
    };

    if (typeof IntersectionObserver === "undefined") return init();
    let teardown: (() => void) | undefined;
    let started = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (started || !entries.some((e) => e.isIntersecting)) return;
        started = true;
        io.disconnect();
        teardown = init();
      },
      { rootMargin: "700px 0px 700px 0px" },
    );
    io.observe(stage);
    return () => {
      io.disconnect();
      teardown?.();
    };
  }, []);

  return (
    <div ref={stageRef} className={styles.stage}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.notes} aria-hidden="true">
        {notes.map((n, i) => (
          <div
            key={n.num}
            ref={(el) => {
              noteRefs.current[i] = el;
            }}
            className={styles.note}
          >
            <div className={styles.box}>
              <span className={styles.num}>{n.num}</span>
              <span className={styles.title}>{n.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HighlightScene;
