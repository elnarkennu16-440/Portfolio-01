import * as THREE from "three";
import { BOTTLE, MOUTH } from "./preFooterParts";

/* ────────────────────────────────────────────────────────────────────────────
 * preFooterCallouts.ts — floating labels around the giant bottle.
 *
 * Each callout = a thin PURE WHITE line that starts exactly ON the bottle glass
 * (small dot) and ends next to a text label. No borders, just line + text.
 *
 * HOW IT IS DRAWN (important for sharpness + speed)
 *   The labels are NOT WebGL objects any more. They are drawn on a small 2D
 *   canvas laid over the 3D canvas, at the screen's real pixel density:
 *     • lines and text are anti-aliased by the browser: no jagged edges, no
 *       colour fringing, no blur from texture scaling;
 *     • no extra shaders / GPU textures (the 3D scene compiles faster);
 *     • the anchor points are still 3D: every frame the bottle's anchor points
 *       are projected with the live camera, so the lines stay glued to the glass
 *       while the camera moves, and the labels float and bob in 3D space.
 *   A layout pass (on resize) keeps labels apart from each other and inside the
 *   screen on desktop and mobile.
 * ──────────────────────────────────────────────────────────────────────────── */

type Align = "left" | "right" | "top";

interface Def {
  lines: string[]; // 1–2 text lines
  lat: number; // side offset on the bottle (+ = upper-left side, − = lower-right side)
  y: number; // height along the bottle: 0 = base end, 6.9 = mouth
  end: [number, number, number]; // where the line ends next to the text (world x, y, z)
  align: Align; // which side of the line end the text sits on
}

/* Order = reveal order. Positions follow the drawing: Frontend at the neck,
   Backend under the shoulder, API / Databases on the upper side, Security /
   Quality Assurance on the lower side, Deployment out at the base end. */
const DEFS: Def[] = [
  {
    lines: ["Frontend"],
    lat: 0.4,
    y: 4.8,
    end: [-1.3, 8.95, 3.0],
    align: "right",
  },
  {
    lines: ["API", "Integration"],
    lat: 1.15,
    y: 3.7,
    end: [0.55, 11.2, 3.4],
    align: "right",
  },
  {
    lines: ["Databases"],
    lat: 1.3,
    y: 2.2,
    end: [3.8, 11.9, 4.2],
    align: "top",
  },
  {
    lines: ["Deployment"],
    lat: 0.1,
    y: 0.85,
    end: [7.3, 11.9, 3.9],
    align: "left",
  },
  {
    lines: ["Security"],
    lat: -1.3,
    y: 1.6,
    end: [9.1, 9.1, 4.1],
    align: "left",
  },
  {
    lines: ["Quality", "Assurance"],
    lat: -1.3,
    y: 3.2,
    end: [7.4, 7.85, 3.6],
    align: "left",
  },
  {
    lines: ["Backend"],
    lat: -1.0,
    y: 4.4,
    end: [6.0, 4.6, 3.2],
    align: "left",
  },
];

/* bottle radius by height (same numbers as the glass in preFooterParts.ts) */
const RADIUS: Array<[number, number]> = [
  [0, 1.15],
  [0.12, 1.5],
  [0.5, 1.6],
  [3.3, 1.6],
  [3.78, 1.52],
  [4.32, 1.18],
  [4.8, 0.84],
  [5.2, 0.66],
  [5.7, 0.63],
  [6.3, 0.63],
];
const radiusAt = (y: number) => {
  if (y <= RADIUS[0][0]) return RADIUS[0][1];
  for (let i = 1; i < RADIUS.length; i++) {
    const [y1, r1] = RADIUS[i];
    if (y <= y1) {
      const [y0, r0] = RADIUS[i - 1];
      return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
    }
  }
  return RADIUS[RADIUS.length - 1][1];
};

const SANS = `"Helvetica Neue", Helvetica, Arial, sans-serif`;
const GAP = 5; // px between the line end and the text
const PAD_X = 10;
const PAD_TOP = 16;
const PAD_BOTTOM = 10;
const MARGIN = 8; // minimum px between two labels

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (t: number, start: number, dur: number) =>
  clamp01((t - start) / dur);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

interface Item {
  def: Def;
  anchor: THREE.Vector3; // on the bottle glass
  end: THREE.Vector3; // label position in the world (before the bob)
  tw: number; // text block width in px
  th: number; // text block height in px
  offX: number; // layout shift in px (keeps labels apart / on screen)
  offY: number;
  phase: number;
}

