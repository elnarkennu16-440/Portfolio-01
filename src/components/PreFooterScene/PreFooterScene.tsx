import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import styles from "./PreFooterScene.module.css";
import {
  BOTTLE,
  SCENE,
  buildBillboard,
  buildBottle,
  buildGround,
  buildProps,
  buildTruck,
  disposeObject,
  mulberry32,
} from "./preFooterParts";
import type { EnvUser, TexStore, ThemeMode } from "./preFooterParts";
import { buildCallouts } from "./preFooterCallouts";
import type { Callouts } from "./preFooterCallouts";
import { buildToolRain } from "./preFooterTools";
import type { ToolRain } from "./preFooterTools";

/* ═══════════════════════════ TUNING ═══════════════════════════════════════ */
const BG = 0x0b0b0d; // same as the banner section background
const FOG_DENSITY = 0.011;
const FOG_START_DENSITY = 0.02; // light haze: the scene is visible from the very first frame
const FOV = 30;
const EXPOSURE = 0.95;
const KEY_INTENSITY = 2.4;
const RIM_INTENSITY = 1.1;

/* dark = the original look. light = a white street (same camera, same objects),
   same recipe as the hero scene's light mode. */
const LOOK = {
  dark: {
    bg: 0x0b0b0d,
    exposure: 0.95,
    hemiSky: 0x59606c,
    hemiGround: 0x0a0a0b,
    hemi: 0.55,
    env: 0.3,
    key: 2.4,
    rim: 1.1,
  },
  light: {
    bg: 0xf3f4f6, // keep in sync with the light background in PreFooterScene.module.css
    exposure: 1.0,
    hemiSky: 0xffffff,
    hemiGround: 0xc4c7ce,
    hemi: 1.15,
    env: 0.55,
    key: 2.2,
    rim: 0.7,
  },
} as const;

/* where the scene sits inside the banner (fractions of the banner box) */
const DESKTOP_TEXT_PX = 560; // width kept free for the text on the left
const DESKTOP_CENTER_Y = 0.5;
const DESKTOP_FILL_Y = 0.84; // how much of the banner height the scene may use
const MOBILE_CENTER_Y = 0.3; // portrait: the scene lives in the top part
const MOBILE_FILL_Y = 0.44;

const PARALLAX_X = 0.9;
const PARALLAX_Y = 0.35;

/* reveal: the camera starts high, to the left and looking down at the street, then
   curves round and tilts up into its normal position (about 4 s) */
const REVEAL_CAM_S = 4.0; // seconds the camera arc lasts
const ARC_YAW = -0.6; // radians: how far to the left it starts
const ARC_PITCH = 0.36; // radians: how much higher it starts (looks down)
const ARC_DIST = 0.28; // starts 28 % further away
const ARC_LOOK = 1.5; // metres: it starts looking a little below the target

/* after the arc: a slow zoom-in on the pour (bottle neck -> hatch), so the falling
   tool tiles are clearly visible. The zoom is limited so the bottle, the truck and
   every label still fit on screen (desktop and mobile). */
const ZOOM_START = 3.0; // s: starts while the arc is still landing (no stop between the two)
const ZOOM_S = 2.3; // s: how long the zoom takes
const ZOOM_MAX = 1.5; // never zoom more than this
// the area that must stay on screen, in metres around the zoom target
const ZOOM_LEFT = 7.4;
const ZOOM_RIGHT = 7.0;
const ZOOM_UP = 4.8;
const ZOOM_DOWN = 4.8;
const REDUCED_T = 100;

