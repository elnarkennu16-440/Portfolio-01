import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import styles from "./HeroScene.module.css";
import {
  buildBillboard,
  buildCity,
  buildGroundAndRoad,
  buildLetters,
  buildRoadText,
  buildStreetLights,
  buildTraffic,
  createRoadCurve,
  disposeObject,
  isBlocked,
  mulberry32,
} from "./sceneParts";

/* ────────────────────────────────────────────────────────────────────────────
 * HeroScene — the 3D street (three.js, no React wrapper library needed).
 * Everything that looks like a number you may want to change is in TUNING.
 * The scene waits for `isIntroDone` (your loader) and then plays the reveal:
 *   fog lifts + camera dollies in → plinth → K E N N U rise → road dashes draw →
 *   ELNAR is painted → windows light up → billboard flickers on → lamps → traffic
 *
 * PERFORMANCE (the look of the scene is untouched):
 *   1. resolution is capped (MAX_DPR_*) and lowers itself automatically on slow GPUs
 *   2. the loop is capped to 60 fps (144 Hz screens no longer render 144 frames)
 *   3. the shadow map is rendered only while things grow, then frozen
 *   4. every shader is compiled up front, behind your loader (no stall mid-reveal)
 *   5. the scroll handler no longer reads layout (no forced reflow while scrolling)
 *   6. the canvas is only resized when its size really changed
 * ──────────────────────────────────────────────────────────────────────────── */

/* ═══════════════════════════ TUNING ═══════════════════════════════════════ */
const FOG_COLOR = 0x121214; // also the "sky": keep it near-black
const FOG_DENSITY = 0.019; // bigger = foggier / more moody
const FOG_START_DENSITY = 0.085; // thick fog before the reveal
const START_POS = new THREE.Vector3(9, 14, 48); // camera at the start of the reveal
const START_TARGET = new THREE.Vector3(0, 1.2, -14);
const END_POS = new THREE.Vector3(0.5, 1.8, 20); // final camera
const END_TARGET = new THREE.Vector3(0, 2.4, -10);
const MOBILE_SHIFT = 0.12; // phones: lifts the scene up (0.12 = 12% of the height)
const PARALLAX_X = 0.9; // mouse movement strength (desktop)
const PARALLAX_Y = 0.35;
const REDUCED_T = 100; // "already revealed" time used for reduced motion

/* ── performance tuning ── */
const MAX_DPR_DESKTOP = 1.5; // max render resolution (1 = CSS pixels, 2 = retina). Higher = sharper but slower
const MAX_DPR_MOBILE = 1.25;
const MIN_DPR = 1; // automatic quality never goes below this
const TARGET_FPS = 60; // frame cap (stops 120/144 Hz screens from doing double work)
const SHADOW_FREEZE_T = 3.4; // seconds after the reveal starts: the shadow map stops updating
const ADAPT_AFTER_T = 4.5; // start measuring fps after the intro animation has settled
const SLOW_FRAME_MS = 22; // average frame time above this (≈ below 45 fps) = lower the resolution
const ADAPT_WINDOW = 90; // frames per measurement

/* Composition was designed for a 16:9 window with a 34° vertical field of view */
const BASE_TAN_V = Math.tan(THREE.MathUtils.degToRad(17));
const TAN_H = BASE_TAN_V * (16 / 9);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (t: number, start: number, dur: number) =>
  clamp01((t - start) / dur);
const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));

/** neon-sign style flicker: returns 0..1 and settles at 1 */
const FLICKER = [0, 0.9, 0.15, 1, 0.35, 1, 0.1, 1];
const flicker = (t: number, start: number) => {
  const x = t - start;
  if (x < 0) return 0;
  if (x > 0.9) return 1;
  return FLICKER[
    Math.min(FLICKER.length - 1, Math.floor((x / 0.9) * FLICKER.length))
  ];
};

interface HeroSceneProps {
  isIntroDone?: boolean;
  className?: string;
}

interface SceneApi {
  reveal: () => void;
}

