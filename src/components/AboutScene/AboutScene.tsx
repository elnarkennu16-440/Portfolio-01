import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import styles from "./AboutScene.module.css";
import {
  BOARD_A,
  BOARD_B,
  CAT,
  CONTRIBUTIONS,
  buildBoardA,
  buildBoardB,
  buildCat,
  buildCity,
  buildCrossing,
  buildDust,
  buildGooseLamp,
  buildGroundAndRoad,
  buildStreetLights,
  buildTraffic,
  createRoadCurve,
  disposeObject,
  isBlocked,
  mulberry32,
} from "./aboutSceneParts";

/* ────────────────────────────────────────────────────────────────────────────
 * AboutScene — the 3D street for the About section (three.js, optimized).
 * ──────────────────────────────────────────────────────────────────────────── */

const GITHUB_IMAGE_SRC = "/images/Github-Contribution.png";

/* ═══════════════════════════ TUNING ═══════════════════════════════════════ */
const FOG_COLOR = 0x121214;
const FOG_DENSITY = 0.017;
const FOG_START_DENSITY = 0.085;
const START_POS = new THREE.Vector3(-34, 15, 36);
const START_TARGET = new THREE.Vector3(4, 1.5, -8);
const END_POS = new THREE.Vector3(-15, 1.8, 11);
const END_TARGET = new THREE.Vector3(5, 2.7, -9);
const PARALLAX_X = 0.8;
const PARALLAX_Y = 0.3;
const REDUCED_T = 100;

const TOUR_MS = 5200;
const TOUR_TAN_V = Math.tan(THREE.MathUtils.degToRad(23));
const SHOTS = ["GitHub activity", "This platform", "The cat"] as const;
const SHOT_COUNT = SHOTS.length;

const MAX_DPR_DESKTOP = 1.5;
const MAX_DPR_MOBILE = 1.25;
const MIN_DPR = 1;
const TARGET_FPS = 60;
const SHADOW_FREEZE_T = 4.4;
const ADAPT_AFTER_T = 5;
const SLOW_FRAME_MS = 22;
const ADAPT_WINDOW = 90;

const BASE_TAN_V = Math.tan(THREE.MathUtils.degToRad(20));
const TAN_H = BASE_TAN_V * (16 / 9);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (t: number, start: number, dur: number) =>
  clamp01((t - start) / dur);
const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

const FLICKER = [0, 0.9, 0.15, 1, 0.35, 1, 0.1, 1];
const flicker = (t: number, start: number) => {
  const x = t - start;
  if (x < 0) return 0;
  if (x > 0.9) return 1;
  return FLICKER[
    Math.min(FLICKER.length - 1, Math.floor((x / 0.9) * FLICKER.length))
  ];
};

function poseForShot(
  shot: number,
  aspect: number,
  pos: THREE.Vector3,
  target: THREE.Vector3,
) {
  if (shot === 2) {
    const px = CAT.x + 0.5;
    const pz = CAT.z + 3.4;
    pos.set(px, 0.9, pz);
    target.set(CAT.x + (CAT.x - px) * 1.8, 0.25, CAT.z + (CAT.z - pz) * 1.8);
    return;
  }
  const b = shot === 0 ? BOARD_A : BOARD_B;
  const cy = b.postH + b.h / 2;
  const nx = Math.sin(b.yaw);
  const nz = Math.cos(b.yaw);
  const rx = Math.cos(b.yaw);
  const rz = -Math.sin(b.yaw);
  const dist = Math.max(14, ((b.w / 2) * 1.14) / (TOUR_TAN_V * aspect));
  pos.set(
    b.x + nx * dist + rx * dist * 0.17,
    1.9,
    b.z + nz * dist + rz * dist * 0.17,
  );
  target.set(b.x, cy - 0.16 * 2 * TOUR_TAN_V * dist, b.z);
}

interface BootControls {
  githubImageSrc: string;
  getShot: () => number;
  onTour: (v: boolean) => void;
  onLive: (v: boolean) => void;
}

