import React, { useEffect, useRef, useState } from "react";
import styles from "./SkylineScene.module.css";
import {
  AXIS,
  GROUND,
  GROWTH,
  SKY_BUILDINGS,
  SKY_CHIPS,
  SkyBuilding,
  SkyCameraVars,
  SkyTheme,
  computeSkyCamera,
} from "./skylineConfig";
import { SkyTextures, buildSkyTextures } from "./skylineTextures";

/* same event name ThemeToggle dispatches (keep in sync with HeroScene / glScene) */
const THEME_EVENT = "kennu:themechange";

/** which theme the page is in right now (same rule as glScene.ts → readTheme) */
function readTheme(): SkyTheme {
  if (typeof document === "undefined") return "dark";
  const el = document.documentElement;
  const v =
    el.getAttribute("data-theme") ?? document.body?.getAttribute("data-theme");
  if (v === "dark" || v === "light") return v;
  if (el.classList.contains("dark")) return "dark";
  return "light";
}

type Vars = React.CSSProperties & Record<string, string | number>;

const px = (n: number) => `${n}px`;

/* ── one block: 3 visible faces (top / front / right) ───────────────────── */
interface BoxProps {
  w: number;
  d: number;
  h: number;
  frontTex?: string;
  rightTex?: string;
  className?: string;
}
const Box: React.FC<BoxProps> = ({
  w,
  d,
  h,
  frontTex,
  rightTex,
  className,
}) => (
  <>
    <i
      className={`${styles.faceTop} ${className ?? ""}`}
      style={{
        width: px(w),
        height: px(d),
        transform: `translate3d(0, 0, ${h}px)`,
      }}
    />
    <i
      className={`${styles.faceFront} ${className ?? ""}`}
      style={{
        width: px(w),
        height: px(h),
        transform: `translate3d(0, ${d}px, ${h}px) rotateX(-90deg)`,
        backgroundImage: frontTex ? `url(${frontTex})` : undefined,
      }}
    />
    <i
      className={`${styles.faceRight} ${className ?? ""}`}
      style={{
        width: px(d),
        height: px(h),
        transform: `translate3d(${w}px, ${d}px, ${h}px) rotateZ(-90deg) rotateX(-90deg)`,
        backgroundImage: rightTex ? `url(${rightTex})` : undefined,
      }}
    />
  </>
);

const Building: React.FC<{
  b: SkyBuilding;
  frontTex?: string;
  rightTex?: string;
}> = ({ b, frontTex, rightTex }) => (
  <div
    className={styles.bld}
    style={
      {
        "--x": px(b.x),
        "--y": px(b.y),
        "--delay": `${b.delay}s`,
      } as Vars
    }
  >
    <Box w={b.w} d={b.d} h={b.h} frontTex={frontTex} rightTex={rightTex} />
    {b.roof?.map((r, i) => (
      <div
        key={i}
        className={styles.roofBox}
        style={{ transform: `translate3d(${r.x}px, ${r.y}px, ${b.h}px)` }}
      >
        <Box w={r.w} d={r.d} h={r.h} className={styles.roofFace} />
      </div>
    ))}
  </div>
);

/** the tallest thing on the roof, so the quote floats above it */
const topOf = (b: SkyBuilding) =>
  b.h + Math.max(0, ...(b.roof?.map((r) => r.h) ?? [0]));

