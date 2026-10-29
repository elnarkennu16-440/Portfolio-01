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

/* ═══════════════════════════ TUNING ═══════════════════════════════════════ */
const FOG_COLOR = 0x121214;
const FOG_DENSITY = 0.019;
const FOG_START_DENSITY = 0.085;
const START_POS = new THREE.Vector3(9, 14, 48);
const START_TARGET = new THREE.Vector3(0, 1.2, -14);
const END_POS = new THREE.Vector3(0.5, 1.8, 20);
const END_TARGET = new THREE.Vector3(0, 2.4, -10);
const MOBILE_SHIFT = 0.12;
const PARALLAX_X = 0.9;
const PARALLAX_Y = 0.35;
const REDUCED_T = 100;

/* ── performance tuning ── */
const MAX_DPR_DESKTOP = 1.5;
const MAX_DPR_MOBILE = 1.25;
const MIN_DPR = 1;
const TARGET_FPS = 60;
const SHADOW_FREEZE_T = 3.4;
const ADAPT_AFTER_T = 4.5;
const SLOW_FRAME_MS = 22;
const ADAPT_WINDOW = 90;

const BASE_TAN_V = Math.tan(THREE.MathUtils.degToRad(17));
const TAN_H = BASE_TAN_V * (16 / 9);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (t: number, start: number, dur: number) =>
  clamp01((t - start) / dur);
const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));

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
      return;
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

    const rim = new THREE.DirectionalLight(0x8e95a3, 1.1);
    rim.position.set(30, 14, -40);
    scene.add(rim);

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

    letters.plinth.scale.x = 0.001;
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

    const camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.5, 320);
    const endPos = END_POS.clone();
    const camPos = new THREE.Vector3();
    const camTarget = new THREE.Vector3();
    const pointer = { x: 0, y: 0, cx: 0, cy: 0 };

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
      const aspect = w / h;
      camera.aspect = aspect;

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
      billboard.group.visible = aspect >= 0.95;
      renderOnce();
    };

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
      // Tinanggal ang scrollP dependency rito para maiwasan ang layout thrashing/lag sa desktop
      camera.position.copy(camPos);
      camera.lookAt(camTarget);

      letters.plinth.scale.x = Math.max(0.001, easeOutExpo(seg(t, 0.5, 0.9)));
      letters.letters.forEach((m, i) => {
        const p = seg(t, 0.8 + i * 0.16, 1.3);
        m.scale.y = Math.max(0.001, easeOutExpo(p));
      });
      const settle = seg(t, 0.8, 2.6);
      letters.material.emissiveIntensity =
        0.04 + (1 - settle) * 0.5 * (t > 0.8 ? 1 : 0);

      const dashes = Math.floor(
        easeOutCubic(seg(t, 0.3, 2.4)) * roadParts.dashCount,
      );
      roadParts.dashes.geometry.setDrawRange(0, dashes * 6);
      roadText.material.opacity = 0.78 * seg(t, 1.8, 0.9);

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

      const f = flicker(t, 1.6);
      billboard.panelMat.emissiveIntensity = f * 1.0;
      billboard.spot.intensity = f * 160;
      lamps.glowMat.opacity = 0.55 * seg(t, 1.4, 1.4);

      traffic.group.visible = t > 2.2;
      if (traffic.group.visible) traffic.update(reduced ? 0 : t);

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
    let inView = true;
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
        if (inView) startLoop();
        else stopLoop();
      },
      { threshold: 0 },
    );
    io.observe(host);

    if (finePointer && !reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
    }

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