interface SceneHandle {
  refresh: () => void;
  dispose: () => void;
}

function bootScene(host: HTMLDivElement, ctl: BootControls): SceneHandle {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    return { refresh: () => undefined, dispose: () => undefined };
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.domElement.className = styles.canvas;
  host.appendChild(renderer.domElement);

  let dprCap = small ? MAX_DPR_MOBILE : MAX_DPR_DESKTOP;
  const dprFloor = Math.min(MIN_DPR, window.devicePixelRatio || 1);
  let lastW = 0;
  let lastH = 0;
  let lastDpr = 0;

  const applySize = (w: number, h: number) => {
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    if (w === lastW && h === lastH && dpr === lastDpr) return;
    lastW = w;
    lastH = h;
    lastDpr = dpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
  };

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
  key.position.set(-30, 36, 24);
  key.target.position.set(12, 0, -8);
  key.castShadow = true;
  key.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  key.shadow.camera.left = -52;
  key.shadow.camera.right = 52;
  key.shadow.camera.top = 52;
  key.shadow.camera.bottom = -52;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 140;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  scene.add(key, key.target);

  const rim = new THREE.DirectionalLight(0x8e95a3, 1.1);
  rim.position.set(34, 16, -44);
  scene.add(rim);

  const rand = mulberry32(20261029 + 7);
  const curve = createRoadCurve();

  const roadParts = buildGroundAndRoad(curve, rand);
  const crossing = buildCrossing(curve, rand);
  const city = buildCity(curve, rand, isBlocked);
  const boardA = buildBoardA(ctl.githubImageSrc, () => renderOnce());
  const boardB = buildBoardB();
  const lamps = buildStreetLights(curve, isBlocked);
  const goose = buildGooseLamp();
  const cat = buildCat();
  const traffic = buildTraffic(curve, rand);
  const dust = buildDust(rand, small ? 90 : 180);
  traffic.group.visible = false;

  scene.add(
    roadParts.group,
    crossing.mesh,
    city.group,
    boardA.group,
    boardB.group,
    lamps.group,
    goose.group,
    cat.group,
    traffic.group,
    dust.points,
  );

  roadParts.dashes.geometry.setDrawRange(0, 0);

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
      .load('76px "Kaushan Script"')
      .catch(() => [])
      .then(() => {
        if (disposed) return;
        if (brushLoaded()) {
          boardB.redraw();
          renderOnce();
        } else if (++fontTries < 12) {
          window.setTimeout(pollFont, 400);
        }
      });
  };

  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.5, 360);
  const endPos = END_POS.clone();
  const tmp = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  const goalPos = new THREE.Vector3();
  const goalTarget = new THREE.Vector3();
  const curPos = new THREE.Vector3();
  const curTarget = new THREE.Vector3();
  const pointer = { x: 0, y: 0, cx: 0, cy: 0 };
  let aspect = 16 / 9;
  let tanV = BASE_TAN_V;
  let tour = false;
  let shotApplied = -1;
  let lastNow = 0;

  try {
    traffic.group.visible = true;
    renderer.compile(scene, camera);
  } catch {
    /* not critical */
  } finally {
    traffic.group.visible = false;
  }

  const resize = () => {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    applySize(w, h);
    aspect = w / h;
    camera.aspect = aspect;

    const nextTour = aspect < 1;
    if (nextTour) {
      tanV = TOUR_TAN_V;
    } else {
      tanV = Math.min(Math.max(TAN_H / aspect, BASE_TAN_V), 0.62);
      const dolly = Math.min(1.9, Math.max(1, TAN_H / (tanV * aspect)));
      endPos
        .copy(END_TARGET)
        .add(tmp.copy(END_POS).sub(END_TARGET).multiplyScalar(dolly));
    }
    camera.fov = THREE.MathUtils.radToDeg(Math.atan(tanV) * 2);
    camera.updateProjectionMatrix();

    if (nextTour !== tour) {
      tour = nextTour;
      ctl.onTour(tour);
    }
    if (tour) {
      shotApplied = ctl.getShot();
      poseForShot(shotApplied, aspect, goalPos, goalTarget);
    } else {
      goalPos.copy(endPos);
      goalTarget.copy(END_TARGET);
    }
    curPos.copy(goalPos);
    curTarget.copy(goalTarget);
    renderOnce();
  };

  let revealStart: number | null = reduced ? -1 : null;
  let revealed = reduced;
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
    const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 0.016;
    lastNow = now;

    if (tour) {
      const s = ctl.getShot();
      if (s !== shotApplied) {
        shotApplied = s;
        poseForShot(s, aspect, goalPos, goalTarget);
      }
      const k = reduced ? 1 : 1 - Math.exp(-dt * 2.6);
      curPos.lerp(goalPos, k);
      curTarget.lerp(goalTarget, k);
    }

    fog.density = THREE.MathUtils.lerp(
      FOG_START_DENSITY,
      FOG_DENSITY,
      easeOutCubic(seg(t, 0, 3.6)),
    );

    const e = easeOutQuart(seg(t, 0, 3.8));
    camPos.copy(START_POS).lerp(curPos, e);
    camTarget.copy(START_TARGET).lerp(curTarget, e);
    if (!reduced && !tour) {
      pointer.cx += (pointer.x - pointer.cx) * 0.05;
      pointer.cy += (pointer.y - pointer.cy) * 0.05;
      camPos.x +=
        pointer.cx * PARALLAX_X * e + Math.sin(now * 0.00012) * 0.35 * e;
      camPos.y +=
        -pointer.cy * PARALLAX_Y * e + Math.sin(now * 0.00009) * 0.06 * e;
      camTarget.x += pointer.cx * 0.6 * e;
      // Tinanggal ang scrollP dependency rito para mawala ang desktop scroll lag at layout thrashing
    } else if (!reduced) {
      camPos.y += Math.sin(now * 0.00009) * 0.05 * e;
    }
    camera.position.copy(camPos);
    camera.lookAt(camTarget);

    const dashes = Math.floor(
      easeOutCubic(seg(t, 0.3, 2.4)) * roadParts.dashCount,
    );
    roadParts.dashes.geometry.setDrawRange(0, dashes * 6);
    const bars = Math.ceil(easeOutCubic(seg(t, 0.8, 1.4)) * crossing.barCount);
    crossing.mesh.geometry.setDrawRange(0, bars * 6);

    const rise = (b: typeof boardA | typeof boardB, t0: number) => {
      b.footing.scale.x = Math.max(0.001, easeOutExpo(seg(t, t0, 0.7)));
      const p = Math.max(0.001, easeOutExpo(seg(t, t0 + 0.35, 0.8)));
      b.posts.forEach((post) => (post.scale.y = p));
      b.rig.scale.y = Math.max(0.001, easeOutExpo(seg(t, t0 + 0.9, 0.9)));
    };
    rise(boardA, 0.5);
    rise(boardB, 0.9);

    const fa = flicker(t, 2.0);
    boardA.setGlow(fa);
    boardA.spot.intensity = fa * 200;
    const fb = flicker(t, 2.5);
    boardB.setGlow(fb);
    boardB.spot.intensity = fb * 240;

    boardA.setCount(
      Math.round(CONTRIBUTIONS.count * easeOutExpo(seg(t, 2.3, 1.7))),
    );
    const wipe = easeOutCubic(seg(t, 2.6, 1.4));
    boardA.curtain.scale.x = Math.max(0.001, 1 - wipe);
    boardA.curtain.visible = wipe < 0.999;

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

    lamps.glowMat.opacity = 0.55 * seg(t, 1.8, 1.4);
    const lg = seg(t, 2.2, 1.3);
    goose.glowMat.opacity = 0.8 * lg;
    goose.coneMat.opacity = 0.05 * lg;
    goose.poolMat.opacity = 0.35 * lg;

    traffic.group.visible = t > 2.4;
    if (traffic.group.visible) traffic.update(reduced ? 0 : t);

    cat.update(
      reduced ? 0 : now / 1000,
      pointer.cx,
      pointer.cy,
      easeOutBack(seg(t, 3.0, 0.9)),
    );

    dust.material.opacity = 0.55 * seg(t, 2.5, 2);
    if (t > 2.4) dust.update(reduced ? 0 : now / 1000);

    if (!shadowsPrimed) {
      renderer.shadowMap.needsUpdate = true;
      shadowsPrimed = true;
      if (t >= SHADOW_FREEZE_T) shadowsFrozen = true;
    } else if (t >= 0 && t < SHADOW_FREEZE_T) {
      renderer.shadowMap.needsUpdate = true;
    } else if (t >= SHADOW_FREEZE_T && !shadowsFrozen) {
      renderer.shadowMap.needsUpdate = true;
      shadowsFrozen = true;
    }
  };

  let raf = 0;
  let running = false;
  let inView = false;
  let lastFrame = 0;
  const FRAME_MS = 1000 / TARGET_FPS;

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
    if (elapsed < FRAME_MS - 0.75) return;
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
    lastNow = 0;
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

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  const io = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      if (inView) {
        startLoop();
        if (!revealed && entry.intersectionRatio >= 0.2) {
          revealed = true;
          revealStart = performance.now();
        }
      } else {
        stopLoop();
      }
      ctl.onLive(revealed && inView);
    },
    { threshold: [0, 0.2] },
  );
  io.observe(host);

  if (finePointer && !reduced) {
    window.addEventListener("pointermove", onMove, { passive: true });
  }

  resize();
  pollFont();

  return {
    refresh: () => renderOnce(),
    dispose: () => {
      disposed = true;
      stopLoop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      disposeObject(scene);
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

interface AboutSceneProps {
  className?: string;
  githubImageSrc?: string;
}

export const AboutScene: React.FC<AboutSceneProps> = ({
  className,
  githubImageSrc = GITHUB_IMAGE_SRC,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const shotRef = useRef(0);

  const [shot, setShot] = useState(0);
  const [tour, setTour] = useState(false);
  const [live, setLive] = useState(false);
  const [reduced] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    shotRef.current = shot;
    handleRef.current?.refresh();
  }, [shot]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let gone = false;
    const start = () => {
      if (handleRef.current || gone) return;
      handleRef.current = bootScene(host, {
        githubImageSrc,
        getShot: () => shotRef.current,
        onTour: (v) => {
          if (!gone) setTour(v);
        },
        onLive: (v) => {
          if (!gone) setLive(v);
        },
      });
    };

    let lazy: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === "undefined") {
      start();
    } else {
      lazy = new IntersectionObserver(
        (entries) => {
          if (entries.some((en) => en.isIntersecting)) {
            lazy?.disconnect();
            start();
          }
        },
        { rootMargin: "800px 0px" },
      );
      lazy.observe(host);
    }

    return () => {
      gone = true;
      lazy?.disconnect();
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [githubImageSrc]);

  useEffect(() => {
    if (!tour || !live || reduced) return;
    const timer = window.setTimeout(
      () => setShot((s) => (s + 1) % SHOT_COUNT),
      TOUR_MS,
    );
    return () => window.clearTimeout(timer);
  }, [tour, live, reduced, shot]);

  return (
    <>
      <div className={`${styles.root} ${className ?? ""}`} aria-hidden="true">
        <div ref={hostRef} className={styles.host} />
      </div>

      {tour && (
        <div className={styles.controls} role="group" aria-label="Choose view">
          {SHOTS.map((label, i) => (
            <button
              key={label}
              type="button"
              className={styles.dash}
              onClick={() => setShot(i)}
              aria-label={`Show ${label}`}
              aria-current={i === shot ? "true" : undefined}
            >
              <span className={styles.dashTrack}>
                {i === shot && (
                  <span
                    key={shot}
                    className={`${styles.dashFill} ${
                      !live || reduced ? styles.dashFillHeld : ""
                    }`}
                    style={{ animationDuration: `${TOUR_MS}ms` }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default AboutScene;