export const HeroScene: React.FC<HeroSceneProps> = ({
  isIntroDone = true,
  className,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<SceneApi | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const small =
      window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        stencil: false,
        powerPreference: "high-performance",
      });
    } catch {
      return; // no WebGL: the dark hero background + text still work
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    // the shadow map is re-rendered only when we ask for it (see update())
    renderer.shadowMap.autoUpdate = false;
    renderer.domElement.className = styles.canvas;
    host.appendChild(renderer.domElement);

    /* ── adaptive resolution ─────────────────────────────────────────────── */
    let dprCap = small ? MAX_DPR_MOBILE : MAX_DPR_DESKTOP;
    const dprFloor = Math.min(MIN_DPR, window.devicePixelRatio || 1);
    let lastW = 0;
    let lastH = 0;
    let lastDpr = 0;
    let hostH = 1; // cached: never read layout inside the scroll handler

    /** Resizes the drawing buffer ONLY if the size or resolution really changed. */
    const applySize = (w: number, h: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      if (w === lastW && h === lastH && dpr === lastDpr) return;
      lastW = w;
      lastH = h;
      lastDpr = dpr;
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
    };

    /* ── scene, fog, environment, lights ─────────────────────────────────── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(FOG_COLOR);
    const fog = new THREE.FogExp2(FOG_COLOR, FOG_START_DENSITY);
    scene.fog = fog;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.3;

    scene.add(new THREE.HemisphereLight(0x59606c, 0x0a0a0b, 0.55));

    const key = new THREE.DirectionalLight(0xcfd5df, 2.4);
    key.position.set(-26, 30, 22);
    key.target.position.set(0, 0, -8);
    key.castShadow = true;
    key.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    key.shadow.camera.left = -38;
    key.shadow.camera.right = 38;
    key.shadow.camera.top = 38;
    key.shadow.camera.bottom = -38;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 120;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.03;
    scene.add(key, key.target);

    const rim = new THREE.DirectionalLight(0x8e95a3, 1.1); // edge light from behind
    rim.position.set(30, 14, -40);
    scene.add(rim);

    /* ── build the world ─────────────────────────────────────────────────── */
    const rand = mulberry32(20261029);
    const curve = createRoadCurve();

    const roadParts = buildGroundAndRoad(curve, rand);
    const roadText = buildRoadText(curve, rand);
    const letters = buildLetters();
    const billboard = buildBillboard();
    const city = buildCity(curve, rand, isBlocked);
    const lamps = buildStreetLights(curve, isBlocked);
    const traffic = buildTraffic(curve, rand);
    traffic.group.visible = false;

    scene.add(
      roadParts.group,
      roadText.mesh,
      letters.group,
      billboard.group,
      city.group,
      lamps.group,
      traffic.group,
    );

    // start hidden (the reveal animates these)
    letters.plinth.scale.x = 0.001;
    roadParts.dashes.geometry.setDrawRange(0, 0);

    // billboard text uses the Kaushan Script brush font from Hero.module.css:
    // redraw the board once that font has finished loading
    let disposed = false;
    const brushLoaded = () => {
      let ok = false;
      document.fonts.forEach((f) => {
        if (
          f.family.replace(/["']/g, "") === "Kaushan Script" &&
          f.status === "loaded"
        )
          ok = true;
      });
      return ok;
    };
    let fontTries = 0;
    const pollFont = () => {
      if (disposed) return;
      document.fonts
        .load('66px "Kaushan Script"')
        .catch(() => [])
        .then(() => {
          if (disposed) return;
          if (brushLoaded()) {
            billboard.redraw();
            renderOnce();
          } else if (++fontTries < 12) {
            window.setTimeout(pollFont, 400);
          }
        });
    };

    /* ── camera + responsive framing ─────────────────────────────────────── */
    const camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.5, 320);
    const endPos = END_POS.clone();
    const camPos = new THREE.Vector3();
    const camTarget = new THREE.Vector3();
    const pointer = { x: 0, y: 0, cx: 0, cy: 0 };
    let scrollP = 0;

    // compile EVERY shader now (cars included, they are hidden at first) so that
    // nothing freezes in the middle of the reveal animation
    try {
      traffic.group.visible = true;
      renderer.compile(scene, camera);
    } catch {
      /* not critical: three compiles on first use instead */
    } finally {
      traffic.group.visible = false;
    }

    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      hostH = h;
      applySize(w, h);
      const aspect = w / h;
      camera.aspect = aspect;

      // keep the same horizontal composition on narrower screens: widen the
      // vertical field of view, and move the camera back if that is not enough
      const tanV = Math.min(Math.max(TAN_H / aspect, BASE_TAN_V), 0.62);
      camera.fov = THREE.MathUtils.radToDeg(Math.atan(tanV) * 2);
      const dolly = Math.min(1.9, Math.max(1, TAN_H / (tanV * aspect)));
      endPos
        .copy(END_TARGET)
        .add(END_POS.clone().sub(END_TARGET).multiplyScalar(dolly));

      if (aspect < 1) {
        camera.setViewOffset(w, h, 0, Math.round(h * MOBILE_SHIFT), w, h);
      } else {
        camera.clearViewOffset();
      }
      camera.updateProjectionMatrix();
      billboard.group.visible = aspect >= 0.95; // phones show the sentence as text
      renderOnce();
    };

    /* ── per-frame update ────────────────────────────────────────────────── */
    let revealStart: number | null = reduced ? -1 : null;
    let shadowsPrimed = false;
    let shadowsFrozen = false;

    const getT = (now: number) =>
      reduced
        ? REDUCED_T
        : revealStart === null
          ? -1
          : (now - revealStart) / 1000;

    const update = (now: number) => {
      const t = getT(now);

      fog.density = THREE.MathUtils.lerp(
        FOG_START_DENSITY,
        FOG_DENSITY,
        easeOutCubic(seg(t, 0, 3.6)),
      );

      // camera dolly + mouse parallax + very slow drift + scroll push-in
      const e = easeOutQuart(seg(t, 0, 3.8));
      camPos.copy(START_POS).lerp(endPos, e);
      camTarget.copy(START_TARGET).lerp(END_TARGET, e);
      if (!reduced) {
        pointer.cx += (pointer.x - pointer.cx) * 0.05;
        pointer.cy += (pointer.y - pointer.cy) * 0.05;
        camPos.x +=
          pointer.cx * PARALLAX_X * e + Math.sin(now * 0.00012) * 0.35 * e;
        camPos.y +=
          -pointer.cy * PARALLAX_Y * e + Math.sin(now * 0.00009) * 0.06 * e;
        camTarget.x += pointer.cx * 0.6 * e;
      }
      camPos.z -= scrollP * 7;
      camTarget.y += scrollP * 1.2;
      camera.position.copy(camPos);
      camera.lookAt(camTarget);

      // plinth, then the letters rise one after another
      letters.plinth.scale.x = Math.max(0.001, easeOutExpo(seg(t, 0.5, 0.9)));
      letters.letters.forEach((m, i) => {
        const p = seg(t, 0.8 + i * 0.16, 1.3);
        m.scale.y = Math.max(0.001, easeOutExpo(p));
      });
      const settle = seg(t, 0.8, 2.6);
      letters.material.emissiveIntensity =
        0.04 + (1 - settle) * 0.5 * (t > 0.8 ? 1 : 0);

      // road dashes are drawn from near to far
      const dashes = Math.floor(
        easeOutCubic(seg(t, 0.3, 2.4)) * roadParts.dashCount,
      );
      roadParts.dashes.geometry.setDrawRange(0, dashes * 6);
      roadText.material.opacity = 0.78 * seg(t, 1.8, 0.9);

      // windows light up
      const wBase = easeOutCubic(seg(t, 1.0, 2.4));
      city.facadeMats.forEach((m, i) => {
        const wFlick =
          wBase < 1 ? 0.6 + 0.4 * Math.abs(Math.sin(t * 37 + i * 5)) : 1;
        m.emissiveIntensity = wBase * 1.05 * wFlick;
      });
      city.beacons.forEach((b, i) => {
        (b.material as THREE.MeshBasicMaterial).opacity =
          t > 2.5
            ? 0.45 + 0.55 * Math.max(0, Math.sin(now * 0.003 + i * 1.7))
            : 0;
      });

      // billboard flickers on, lamps glow
      const f = flicker(t, 1.6);
      billboard.panelMat.emissiveIntensity = f * 1.0;
      billboard.spot.intensity = f * 160;
      lamps.glowMat.opacity = 0.55 * seg(t, 1.4, 1.4);

      // traffic
      traffic.group.visible = t > 2.2;
      if (traffic.group.visible) traffic.update(reduced ? 0 : t);

      // Shadows only change while the letters / plinth grow (t = 0 … SHADOW_FREEZE_T).
      // Before that and after that the shadow map is left alone: it is the single
      // most expensive thing in the scene and it used to be redrawn every frame
      // while the loader was still showing.
      if (!shadowsPrimed) {
        renderer.shadowMap.needsUpdate = true; // one initial bake
        shadowsPrimed = true;
        if (t >= SHADOW_FREEZE_T) shadowsFrozen = true;
      } else if (t >= 0 && t < SHADOW_FREEZE_T) {
        renderer.shadowMap.needsUpdate = true;
      } else if (t >= SHADOW_FREEZE_T && !shadowsFrozen) {
        renderer.shadowMap.needsUpdate = true; // final bake, then frozen
        shadowsFrozen = true;
      }
    };

    /* ── render loop (pauses when off-screen, capped at TARGET_FPS) ──────── */
    let raf = 0;
    let running = false;
    let inView = true;
    let lastFrame = 0;
    const FRAME_MS = 1000 / TARGET_FPS;

    // automatic quality: if the GPU cannot keep up, lower the resolution step by step
    let perfSum = 0;
    let perfN = 0;
    let slowWindows = 0;
    const adapt = (dt: number, t: number) => {
      if (reduced || t < ADAPT_AFTER_T || dt > 250) {
        perfSum = 0;
        perfN = 0;
        return;
      }
      perfSum += dt;
      perfN++;
      if (perfN < ADAPT_WINDOW) return;
      const avg = perfSum / perfN;
      perfSum = 0;
      perfN = 0;
      if (avg > SLOW_FRAME_MS) {
        if (++slowWindows >= 2) {
          slowWindows = 0;
          const current = Math.min(window.devicePixelRatio || 1, dprCap);
          if (current > dprFloor + 0.01) {
            dprCap = Math.max(dprFloor, current * 0.8);
            applySize(lastW, lastH);
          }
        }
      } else {
        slowWindows = 0;
      }
    };

    function renderOnce() {
      if (running || disposed) return;
      update(performance.now());
      renderer.render(scene, camera);
    }
    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const elapsed = now - lastFrame;
      if (elapsed < FRAME_MS - 0.75) return; // too early: skip this screen refresh
      lastFrame =
        lastFrame === 0 || elapsed > FRAME_MS * 4
          ? now
          : now - (elapsed % FRAME_MS);
      adapt(elapsed, getT(now));
      update(now);
      renderer.render(scene, camera);
    };
    const startLoop = () => {
      if (running || disposed || reduced) return;
      running = true;
      lastFrame = 0;
      raf = requestAnimationFrame(frame);
    };
    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    // NOTE: only reads window.scrollY (cheap). The hero height is cached in `hostH`,
    // reading host.clientHeight here forced a layout recalculation on every scroll event.
    const onScroll = () => {
      scrollP = clamp01(window.scrollY / hostH);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) startLoop();
        else stopLoop();
      },
      { threshold: 0 },
    );
    io.observe(host);

    if (finePointer && !reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
    }
    if (!reduced)
      window.addEventListener("scroll", onScroll, { passive: true });

    apiRef.current = {
      reveal: () => {
        if (reduced || revealStart !== null) return;
        revealStart = performance.now();
        if (inView) startLoop();
      },
    };

    resize();
    pollFont();
    startLoop();

    return () => {
      disposed = true;
      apiRef.current = null;
      stopLoop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      disposeObject(scene);
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    if (isIntroDone) apiRef.current?.reveal();
  }, [isIntroDone]);

  return (
    <div
      ref={hostRef}
      className={`${styles.root} ${className ?? ""}`}
      aria-hidden="true"
    />
  );
};

export default HeroScene;
