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
import type { ThemeMode } from "./sceneParts";

/* ═══════════════════════════ TUNING ═══════════════════════════════════════ */
const FOG_COLOR = 0x121214;

/* ── dark / light look of the scene (switches with the site theme) ──
   Dark = the original look. Light = a white street: same city, same camera. */
const LOOK = {
  dark: {
    bg: 0x121214,
    exposure: 0.95,
    hemiSky: 0x59606c,
    hemiGround: 0x0a0a0b,
    hemi: 0.55,
    env: 0.3,
    key: 2.4,
    rim: 1.1,
  },
  light: {
    bg: 0xf3f4f6, // keep in sync with --hero-bg (light) in Hero.module.css
    exposure: 1.0,
    hemiSky: 0xffffff,
    hemiGround: 0xc4c7ce,
    hemi: 1.15,
    env: 0.55,
    key: 2.2,
    rim: 0.7,
  },
} as const;
const FOG_DENSITY = 0.017; // same haze as AboutScene (was 0.019: swallowed distant detail)
const FOG_START_DENSITY = 0.085;
const START_POS = new THREE.Vector3(9, 14, 48);
const START_TARGET = new THREE.Vector3(0, 1.2, -14);
const END_POS = new THREE.Vector3(0.5, 1.8, 20);
const END_TARGET = new THREE.Vector3(0, 2.4, -10);
const MOBILE_SHIFT = 0.12;
const PARALLAX_X = 0.9;
const PARALLAX_Y = 0.35;
const REDUCED_T = 100;

/* ── quality / performance tuning ──
   Same policy as AboutScene: render at the screen's own pixel density (capped),
   keep MSAA on, and NEVER go below native resolution on a real GPU. If the
   machine is slow, the loop first settles at an even 30 fps; only after that can
   the resolution come down, in small steps, and never below native pixels. */
const MAX_DPR_DESKTOP = 1.5;
const MAX_DPR_MOBILE = 1.25;
const NO_MSAA_MIN_DPR = 1.25; // if the browser refuses MSAA, render this much denser instead
const DPR_STEP = 0.85; // each governor step lowers the render scale by 15 %
const TARGET_FPS = 60;
const SHADOW_FREEZE_T = 3.4;
const SHADOW_EVERY = 3; // during the intro, refresh the shadow map every Nth frame
const ADAPT_AFTER_T = 4.4; // the governor stays out of the way until the intro is over
const GOV_WINDOW = 45; // frames averaged per governor decision
const GOV_SETTLE = 8; // frames ignored after start / after a change
const SLOW_FACTOR = 1.45; // a window is "slow" above this x the expected frame time
const MAX_ANISOTROPY = 16; // texture sharpness at grazing angles (windows, road, billboard)
const COMPILE_TIMEOUT_MS = 2500;

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

/**
 * True when the browser runs WebGL on the CPU (SwiftShader / llvmpipe / "Basic
 * Render Driver"). That is what you get when hardware acceleration is switched
 * off in Chrome / Brave or the GPU is blocklisted — the #1 reason a 3D hero
 * crawls at 3–10 fps on an otherwise fine PC.
 */