export const SkylineScene: React.FC = () => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const rigRef = useRef<HTMLDivElement | null>(null);
  const camRef = useRef<SkyCameraVars | null>(null);
  const paintRef = useRef<() => void>(() => {});
  const [tex, setTex] = useState<SkyTextures | null>(null);

  /* 1 ── camera: size the scene to the stage (ResizeObserver, no scroll work) */
  useEffect(() => {
    const stage = stageRef.current;
    const rig = rigRef.current;
    if (!stage || !rig) return;

    // pointer "parallax": the camera drifts a hair with the mouse (desktop only)
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const fine = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const cur = { mx: 0, my: 0 };
    const tgt = { mx: 0, my: 0 };
    let raf = 0;
    let active = false;

    const paint = () => {
      const cam = camRef.current;
      if (!cam) return;
      const [fx, fy, fz] = cam.focus;
      rig.style.transform =
        `scale3d(${cam.k},${cam.k},${cam.k}) ` +
        `rotateX(${cam.tilt + cur.my * -1.4}deg) ` +
        `rotateZ(${cam.yaw + cur.mx * 2.2}deg) ` +
        `translate3d(${-fx}px,${-fy}px,${-fz}px)`;
    };
    paintRef.current = paint;

    const apply = (W: number, H: number) => {
      if (W < 2 || H < 2) return;
      const cam = computeSkyCamera(W, H);
      camRef.current = cam;
      stage.style.setProperty("--persp", String(cam.persp));
      stage.style.setProperty("--yaw", String(cam.yaw));
      stage.style.setProperty("--tilt", String(cam.tilt));
      stage.style.setProperty("--ls", String(cam.ls));
      stage.dataset.size = cam.mobile ? "mobile" : "desktop";
      paint();
    };

    const loop = () => {
      raf = 0;
      cur.mx += (tgt.mx - cur.mx) * 0.08;
      cur.my += (tgt.my - cur.my) * 0.08;
      paint();
      if (
        Math.abs(tgt.mx - cur.mx) > 0.002 ||
        Math.abs(tgt.my - cur.my) > 0.002
      ) {
        raf = requestAnimationFrame(loop);
      }
    };
    const kick = () => {
      if (!raf && active) raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      tgt.mx = Math.max(
        -1,
        Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2),
      );
      tgt.my = Math.max(
        -1,
        Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2),
      );
      kick();
    };
    const onLeave = () => {
      tgt.mx = 0;
      tgt.my = 0;
      kick();
    };

    apply(stage.clientWidth, stage.clientHeight);
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(([e]) =>
            apply(e.contentRect.width, e.contentRect.height),
          )
        : null;
    ro?.observe(stage);

    /* 2 ── only "alive" while on screen: the reveal starts when it scrolls in,
          the floating motion is paused when it scrolls out or the tab is hidden */
    const setActive = (on: boolean) => {
      active = on && !document.hidden;
      stage.dataset.active = active ? "true" : "false";
      if (!active && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    let inView = false;
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([e]) => {
              inView = e.isIntersecting;
              if (inView) stage.dataset.ready = "true";
              setActive(inView);
            },
            { threshold: 0.18 },
          )
        : null;
    if (io) io.observe(stage);
    else {
      stage.dataset.ready = "true";
      setActive(true);
    }
    const onVis = () => setActive(inView || !io);
    document.addEventListener("visibilitychange", onVis);

    if (fine && !reduce) {
      stage.addEventListener("pointermove", onMove, { passive: true });
      stage.addEventListener("pointerleave", onLeave, { passive: true });
    }

    return () => {
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* 3 ── textures: drawn once per theme (and again only if the visitor flips it) */
  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    let shown: SkyTheme | null = null;

    const build = () => {
      const th = readTheme();
      if (th === shown) return;
      shown = th;
      window.clearTimeout(timer);
      // a tick later, so the page paints first and the drawing never blocks scrolling
      timer = window.setTimeout(() => {
        if (cancelled) return;
        try {
          const dense = (stageRef.current?.clientWidth ?? 1000) > 999;
          const t = buildSkyTextures(th, dense ? 1.15 : 0.8);
          if (!cancelled) setTex(t);
          stageRef.current?.setAttribute("data-theme-shown", th);
        } catch {
          /* no textures → the plain CSS colours stay, nothing breaks */
        }
      }, 30);
    };

    build();
    const mo =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(build)
        : null;
    mo?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
    if (document.body)
      mo?.observe(document.body, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
    window.addEventListener(THEME_EVENT, build);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      mo?.disconnect();
      window.removeEventListener(THEME_EVENT, build);
    };
  }, []);

  /* growth arrow: where it starts, how long it is, how steeply it climbs */
  const gdy = GROWTH.from.y - GROWTH.to.y;
  const gdz = GROWTH.to.z - GROWTH.from.z;
  const gLen = Math.hypot(gdy, gdz);
  const gAng = (Math.atan2(gdz, gdy) * 180) / Math.PI;
  const aLen = AXIS.from - AXIS.to;

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      data-active="false"
      role="img"
      aria-label="A decorative 3D skyline graph: five buildings growing taller from left to right, each with a short quote about patience, consistency and craft."
    >
      <div className={styles.camera} aria-hidden="true">
        <div ref={rigRef} className={styles.rig}>
          {/* ground (grid) + time axis */}
          <i
            className={styles.ground}
            style={{
              width: px(GROUND.size),
              height: px(GROUND.size),
              transform: `translate3d(${GROUND.x}px, ${GROUND.y}px, 0)`,
              backgroundImage: tex?.ground ? `url(${tex.ground})` : undefined,
            }}
          />

          {SKY_BUILDINGS.map((b, i) => (
            <i
              key={`ao${i}`}
              className={styles.ao}
              style={{
                width: px(b.w + 120),
                height: px(b.d + 120),
                transform: `translate3d(${b.x - 60}px, ${b.y - 40}px, 2px)`,
              }}
            />
          ))}

          <div
            className={styles.axis}
            style={
              {
                transform: `translate3d(${AXIS.x}px, ${AXIS.from}px, 3px) rotateZ(-90deg)`,
                "--len": px(aLen),
                "--delay": `${AXIS.delay}s`,
              } as Vars
            }
          >
            <i className={styles.axisLine} />
            <i className={styles.axisHead} />
          </div>
          <span
            className={styles.roadText}
            style={{
              transform: `translate3d(${AXIS.x - 78}px, ${AXIS.textY}px, 3px) rotateZ(-90deg)`,
              ["--delay" as string]: `${AXIS.delay + 0.3}s`,
            }}
          >
            {AXIS.text}
          </span>

          {/* the buildings */}
          {SKY_BUILDINGS.map((b, i) => (
            <Building
              key={i}
              b={b}
              frontTex={tex?.front[i]}
              rightTex={tex?.right[i]}
            />
          ))}

          {/* growth arrow in the air */}
          <div
            className={styles.growth}
            style={
              {
                transform: `translate3d(${GROWTH.x}px, ${GROWTH.from.y}px, ${GROWTH.from.z}px) rotateZ(-90deg) rotateX(-90deg) rotateZ(${-gAng}deg)`,
                "--len": px(gLen),
                "--delay": `${GROWTH.delay}s`,
              } as Vars
            }
          >
            <i className={styles.growthLine} />
            <i className={styles.growthHead} />
          </div>

          {/* floating quotes (always face the screen) */}
          {SKY_BUILDINGS.map((b, i) => (
            <div
              key={`q${i}`}
              className={styles.label}
              style={
                {
                  "--lx": px(b.x + b.w / 2),
                  "--ly": px(b.y + b.d / 2),
                  "--lz": px(topOf(b) + 22),
                  "--delay": `${b.delay + 1.1}s`,
                  "--bob": `${5 + (i % 3)}s`,
                } as Vars
              }
            >
              <div className={styles.labelIn}>
                <div className={styles.labelBob}>
                  <div className={styles.card}>
                    <span className={styles.tag}>{b.tag}</span>
                    <strong className={styles.title}>{b.title}</strong>
                    <span className={styles.text}>{b.text}</span>
                  </div>
                  <i className={styles.stem} />
                </div>
              </div>
            </div>
          ))}

          {/* small floating words */}
          {SKY_CHIPS.map((c, i) => (
            <div
              key={`c${i}`}
              className={`${styles.label} ${styles.chipWrap} ${
                c.skipOnMobile ? styles.noMobile : ""
              }`}
              style={
                {
                  "--lx": px(c.x),
                  "--ly": px(c.y),
                  "--lz": px(c.z),
                  "--delay": `${c.delay}s`,
                  "--bob": `${6 + (i % 4)}s`,
                } as Vars
              }
            >
              <div className={styles.labelIn}>
                <div className={styles.labelBob}>
                  <span className={styles.chip}>{c.text}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <i className={styles.grain} aria-hidden="true" />
    </div>
  );
};

export default SkylineScene;