/* quality / performance */
const MAX_DPR_DESKTOP = 1.5;
const MAX_DPR_MOBILE = 1.2;
const NO_MSAA_MIN_DPR = 1.25;
const DPR_STEP = 0.85;
const TARGET_FPS = 60;
const SHADOW_FREEZE_T = 1.5;
const SHADOW_EVERY = 3;
const ADAPT_AFTER_T = 5.8; // the quality governor waits until the camera has landed and zoomed
const SCROLL_THROTTLE_AFTER_T = 5.6; // while scrolling (after the reveal) draw at 30 fps
const GOV_WINDOW = 45;
const GOV_SETTLE = 8;
const SLOW_FACTOR = 1.45;
const MAX_ANISOTROPY = 16;
const COMPILE_TIMEOUT_MS = 12000; // only a safety net: we really wait for the compile

/* boot / teardown distances (in screen heights from the banner) */
// FIX (blank on arrival): it now starts building 4 screens ahead (was 2.5) and is only
// released 8 screens away (was 6), so a normal scroll never reaches the banner before it is built.
const BOOT_MARGIN = "400%";
const RETIRE_MARGIN = "800%";
// the reveal starts as soon as this much of the banner peeks in (was 12 %)
const REVEAL_RATIO = 0.06;
// FIX (reveal played again and again): the reveal is shown ONCE per visit. If the scene is
// released (far away) and built again later, it comes back already finished.
const DONE_AFTER_MS = 600000;
let hasRevealed = false;

const TAN_HALF = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const TARGET = new THREE.Vector3(SCENE.cx, SCENE.cy, 1);
const VIEW_DIR = new THREE.Vector3(-0.14, -0.025, 1).normalize();
const YAW_END = Math.atan2(VIEW_DIR.x, VIEW_DIR.z);
const PITCH_END = Math.asin(VIEW_DIR.y);
// what the camera looks at once it has zoomed in: between the bottle neck and the hatch
const ZOOM_TARGET = new THREE.Vector3(4.2, 7.6, 1.85);

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const seg = (t: number, start: number, dur: number) =>
  clamp01((t - start) / dur);
const easeArc = (x: number) => 1 - Math.pow(1 - x, 2.3); // steady sweep with a soft landing
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeOutBack = (x: number, c1 = 1.5) => {
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

interface IdleWindow {
  requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
}

/** Waits for a quiet moment, so building the scene never competes with scrolling. */
const idleRaw = () =>
  new Promise<void>((resolve) => {
    const w = window as unknown as IdleWindow;
    if (w.requestIdleCallback)
      w.requestIdleCallback(() => resolve(), { timeout: 120 });
    else window.setTimeout(resolve, 24);
  });

/** yields exactly one frame (used while the banner is close: no waiting for "idle") */
const oneFrame = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => window.setTimeout(resolve, 0)),
  );

/** True when WebGL runs on the CPU (SwiftShader / llvmpipe): hardware acceleration is off. */
let softwareGLCache: boolean | null = null;
const isSoftwareGL = () => {
  if (softwareGLCache !== null) return softwareGLCache;
  let result = false;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") ||
      c.getContext("webgl")) as WebGLRenderingContext | null;
    if (gl) {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const name = info
        ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
        : "";
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      result =
        /swiftshader|llvmpipe|softpipe|swrast|software rasterizer|basic render/i.test(
          name,
        );
    }
  } catch {
    result = false;
  }
  softwareGLCache = result;
  return result;
};

interface Parts {
  billboard: ReturnType<typeof buildBillboard>;
  bottle: ReturnType<typeof buildBottle>;
  truck: ReturnType<typeof buildTruck>;
  tools: ToolRain;
  callouts: Callouts;
  envUsers: EnvUser[];
  setters: Array<(mode: ThemeMode) => void>;
}

/* ═══════════════════════════ THE SCENE ════════════════════════════════════
 * Returns a dispose function immediately; the scene itself is built in small
 * slices (each one waits for an idle moment) and only becomes "ready" once
 * every shader is compiled and every texture is on the GPU. Until then nothing
 * is drawn and nothing blocks the page. */