const isSoftwareGL = () => {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") ||
      c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = info
      ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
      : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /swiftshader|llvmpipe|softpipe|swrast|software rasterizer|basic render/i.test(
      name,
    );
  } catch {
    return false;
  }
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
    const softwareGL = isSoftwareGL();

    const deviceDpr = window.devicePixelRatio || 1;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !softwareGL,
        alpha: false, // opaque canvas: the browser never has to blend it with the page
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
    renderer.setClearColor(FOG_COLOR, 1); // canvas matches the hero until frame 1
    renderer.domElement.className = styles.canvas;
    host.appendChild(renderer.domElement);

    /* Did the browser really give us MSAA? Chrome / Brave can silently refuse it on
       some GPUs / drivers, and that is exactly the "jagged staircase" look. When it
       is missing, the canvas is drawn denser instead, so the browser's downscale
       smooths the edges. */
    const msaa = !!renderer.getContext().getContextAttributes()?.antialias;
    const aaMinDpr = softwareGL || msaa ? 0 : NO_MSAA_MIN_DPR;

    /* ── resolution state ── */
    const dprMax = small ? MAX_DPR_MOBILE : MAX_DPR_DESKTOP;
    let dprCap = softwareGL ? 0.75 : dprMax;
    // lowest render scale the governor may ever use: native pixels on a real GPU
    const dprFloor = softwareGL
      ? 0.5
      : msaa
        ? Math.min(1, deviceDpr)
        : Math.min(aaMinDpr, dprMax);
    const effDpr = () =>
      Math.min(Math.max(window.devicePixelRatio || 1, aaMinDpr), dprCap);
    let lastW = 0;
    let lastH = 0;
    let lastDpr = 0;
    let ready = false; // shaders compiled + first frame uploaded

    const applySize = (w: number, h: number) => {
      const dpr = effDpr();
      if (w === lastW && h === lastH && dpr === lastDpr) return;
      lastW = w;
      lastH = h;
      lastDpr = dpr;
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      if (!ready) renderer.clear(); // resizing wipes the canvas: keep it hero-coloured
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(FOG_COLOR);
    const fog = new THREE.FogExp2(FOG_COLOR, FOG_START_DENSITY);
    scene.fog = fog;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    let envTexture = pmrem.fromScene(room, 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.3;

    const hemi = new THREE.HemisphereLight(0x59606c, 0x0a0a0b, 0.55);
    scene.add(hemi);

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
    key.shadow.radius = 1.5; // softens the shadow-map stair-steps (frozen after the intro: free)
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

    /* ── sharpness that costs (almost) nothing per frame ──
     * 1. anisotropic filtering at the GPU's maximum (windows, road, paving and the
     *    billboard stay crisp at the grazing angles of the street view);
     * 2. dithering on the lit materials: kills the 8-bit banding in the dark fog /
     *    shadow gradients (the "blocky dark smears"). Invisible noise of 1/255. */
    const maxAniso = softwareGL
      ? 2
      : Math.min(
          small ? 8 : MAX_ANISOTROPY,
          renderer.capabilities.getMaxAnisotropy(),
        );
    const sharpen = () => {
      const bt = billboard.panelMat.map;
      if (bt && bt.anisotropy < maxAniso) bt.anisotropy = maxAniso;
      [...roadParts.textures, ...city.textures].forEach((t) => {
        if (t.anisotropy > 1 && t.anisotropy < maxAniso)
          t.anisotropy = maxAniso;
      });
    };
    scene.traverse((o) => {
      const mat = (o as THREE.Mesh).material as
        | THREE.Material
        | THREE.Material[]
        | undefined;
      if (!mat) return;
      (Array.isArray(mat) ? mat : [mat]).forEach((m) => {
        if ((m as THREE.MeshStandardMaterial).isMeshStandardMaterial)
          m.dithering = true;
      });
    });

    /* ═════════════ site theme → scene look ═════════════
     * The scene follows the same data-theme attribute the rest of the site uses
     * (ThemeToggle). It watches the attribute itself, so no props / other
     * components had to change. Anything that is not "dark" counts as light. */
    const themeSetters = [
      roadParts.setTheme,
      roadText.setTheme,
      letters.setTheme,
      city.setTheme,
    ];
    let themeMode: ThemeMode = "dark";
    const readTheme = (): ThemeMode => {
      const v =
        host.closest("[data-theme]")?.getAttribute("data-theme") ??
        document.documentElement.getAttribute("data-theme") ??
        document.body?.getAttribute("data-theme");
      return v === "dark" ? "dark" : "light";
    };
    const applyTheme = (mode: ThemeMode) => {
      themeMode = mode;
      const look = LOOK[mode];
      (scene.background as THREE.Color).setHex(look.bg);
      fog.color.setHex(look.bg);
      renderer.setClearColor(look.bg, 1);
      renderer.toneMappingExposure = look.exposure;
      hemi.color.setHex(look.hemiSky);
      hemi.groundColor.setHex(look.hemiGround);
      hemi.intensity = look.hemi;
      scene.environmentIntensity = look.env;
      key.intensity = look.key;
      rim.intensity = look.rim;
      themeSetters.forEach((set) => set(mode));
      sharpen();
    };
    applyTheme(readTheme());

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
    let wantReveal = false; // the page asked for the reveal (loader finished)
    let shadowsPrimed = false;
    let shadowsFrozen = false;
    let shadowTick = 0;
    const shadowEvery = softwareGL ? SHADOW_EVERY * 2 : SHADOW_EVERY;

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

      // PERF: the shadow map used to be re-rendered EVERY frame of the intro
      // (2048² + every caster, twice the work per frame). The only moving
      // casters are the 5 letters growing, so every 3rd frame looks identical.
      if (!shadowsPrimed) {
        renderer.shadowMap.needsUpdate = true;
        shadowsPrimed = true;
        if (t >= SHADOW_FREEZE_T) shadowsFrozen = true;
      } else if (t >= 0 && t < SHADOW_FREEZE_T) {
        if (shadowTick++ % shadowEvery === 0)
          renderer.shadowMap.needsUpdate = true;
      } else if (t >= SHADOW_FREEZE_T && !shadowsFrozen) {
        renderer.shadowMap.needsUpdate = true;
        shadowsFrozen = true;
      }
    };

    /* ═════════════ run / pause logic ═════════════
     * The loop only runs while ALL of these are true: the scene is warmed up,
     * the reveal has started, the hero is in the viewport, and no later section
     * is covering it. (The hero is `position: sticky`, so IntersectionObserver
     * alone says "visible" for the whole page scroll and the canvas kept
     * rendering behind your content.) */
    let raf = 0;
    let running = false;
    let inView = true;
    let covered = false;
    let contextLost = false;
    let lastFrame = 0; // time of the last frame that was drawn
    let lastTick = 0; // time of the last requestAnimationFrame callback
    let vsyncMs = 1000 / 60; // shortest rAF interval seen = the screen's refresh interval
    let frameMs = 1000 / TARGET_FPS;

    /* ═════════════ adaptive quality governor (same idea as AboutScene) ═════════════
     * Stays completely out of the way during the intro, so the resolution never
     * flickers between sharp and soft. Afterwards it only reacts to a machine that
     * is REALLY struggling (two slow windows in a row), and only ever goes down:
     *   1. settle at an even 30 fps (looks the same, half the work, still sharp);
     *   2. only if that is still too slow, lower the render scale in 15 % steps,
     *      never below the screen's native pixels.
     * There is no "probing back up": that was what made the picture breathe
     * between crisp and blurry. */
    let govSum = 0;
    let govN = 0;
    let govSkip = GOV_SETTLE;
    let slowWindows = 0;
    if (softwareGL) frameMs = 1000 / 30;

    const setCap = (cap: number) => {
      dprCap = cap;
      govSkip = GOV_SETTLE;
      applySize(lastW, lastH);
    };
    const govReset = () => {
      govSum = 0;
      govN = 0;
      govSkip = GOV_SETTLE;
      slowWindows = 0;
    };

    const govern = (dt: number, t: number) => {
      if (reduced) return;
      if (t < ADAPT_AFTER_T) {
        govSum = 0;
        govN = 0;
        return;
      }
      if (govSkip > 0) {
        govSkip--;
        return;
      }
      if (dt > 250) {
        // tab switch / GC pause / resize hitch: not a real measurement
        govSum = 0;
        govN = 0;
        return;
      }
      govSum += dt;
      govN++;
      if (govN < GOV_WINDOW) return;
      const mean = govSum / govN;
      govSum = 0;
      govN = 0;

      const expected = Math.max(frameMs, vsyncMs);
      if (mean <= expected * SLOW_FACTOR) {
        slowWindows = 0;
        return;
      }
      // a single slow window can be a hiccup: act at once only when it is very slow
      if (mean < expected * 2 && ++slowWindows < 2) return;
      slowWindows = 0;

      if (frameMs < 30) {
        frameMs = 1000 / 30; // step 1: even 30 fps
        govSkip = GOV_SETTLE;
      } else if (effDpr() > dprFloor + 0.01) {
        setCap(Math.max(dprFloor, effDpr() * DPR_STEP)); // step 2: gently, never below native
      }
    };

    function renderOnce() {
      if (running || disposed || !ready || contextLost) return;
      update(performance.now());
      renderer.render(scene, camera);
    }
    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      // learn the screen's refresh interval, so 75 / 90 / 100 / 144 Hz screens are
      // paced evenly instead of being cut down to every 2nd or 3rd refresh
      const tick = now - lastTick;
      lastTick = now;
      if (tick > 5 && tick < vsyncMs) vsyncMs = tick;
      const elapsed = now - lastFrame;
      if (elapsed < frameMs - Math.max(0.75, vsyncMs * 0.5)) return;
      lastFrame = now;
      govern(elapsed, getT(now));
      update(now);
      renderer.render(scene, camera);
    };
    const startLoop = () => {
      if (running || disposed || reduced) return;
      running = true;
      lastFrame = 0;
      lastTick = 0;
      govReset();
      raf = requestAnimationFrame(frame);
    };
    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const sync = () => {
      const go =
        ready &&
        revealStart !== null &&
        inView &&
        !covered &&
        !contextLost &&
        !reduced;
      if (go) startLoop();
      else stopLoop();
    };
    const beginReveal = () => {
      if (reduced || revealStart !== null) return;
      revealStart = performance.now();
      sync();
    };

    /* ═════════════ is a later section sitting on top of the hero? ═════════════ */
    const section = host.parentElement;
    const isCovered = () => {
      if (!section) return false;
      const next = (section.nextElementSibling ??
        section.parentElement?.nextElementSibling) as HTMLElement | null;
      if (!next) return false;
      const r = next.getBoundingClientRect();
      if (r.top > 0 || r.bottom < window.innerHeight) return false;
      const hit = document.elementFromPoint(
        window.innerWidth / 2,
        window.innerHeight / 2,
      );
      return !!hit && !section.contains(hit);
    };
    let coverCheckQueued = false;
    const queueCoverCheck = () => {
      if (coverCheckQueued || disposed) return;
      coverCheckQueued = true;
      requestAnimationFrame(() => {
        coverCheckQueued = false;
        if (disposed) return;
        const c = isCovered();
        if (c !== covered) {
          covered = c;
          sync();
        }
      });
    };

    /* ═════════════ GPU context loss (the "crash") ═════════════ */
    const onContextLost = (e: Event) => {
      e.preventDefault(); // allows the browser to hand the context back
      contextLost = true;
      stopLoop();
    };
    const onContextRestored = () => {
      contextLost = false;
      try {
        // render targets lose their pixels: rebuild the lighting env + shadow map
        envTexture.dispose();
        envTexture = pmrem.fromScene(room, 0.04).texture;
        scene.environment = envTexture;
      } catch {
        /* the scene still renders without the soft env light */
      }
      shadowsPrimed = false;
      shadowsFrozen = false;
      renderer.shadowMap.needsUpdate = true;
      renderOnce(); // paints one frame right away when the loop is paused
      sync();
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener(
      "webglcontextrestored",
      onContextRestored,
    );

    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    // repaint immediately when the theme flips (works while the loop is paused too)
    const onThemeChange = () => {
      const mode = readTheme();
      if (mode === themeMode) return;
      applyTheme(mode);
      if (ready && !contextLost && !disposed) {
        update(performance.now());
        renderer.render(scene, camera);
      }
    };
    const themeObserver = new MutationObserver(onThemeChange);
    const themeNodes = new Set<Element>(
      [
        document.documentElement,
        document.body,
        host.closest("[data-theme]"),
      ].filter((n): n is Element => !!n),
    );
    themeNodes.forEach((n) =>
      themeObserver.observe(n, {
        attributes: true,
        attributeFilter: ["data-theme"],
      }),
    );

    // Draw the other palette's textures while the browser is idle (long after
    // the intro) so the first toggle is instant. Nothing is uploaded to the GPU
    // by this: the textures are only drawn, then swapped straight back.
    const preloadTimer = window.setTimeout(() => {
      const run = () => {
        if (disposed || themeMode !== "dark") return;
        themeSetters.forEach((set) => set("light"));
        themeSetters.forEach((set) => set("dark"));
        sharpen();
      };
      const ric = (
        window as unknown as {
          requestIdleCallback?: (
            cb: () => void,
            o?: { timeout: number },
          ) => void;
        }
      ).requestIdleCallback;
      if (ric) ric(run, { timeout: 4000 });
      else run();
    }, 8000);

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    io.observe(host);

    window.addEventListener("scroll", queueCoverCheck, { passive: true });
    window.addEventListener("resize", queueCoverCheck, { passive: true });
    const coverHeartbeat = window.setInterval(queueCoverCheck, 1000);
    queueCoverCheck();

    if (finePointer && !reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
    }

    apiRef.current = {
      reveal: () => {
        if (reduced || wantReveal) return;
        wantReveal = true;
        if (ready) beginReveal();
      },
    };

    /* ═════════════ warm-up: no more freeze after the loader ═════════════
     * 1. compile every shader program OFF the main thread (compileAsync), so the
     *    page, the loader and the text reveal keep animating while it happens;
     * 2. draw one real frame (uploads all textures/geometry, builds the first
     *    shadow map, compiles the shadow programs);
     * 3. only then is the reveal allowed to start, so the fly-in begins on a
     *    GPU that already has everything. Nothing renders in the meantime. */
    const prewarm = async () => {
      traffic.group.visible = true; // so the car materials are compiled too
      try {
        const c = renderer as unknown as {
          compileAsync?: (
            s: THREE.Object3D,
            cam: THREE.Camera,
          ) => Promise<unknown>;
        };
        if (typeof c.compileAsync === "function") {
          await Promise.race([
            c.compileAsync(scene, camera),
            new Promise((r) => window.setTimeout(r, COMPILE_TIMEOUT_MS)),
          ]);
        } else {
          renderer.compile(scene, camera);
        }
      } catch {
        /* not critical: the first frame compiles whatever is missing */
      }
      traffic.group.visible = false;
      if (disposed) return;

      ready = true;
      if (reduced) {
        renderOnce();
        return;
      }
      try {
        update(performance.now());
        traffic.group.visible = true;
        renderer.render(scene, camera);
        traffic.group.visible = false;
      } catch {
        /* not critical */
      }
      if (wantReveal) beginReveal();
      else sync();
    };

    resize();
    pollFont();
    void prewarm();

    return () => {
      disposed = true;
      apiRef.current = null;
      stopLoop();
      ro.disconnect();
      io.disconnect();
      window.clearInterval(coverHeartbeat);
      window.clearTimeout(preloadTimer);
      themeObserver.disconnect();
      window.removeEventListener("scroll", queueCoverCheck);
      window.removeEventListener("resize", queueCoverCheck);
      window.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        onContextLost,
      );
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        onContextRestored,
      );
      disposeObject(scene);
      [...roadParts.textures, ...city.textures].forEach((t) => t.dispose());
      (room as unknown as { dispose?: () => void }).dispose?.();
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