export interface CalloutLayoutOptions {
  camera: THREE.Camera; // already posed at its final (post-reveal) position
  w: number;
  h: number;
  fontPx: number;
  mobile: boolean;
}

export interface Callouts {
  layout: (o: CalloutLayoutOptions) => void;
  /** t = seconds since the reveal started (−1 before it), time = clock in seconds. */
  update: (camera: THREE.Camera, t: number, time: number) => void;
  dispose: () => void;
}

export function buildCallouts(host: HTMLElement): Callouts {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      layout: () => undefined,
      update: () => undefined,
      dispose: () => undefined,
    };
  }
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    display: "block",
    pointerEvents: "none",
  });
  host.appendChild(canvas);

  const cssSans = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-sans")
    .trim();
  const family = cssSans ? `${cssSans}, ${SANS}` : SANS;

  /* bottle pose (must match buildBottle in preFooterParts.ts) */
  const a = BOTTLE.angle;
  const reach = BOTTLE.mouth - BOTTLE.pivot;
  const rig = new THREE.Vector3(
    MOUTH.x + Math.sin(a) * reach,
    MOUTH.y - Math.cos(a) * reach,
    BOTTLE.z,
  );
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const anchorOf = (lat: number, y: number) => {
    const r = radiusAt(y);
    const z = Math.sqrt(Math.max(0, r * r - lat * lat)); // front surface of the glass
    const yp = y - BOTTLE.pivot;
    return new THREE.Vector3(
      rig.x + lat * ca - yp * sa,
      rig.y + lat * sa + yp * ca,
      rig.z + z + 0.03,
    );
  };

  const items: Item[] = DEFS.map((def, i) => ({
    def,
    anchor: anchorOf(def.lat, def.y),
    end: new THREE.Vector3(...def.end),
    tw: 60,
    th: 16,
    offX: 0,
    offY: 0,
    phase: i * 1.7,
  }));

  let W = 1;
  let H = 1;
  let fontPx = 13;
  let lh = 16;
  let lineW = 1.3;
  let drawn = false;
  const v = new THREE.Vector3();

  const project = (
    camera: THREE.Camera,
    p: THREE.Vector3,
    out: { x: number; y: number },
  ) => {
    v.copy(p).project(camera);
    out.x = (v.x * 0.5 + 0.5) * W;
    out.y = (-v.y * 0.5 + 0.5) * H;
  };

  /** top-left of the text block for a line end at (x, y) */
  const blockOrigin = (it: Item, x: number, y: number) => {
    const al = it.def.align;
    return {
      x0:
        al === "right"
          ? x - GAP - it.tw
          : al === "left"
            ? x + GAP
            : x - it.tw / 2,
      y0: al === "top" ? y - GAP - it.th : y - it.th / 2,
    };
  };

  /* ───────────── layout: sizes, collisions, screen edges ───────────── */
  const layout = (o: CalloutLayoutOptions) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, o.w);
    H = Math.max(1, o.h);
    canvas.width = Math.round(W * dpr); // resizing resets the context state
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fontPx = o.fontPx;
    lh = Math.round(fontPx * 1.25);
    lineW = o.mobile ? 1.15 : 1.3;
    ctx.font = `600 ${fontPx}px ${family}`;
    for (const it of items) {
      it.tw = Math.ceil(
        Math.max(...it.def.lines.map((l) => ctx.measureText(l).width)),
      );
      it.th = lh * it.def.lines.length;
    }

    interface R {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      sx: number;
      sy: number;
    }
    const p = { x: 0, y: 0 };
    const rects: R[] = items.map((it) => {
      project(o.camera, it.end, p);
      const { x0, y0 } = blockOrigin(it, p.x, p.y);
      return { x0, y0, x1: x0 + it.tw, y1: y0 + it.th, sx: x0, sy: y0 };
    });
    const shift = (r: R, dx: number, dy: number) => {
      r.x0 += dx;
      r.x1 += dx;
      r.y0 += dy;
      r.y1 += dy;
    };
    const clampAll = () => {
      for (const r of rects) {
        if (r.x0 < PAD_X) shift(r, PAD_X - r.x0, 0);
        if (r.x1 > W - PAD_X) shift(r, W - PAD_X - r.x1, 0);
        if (r.y0 < PAD_TOP) shift(r, 0, PAD_TOP - r.y0);
        if (r.y1 > H - PAD_BOTTOM) shift(r, 0, H - PAD_BOTTOM - r.y1);
      }
    };
    clampAll();
    for (let iter = 0; iter < 14; iter++) {
      let moved = false;
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const A = rects[i];
          const B = rects[j];
          const ox = Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0) + MARGIN;
          const oy = Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0) + MARGIN;
          if (ox <= 0 || oy <= 0) continue;
          moved = true;
          if (oy <= ox) {
            const dir = A.y0 + A.y1 < B.y0 + B.y1 ? -1 : 1;
            shift(A, 0, (dir * oy) / 2);
            shift(B, 0, (-dir * oy) / 2);
          } else {
            const dir = A.x0 + A.x1 < B.x0 + B.x1 ? -1 : 1;
            shift(A, (dir * ox) / 2, 0);
            shift(B, (-dir * ox) / 2, 0);
          }
        }
      }
      clampAll();
      if (!moved) break;
    }
    items.forEach((it, i) => {
      it.offX = rects[i].x0 - rects[i].sx;
      it.offY = rects[i].y0 - rects[i].sy;
    });
    drawn = true; // the canvas was cleared by the resize: make update() redraw
  };

  /* ───────────── per-frame drawing ───────────── */
  const a0 = { x: 0, y: 0 };
  const e0 = { x: 0, y: 0 };

  const update = (camera: THREE.Camera, t: number, time: number) => {
    let any = false;
    for (let i = 0; i < items.length; i++) {
      if (seg(t, 1.9 + i * 0.09, 0.65) > 0.001) {
        any = true;
        break;
      }
    }
    if (!any) {
      if (drawn) {
        ctx.clearRect(0, 0, W, H);
        drawn = false;
      }
      return;
    }
    drawn = true;
    camera.updateMatrixWorld();
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.font = `600 ${fontPx}px ${family}`;
    ctx.textBaseline = "middle";

    items.forEach((it, i) => {
      const p = seg(t, 1.9 + i * 0.09, 0.65);
      if (p <= 0.001) return;
      const e = easeOutCubic(p);

      // anchor: glued to the bottle glass
      project(camera, it.anchor, a0);

      // label end: floats gently in 3D, then gets the layout shift + edge clamp
      v.set(
        it.end.x + Math.sin(time * 0.9 + it.phase) * 0.04 * p,
        it.end.y + Math.sin(time * 1.15 + it.phase * 1.7) * 0.07 * p,
        it.end.z,
      ).project(camera);
      e0.x = (v.x * 0.5 + 0.5) * W + it.offX;
      e0.y = (-v.y * 0.5 + 0.5) * H + it.offY;
      let { x0, y0 } = blockOrigin(it, e0.x, e0.y);
      let dx = 0;
      let dy = 0;
      if (x0 < PAD_X) dx = PAD_X - x0;
      else if (x0 + it.tw > W - PAD_X) dx = W - PAD_X - (x0 + it.tw);
      if (y0 < PAD_TOP) dy = PAD_TOP - y0;
      else if (y0 + it.th > H - PAD_BOTTOM) dy = H - PAD_BOTTOM - (y0 + it.th);
      e0.x += dx;
      e0.y += dy;
      x0 += dx;
      y0 += dy;

      const cx = a0.x + (e0.x - a0.x) * e;
      const cy = a0.y + (e0.y - a0.y) * e;

      // line (pure white, anti-aliased by the browser)
      ctx.globalAlpha = Math.min(1, p * 2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = lineW;
      ctx.beginPath();
      ctx.moveTo(a0.x, a0.y);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // dot on the glass
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(a0.x, a0.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.globalAlpha = Math.min(1, p * 2) * 0.5;
      ctx.beginPath();
      ctx.arc(a0.x, a0.y, 5.5, 0, Math.PI * 2);
      ctx.stroke();

      // text (fades in once the line has almost arrived)
      const op = seg(p, 0.45, 0.55);
      if (op > 0.001) {
        ctx.globalAlpha = op;
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 1;
        const al = it.def.align;
        ctx.textAlign =
          al === "right" ? "right" : al === "left" ? "left" : "center";
        const tx =
          al === "right" ? x0 + it.tw : al === "left" ? x0 : x0 + it.tw / 2;
        it.def.lines.forEach((line, k) =>
          ctx.fillText(line, tx, y0 + lh * (k + 0.5)),
        );
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }
    });
    ctx.globalAlpha = 1;
  };

  const dispose = () => {
    canvas.remove();
  };

  return { layout, update, dispose };
}