function createScene(host: HTMLDivElement): () => void {
  let disposed = false;

  /* far away: wait for a quiet moment (never compete with scrolling).
     Banner already close (about to be seen): only yield one frame, so the build
     is finished by the time the visitor arrives. */
  const idle = () => {
    const r = host.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const near = r.top < vh * 1.6 && r.bottom > -vh * 0.5;
    return near ? oneFrame() : idleRaw();
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      alpha: false,
      stencil: false,
      powerPreference: "high-performance",
    });
  } catch {
    return () => undefined;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = EXPOSURE;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.setClearColor(BG, 1);
  renderer.domElement.className = styles.canvas;
  // the canvas fades in when the reveal starts (no pop, no blank flash)
  renderer.domElement.style.opacity = "0";
  renderer.domElement.style.transition = "opacity 0.25s ease";
  host.appendChild(renderer.domElement);

  /* MSAA check: if the browser silently refuses it, render denser instead */
  const msaa = !!renderer.getContext().getContextAttributes()?.antialias;
  const aaMinDpr = softwareGL || msaa ? 0 : NO_MSAA_MIN_DPR;
  const dprMax = small ? MAX_DPR_MOBILE : MAX_DPR_DESKTOP;
  let dprCap = softwareGL ? 0.75 : dprMax;
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
  let ready = false;

  const applySize = (w: number, h: number) => {
    const dpr = effDpr();
    if (w === lastW && h === lastH && dpr === lastDpr) return;
    lastW = w;
    lastH = h;
    lastDpr = dpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    if (!ready) renderer.clear();
  };

  /* ── scene, fog, lights (cheap: nothing touches the GPU until the first render) ── */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  const fog = new THREE.FogExp2(BG, FOG_START_DENSITY);
  scene.fog = fog;
  scene.environmentIntensity = 0.3;

  const hemi = new THREE.HemisphereLight(0x59606c, 0x0a0a0b, 0.55);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xcfd5df, KEY_INTENSITY);
  key.position.set(-24, 32, 28);
  key.target.position.set(1, 2, 1);
  key.castShadow = true;
  key.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  key.shadow.camera.left = -26;
  key.shadow.camera.right = 26;
  key.shadow.camera.top = 26;
  key.shadow.camera.bottom = -26;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 120;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  key.shadow.radius = 1.5;
  scene.add(key, key.target);

  const rim = new THREE.DirectionalLight(0x8e95a3, RIM_INTENSITY);
  rim.position.set(30, 14, -40);
  scene.add(rim);

  const pmrem = new THREE.PMREMGenerator(renderer);
  let room: RoomEnvironment | null = null;
  let envTexture: THREE.Texture | null = null;
  const store: TexStore = [];
  let parts: Parts | null = null;

  /* ── site theme → scene look ──
     Follows the same data-theme attribute the rest of the site uses (ThemeToggle),
     by watching the attribute itself: no props / other components had to change. */
  const initTex = (
    renderer as unknown as { initTexture?: (t: THREE.Texture) => void }
  ).initTexture?.bind(renderer);
  const readTheme = (): ThemeMode => {
    const v =
      host.closest("[data-theme]")?.getAttribute("data-theme") ??
      document.documentElement.getAttribute("data-theme") ??
      document.body?.getAttribute("data-theme");
    return v === "light" ? "light" : "dark";
  };
  let themeMode: ThemeMode = "dark";
  const applyBase = (mode: ThemeMode) => {
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
  };
  const applyTheme = (mode: ThemeMode) => {
    applyBase(mode);
    const P = parts;
    if (!P) return;
    P.setters.forEach((set) => set(mode));
    P.callouts.setTheme(mode);
  };
  applyBase(readTheme());

  /* ── camera: fits the scene into the free part of the banner ── */
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 1, 260);
  const camPos = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  const pointer = { x: 0, y: 0, cx: 0, cy: 0 };
  let fitDist = 34;
  let zoomK = 1; // how much closer the camera ends up (see ZOOM_*)

  const resize = () => {
    if (disposed) return;
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    applySize(w, h);
    const aspect = w / h;
    camera.aspect = aspect;

    const mobile = w < 768;
    // fx / fy: the share of the banner width / height the scene may occupy
    const fx = mobile ? 1 : clamp(1 - DESKTOP_TEXT_PX / w, 0.5, 0.7);
    const fy = mobile ? MOBILE_FILL_Y : DESKTOP_FILL_Y;
    fitDist = Math.max(
      SCENE.w / (fx * aspect * 2 * TAN_HALF),
      SCENE.h / (fy * 2 * TAN_HALF),
    );
    // where its centre should land on screen: right side on desktop, top on mobile
    const cx = mobile ? 0.5 : 1 - fx / 2;
    const cy = mobile ? MOBILE_CENTER_Y : DESKTOP_CENTER_Y;
    // how far we may zoom in: the pour area (bottle + labels + hatch) must still fit
    // on screen around the zoom target, which sits at (cx, cy) on screen
    const pxPerM = h / (2 * fitDist * TAN_HALF);
    const zoomLimit = Math.min(
      (cx * w - 12) / ZOOM_LEFT,
      ((1 - cx) * w - 12) / ZOOM_RIGHT,
      (fy * h * 0.5) / ZOOM_UP,
      (fy * h * 0.5) / ZOOM_DOWN,
    );
    zoomK = clamp(zoomLimit / pxPerM, 1, ZOOM_MAX);
    camera.setViewOffset(
      w,
      h,
      Math.round((0.5 - cx) * w),
      Math.round((0.5 - cy) * h),
      w,
      h,
    );
    camera.updateProjectionMatrix();

    // callouts: lay them out from the camera's final pose, so they never overlap
    // each other and never leave the screen (update() restores the live pose)
    if (parts) {
      camPos
        .copy(VIEW_DIR)
        .multiplyScalar(fitDist / zoomK)
        .add(ZOOM_TARGET);
      camera.position.copy(camPos);
      camera.lookAt(ZOOM_TARGET);
      camera.updateMatrixWorld(true);
      parts.callouts.layout({
        camera,
        w,
        h,
        mobile,
        fontPx: mobile ? 11 : clamp(w / 105, 12, 14),
      });
    }
    renderOnce();
  };

  /* ── reveal timeline ── */
  let revealStart: number | null = reduced
    ? -1
    : hasRevealed
      ? performance.now() - DONE_AFTER_MS
      : null;
  let wantReveal = false;
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
    const P = parts;
    if (!P) return;
    const t = getT(now);
    const time = now * 0.001;

    fog.density = THREE.MathUtils.lerp(
      FOG_START_DENSITY,
      FOG_DENSITY,
      easeOutCubic(seg(t, 0, 3.2)),
    );

    // camera: a curved fly-in (swing round + tilt up + move closer), then parallax.
    // `a` = how much of the arc is still to travel (1 at the start → 0 when it lands)
    const e = easeArc(seg(t, 0, REVEAL_CAM_S));
    const a = 1 - e;
    const yaw = YAW_END + ARC_YAW * a;
    const pitch = PITCH_END + ARC_PITCH * a;
    // then (while the arc is still landing) a slow zoom-in on the pour
    const zt = easeInOutCubic(seg(t, ZOOM_START, ZOOM_S));
    const dist = (fitDist * (1 + ARC_DIST * a)) / (1 + (zoomK - 1) * zt);
    const cp = Math.cos(pitch);
    camTarget.lerpVectors(TARGET, ZOOM_TARGET, zt);
    camPos
      .set(
        Math.sin(yaw) * cp * dist,
        Math.sin(pitch) * dist,
        Math.cos(yaw) * cp * dist,
      )
      .add(camTarget);
    camTarget.y -= ARC_LOOK * a;
    if (!reduced) {
      pointer.cx += (pointer.x - pointer.cx) * 0.05;
      pointer.cy += (pointer.y - pointer.cy) * 0.05;
      camPos.x +=
        pointer.cx * PARALLAX_X * e + Math.sin(now * 0.00012) * 0.3 * e;
      camPos.y +=
        -pointer.cy * PARALLAX_Y * e + Math.sin(now * 0.00009) * 0.06 * e;
      camTarget.x += pointer.cx * 0.5 * e;
    }
    camera.position.copy(camPos);
    camera.lookAt(camTarget);

    // the bottle tips over and starts pouring
    P.bottle.pivot.rotation.z = THREE.MathUtils.lerp(
      BOTTLE.startAngle,
      BOTTLE.angle,
      easeOutBack(seg(t, 0.1, 1.0), 1.2),
    );

    // billboard lights flicker on
    const f = flicker(t, 0.15);
    P.billboard.panelMat.emissiveIntensity = f * P.billboard.look.panelEmissive;
    P.billboard.spot.intensity = f * P.billboard.look.spot;
    P.billboard.glowMat.opacity = P.billboard.look.glow * seg(t, 0.2, 0.7);
    P.truck.headMat.color.setScalar(0.12 + 0.88 * flicker(t, 0.4));

    // tool tiles pour out of the bottle and drop into the hatch (staggered)
    P.tools.update(t);

    // labels (2D overlay, anchored to the 3D bottle with the live camera)
    P.callouts.update(camera, t, time);

    // shadow map: refreshed every few frames while the bottle moves, then frozen
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

  /* ── run / pause logic: the loop only runs while the banner is on screen ── */
  let raf = 0;
  let running = false;
  let inView = false;
  let contextLost = false;
  let lastFrame = 0;
  let lastTick = 0;
  let vsyncMs = 1000 / 60;
  let frameMs = 1000 / TARGET_FPS;
  let lastScrollAt = 0;

  /* adaptive quality governor: 1) even 30 fps, 2) lower resolution, never below native.
     On phones the steady state (after the reveal) is 30 fps from the start. */
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
  const govern = (dtMs: number, t: number) => {
    if (reduced) return;
    if (t < ADAPT_AFTER_T) {
      govSum = 0;
      govN = 0;
      return;
    }
    if (small && frameMs < 30) {
      frameMs = 1000 / 30;
      govSkip = GOV_SETTLE;
      return;
    }
    if (govSkip > 0) {
      govSkip--;
      return;
    }
    if (dtMs > 250) {
      govSum = 0;
      govN = 0;
      return;
    }
    govSum += dtMs;
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
    if (mean < expected * 2 && ++slowWindows < 2) return;
    slowWindows = 0;
    if (frameMs < 30) {
      frameMs = 1000 / 30;
      govSkip = GOV_SETTLE;
    } else if (effDpr() > dprFloor + 0.01) {
      setCap(Math.max(dprFloor, effDpr() * DPR_STEP));
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
    const tick = now - lastTick;
    lastTick = now;
    if (tick > 5 && tick < vsyncMs) vsyncMs = tick;
    const t = getT(now);
    // while the page is being scrolled (after the reveal) draw at 30 fps, so the
    // scroll and the other sections' reveals always get the main thread first
    const scrolling = t > SCROLL_THROTTLE_AFTER_T && now - lastScrollAt < 160;
    const minMs = scrolling ? Math.max(frameMs, 1000 / 30) : frameMs;
    const elapsed = now - lastFrame;
    if (elapsed < minMs - Math.max(0.75, vsyncMs * 0.5)) return;
    lastFrame = now;
    govern(elapsed, t);
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
    if (ready && revealStart !== null && inView && !contextLost && !reduced)
      startLoop();
    else stopLoop();
  };
  const beginReveal = () => {
    if (reduced || revealStart !== null) return;
    revealStart = performance.now();
    hasRevealed = true;
    renderer.domElement.style.opacity = "1";
    sync();
  };

  /* ── GPU context loss ── */
  const onContextLost = (e: Event) => {
    e.preventDefault();
    contextLost = true;
    stopLoop();
  };
  const onContextRestored = () => {
    contextLost = false;
    try {
      if (room) {
        envTexture?.dispose();
        envTexture = pmrem.fromScene(room, 0.04).texture;
        scene.environment = envTexture;
        parts?.envUsers.forEach(([m, intensity]) => {
          m.envMap = envTexture;
          m.envMapIntensity = intensity;
          m.needsUpdate = true;
        });
      }
    } catch {
      /* the scene still renders without the soft reflections */
    }
    shadowsPrimed = false;
    shadowsFrozen = false;
    renderer.shadowMap.needsUpdate = true;
    renderOnce();
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
  const onScroll = () => {
    lastScrollAt = performance.now();
  };
  if (finePointer && !reduced) {
    window.addEventListener("pointermove", onMove, { passive: true });
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  const ro = new ResizeObserver(resize);
  ro.observe(host);

  /* visible → render; >= 12 % visible → start the reveal (same trigger as the text) */
  const io = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      const seen =
        entry.intersectionRatio >= REVEAL_RATIO ||
        entry.intersectionRect.height > window.innerHeight * 0.5;
      if (seen) wantReveal = true;
      // FIX: the reveal clock only starts while the banner is really on screen
      // (before, a scene that finished building off screen played its reveal unseen)
      if (inView && wantReveal && ready) beginReveal();
      sync();
    },
    { threshold: [0, REVEAL_RATIO] },
  );
  io.observe(host);

  // repaint immediately when the theme flips (works while the loop is paused too)
  const onThemeChange = () => {
    const mode = readTheme();
    if (mode === themeMode) return;
    const before = store.length;
    applyTheme(mode);
    if (initTex) for (let i = before; i < store.length; i++) initTex(store[i]); // first switch only
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

  /* ── boot: build in small slices, compile without blocking, upload early ── */
  const boot = async () => {
    await idle();
    if (disposed) return;

    // soft studio reflections for the chrome tank / glass
    room = new RoomEnvironment();
    envTexture = pmrem.fromScene(room, 0.04).texture;
    scene.environment = envTexture;
    await idle();
    if (disposed) return;

    const rand = mulberry32(20261031);
    const ground = buildGround(store, rand, small);
    scene.add(ground.group);
    await idle();
    if (disposed) return;

    const props = buildProps(store, rand);
    scene.add(props.group);
    const billboard = buildBillboard(store, small);
    scene.add(billboard.group);
    await idle();
    if (disposed) return;

    const bottle = buildBottle(store);
    const truck = buildTruck();
    const tools = buildToolRain(small);
    scene.add(bottle.rig, truck.group, tools.group);
    await idle();
    if (disposed) return;

    const envUsers: EnvUser[] = [...truck.envMats, ...bottle.envMats];
    envUsers.forEach(([m, intensity]) => {
      m.envMap = envTexture;
      m.envMapIntensity = intensity;
    });

    /* sharpness that costs nothing per frame: anisotropy + dithering (no banding) */
    const maxAniso = softwareGL
      ? 2
      : Math.min(
          small ? 8 : MAX_ANISOTROPY,
          renderer.capabilities.getMaxAnisotropy(),
        );
    store.forEach((t) => {
      if (t.anisotropy > 1) t.anisotropy = Math.min(t.anisotropy, maxAniso);
    });
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

    parts = {
      billboard,
      bottle,
      truck,
      tools,
      callouts: buildCallouts(host),
      envUsers,
      setters: [
        ground.setTheme,
        billboard.setTheme,
        bottle.setTheme,
        truck.setTheme,
      ],
    };
    applyTheme(readTheme()); // before the textures are uploaded
    resize(); // lays out the callouts too
    if (initTex) tools.prime(initTex, 6); // the first tiles are ready when the pour starts
    void tools.loadIcons(); // copies the icons from the Capabilities section (background)

    // upload the textures a couple at a time (one big upload would freeze a frame)
    const initTexture = initTex;
    if (initTexture) {
      for (let i = 0; i < store.length; i++) {
        initTexture(store[i]);
        if (i % 2 === 1) {
          await idle();
          if (disposed) return;
        }
      }
    }

    // compile every shader off the main thread and WAIT for it (no forced sync compile)
    parts.tools.warm(true); // so the tile materials are compiled too
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
    if (disposed) return;
    await idle();
    if (disposed) return;

    ready = true;
    try {
      update(performance.now()); // not revealed yet: hides the tiles again
      parts.tools.warm(true);
      renderer.render(scene, camera); // first real frame (invisible: the canvas is at opacity 0)
      parts.tools.warm(false);
    } catch {
      /* not critical */
    }
    if (reduced) {
      renderer.domElement.style.opacity = "1";
      renderOnce();
      return;
    }
    if (hasRevealed) {
      // rebuilt after a first visit: show the finished scene (no second reveal)
      renderer.domElement.style.opacity = "1";
      sync();
      return;
    }
    if (inView && wantReveal) beginReveal();
    else sync();
  };

  resize();
  void boot();

  return () => {
    disposed = true;
    stopLoop();
    ro.disconnect();
    io.disconnect();
    themeObserver.disconnect();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("scroll", onScroll);
    renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
    renderer.domElement.removeEventListener(
      "webglcontextrestored",
      onContextRestored,
    );
    parts?.callouts.dispose();
    parts?.tools.dispose();
    disposeObject(scene);
    store.forEach((t) => t.dispose());
    (room as unknown as { dispose?: () => void } | null)?.dispose?.();
    envTexture?.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}

/* ═══════════════════════════ REACT WRAPPER ════════════════════════════════
 * The WebGL scene is NOT created at page load (that would compete with the hero
 * intro). It starts building a few screens before the banner scrolls into view
 * (in idle slices, see above), and it is torn down again — the GPU context is
 * released — when the banner is far away, so the hero / about scenes and the
 * other sections never share memory with it for long. */

interface PreFooterSceneProps {
  className?: string;
}

export const PreFooterScene: React.FC<PreFooterSceneProps> = ({
  className,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const w = window as unknown as IdleWindow;
    let cancelled = false;
    let dispose: (() => void) | null = null;
    let idleId = 0;
    let timerId = 0;

    const start = () => {
      idleId = 0;
      timerId = 0;
      if (cancelled || dispose) return;
      dispose = createScene(host);
    };
    const stop = () => {
      if (idleId && w.cancelIdleCallback) w.cancelIdleCallback(idleId);
      if (timerId) window.clearTimeout(timerId);
      idleId = 0;
      timerId = 0;
      const d = dispose;
      dispose = null;
      if (d) {
        if (cancelled) d();
        else if (w.requestIdleCallback)
          w.requestIdleCallback(() => d(), { timeout: 1500 });
        else window.setTimeout(d, 200);
      }
    };

    const nearIO = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || dispose || idleId || timerId) return;
        if (w.requestIdleCallback)
          idleId = w.requestIdleCallback(start, { timeout: 800 });
        else timerId = window.setTimeout(start, 60);
      },
      { rootMargin: `${BOOT_MARGIN} 0px ${BOOT_MARGIN} 0px` },
    );
    const farIO = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) stop();
      },
      { rootMargin: `${RETIRE_MARGIN} 0px ${RETIRE_MARGIN} 0px` },
    );
    nearIO.observe(host);
    farIO.observe(host);

    return () => {
      cancelled = true;
      nearIO.disconnect();
      farIO.disconnect();
      stop();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`${styles.root} ${className ?? ""}`}
      aria-hidden="true"
    />
  );
};

export default PreFooterScene;
