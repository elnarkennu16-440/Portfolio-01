import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import styles from "./PreFooterScene.module.css";
import {
  buildBillboard,
  buildBottle,
  buildCallouts,
  buildGround,
  buildSplash,
  buildStream,
  buildTanker,
  buildWorker,
  createLiquidMaterial,
  disposeObject,
  mulberry32,
} from "./preFooterParts";

/* ═══════════════════════════ TUNING ═══════════════════════════════════════ */
const BG = 0x0b0b0d; // same colour as .bannerSection → no seam, no flash
const FOG_K = 0.5; // fog density = FOG_K / camera distance (same haze at any screen)

const FOV_WIDE = 30;
const FOV_TALL = 38; // phones: a little wider lens so the camera is not too far away
const FIT_H = 23; // metres that must always fit vertically
const FIT_W = 29.5; // metres that must always fit horizontally (tank → bottle)
const TARGET_WIDE = new THREE.Vector3(0, 10.5, -3);
const TARGET_TALL = new THREE.Vector3(1.5, 9.6, -3);
const VIEW_DIR = new THREE.Vector3(-0.2, 0.1, 1).normalize(); // for the bottle label
const SPOT_I = 1500;

/* ── floating callouts (labels around the bottle) ── */
const CALLOUT_CAM = new THREE.Vector3(-11.18, 4.48, 38.28); // typical camera, used to pick the surface points
const CALLOUT_MIN_ASPECT = 1.1; // phones / portrait: the bottle is too small for 7 readable labels
const CALLOUT_PLANE_Z = -2.2; // depth the labels float at (used to measure the screen)
const CALLOUT_PX = 17; // wanted font size in px (the cap height is ~0.72 of it)
const CALLOUT_EM_MIN = 0.7;
const CALLOUT_EM_MAX = 1.0;
const CALLOUT_RIGHT_NDC = 0.94; // right column must end before this screen position
const PARALLAX_X = 1.1;
const PARALLAX_Y = 0.4;
const REDUCED_T = 100;

/* ── performance policy (same as HeroScene) ──
   Native resolution first, 60 fps first. A slow machine settles at an even
   30 fps; only after that the resolution comes down, never below native. */
const MAX_DPR_DESKTOP = 1.5;
const MAX_DPR_MOBILE = 1.25;
const NO_MSAA_MIN_DPR = 1.25;
const DPR_STEP = 0.85;
const TARGET_FPS = 60;
const SHADOW_FINAL_T = 3.0; // after this the shadow map is frozen for good
const SHADOW_EVERY = 3; // during the intro: refresh the shadow every Nth frame
const ADAPT_AFTER_T = 4.0;
const GOV_WINDOW = 45;
const GOV_SETTLE = 8;
const SLOW_FACTOR = 1.45;
const COMPILE_TIMEOUT_MS = 2500;
const MOUNT_MARGIN = "700px 0px"; // build the scene a bit BEFORE it scrolls in
const REVEAL_RATIO = 0.2; // start the intro when 20 % of the banner is visible

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (t: number, start: number, dur: number) =>
  clamp01((t - start) / dur);
const easeOutQuart = (x: number) => 1 - Math.pow(1 - x, 4);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) =>
  x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
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

/** True when WebGL runs on the CPU (hardware acceleration off) — the #1 cause of lag. */
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

/* ═══════════════════════════ THE SCENE ════════════════════════════════════ */

function mountScene(host: HTMLDivElement): () => void {
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
      alpha: false, // opaque canvas: the browser never blends it with the page
      stencil: false,
      powerPreference: "high-performance",
    });
  } catch {
    return () => undefined;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false; // refreshed by hand (see update())
  renderer.setClearColor(BG, 1);
  renderer.domElement.className = styles.canvas;
  host.appendChild(renderer.domElement);

  /* ── resolution ── */
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

  /* ── scene, light, environment ── */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  const fog = new THREE.FogExp2(BG, 0.012);
  scene.fog = fog;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  let envTexture = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envTexture;
  scene.environmentIntensity = 0.28;

  scene.add(new THREE.HemisphereLight(0x6b6b70, 0x0a0a0b, 0.6));

  const key = new THREE.DirectionalLight(0xe4e6ea, 2.6);
  key.position.set(-24, 36, 30);
  key.target.position.set(0, 6, -4);
  key.castShadow = true;
  key.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  key.shadow.camera.left = -36;
  key.shadow.camera.right = 36;
  key.shadow.camera.top = 36;
  key.shadow.camera.bottom = -36;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 130;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.04;
  key.shadow.radius = 1.5;
  scene.add(key, key.target);

  const rim = new THREE.DirectionalLight(0x9a9aa2, 1.2);
  rim.position.set(30, 18, -40);
  scene.add(rim);

  // one soft spotlight on the bottle / stream (no shadow = cheap)
  const spot = new THREE.SpotLight(0xffffff, SPOT_I, 90, 0.34, 1, 2);
  spot.position.set(-8, 22, 26);
  spot.target.position.set(5, 11, -4);
  scene.add(spot, spot.target);

  /* ── objects ── */
  const rand = mulberry32(20261030);
  const ground = buildGround(rand);
  const billboard = buildBillboard();
  const worker = buildWorker();
  const callouts = buildCallouts(CALLOUT_CAM);
  const bottle = buildBottle(VIEW_DIR);
  const tanker = buildTanker();
  const liquid = createLiquidMaterial();
  const stream = buildStream(liquid);
  const splash = buildSplash(liquid);
  scene.add(
    ground.group,
    billboard.group,
    worker.group,
    bottle.pivot,
    tanker.group,
    stream.mesh,
    splash.group,
    callouts.group,
  );

  // chrome / glass look: give those materials the environment directly
  const reflective: THREE.MeshStandardMaterial[] = [
    liquid,
    ...bottle.reflective,
    ...tanker.reflective,
  ];
  const applyEnv = () =>
    reflective.forEach((m) => {
      m.envMap = envTexture;
    });
  applyEnv();

  // anisotropic filtering + dithering (kills banding in the dark gradients)
  const maxAniso = softwareGL
    ? 2
    : Math.min(small ? 8 : 16, renderer.capabilities.getMaxAnisotropy());
  scene.traverse((o) => {
    const mat = (o as THREE.Mesh).material as
      | THREE.Material
      | THREE.Material[]
      | undefined;
    if (!mat) return;
    (Array.isArray(mat) ? mat : [mat]).forEach((m) => {
      const std = m as THREE.MeshStandardMaterial;
      if (std.isMeshStandardMaterial) {
        m.dithering = true;
        const maps = [std.map, std.emissiveMap];
        maps.forEach((t) => {
          if (t && t.anisotropy > 1) t.anisotropy = maxAniso;
        });
      }
    });
  });

  /* ── camera: fits the screen, never crops the subject ── */
  const camera = new THREE.PerspectiveCamera(FOV_WIDE, 16 / 9, 1, 500);
  const target = TARGET_WIDE.clone();
  const camPos = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const pointer = { x: 0, y: 0, cx: 0, cy: 0 };
  let fitDist = 42;
  let fogBase = FOG_K / fitDist;
  const probe = new THREE.Vector3();

  const resize = () => {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    applySize(w, h);
    const aspect = w / h;
    camera.aspect = aspect;

    const fov =
      aspect >= 1.2
        ? FOV_WIDE
        : THREE.MathUtils.lerp(
            FOV_WIDE,
            FOV_TALL,
            clamp01((1.2 - aspect) / 0.7),
          );
    camera.fov = fov;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    fitDist = Math.max(FIT_H / 2 / tanHalf, FIT_W / 2 / (tanHalf * aspect));
    fogBase = FOG_K / fitDist;
    target.copy(aspect >= 1.1 ? TARGET_WIDE : TARGET_TALL);

    // wide screens: push the scene to the right so the text on the left stays clear.
    // tall screens (phones): lift the scene into the top part, text sits below.
    const visW = 2 * fitDist * tanHalf * aspect;
    const xShift =
      aspect >= 1.1 ? Math.min(0.15, Math.max(0, 0.45 - 14.2 / visW)) : 0;
    const yShift = 0.16 * clamp01((1.15 - aspect) / 0.4);
    if (xShift > 0 || yShift > 0) {
      camera.setViewOffset(
        w,
        h,
        Math.round(-w * xShift),
        Math.round(h * yShift),
        w,
        h,
      );
    } else {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();

    // measure the screen at the depth the labels float at → label size + right edge
    camera.position.set(
      target.x - fitDist * 0.26,
      Math.max(2.6, target.y - fitDist * 0.14),
      target.z + fitDist * 0.96,
    );
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    const worldX = (ndc: number) => {
      probe.set(ndc, 0, 0.5).unproject(camera).sub(camera.position);
      return (
        camera.position.x +
        probe.x * ((CALLOUT_PLANE_Z - camera.position.z) / probe.z)
      );
    };
    const worldW = Math.max(1, worldX(1) - worldX(-1));
    callouts.setLayout({
      show: aspect >= CALLOUT_MIN_ASPECT,
      em: THREE.MathUtils.clamp(
        CALLOUT_PX / (w / worldW),
        CALLOUT_EM_MIN,
        CALLOUT_EM_MAX,
      ),
      rightLimit: worldX(CALLOUT_RIGHT_NDC),
    });
    renderOnce();
  };

  /* ── timeline ── */
  let revealStart: number | null = reduced ? -1 : null;
  let wantReveal = false;
  let shadowsPrimed = false;
  let shadowsFinal = false;
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
    const time = reduced ? 0 : now / 1000;

    // camera: slow push-in, then a tiny idle drift + pointer parallax
    const e = easeOutQuart(seg(t, 0, 3.2));
    const d = fitDist * (1 + 0.16 * (1 - e));
    const drift = reduced ? 0 : e;
    if (!reduced) {
      pointer.cx += (pointer.x - pointer.cx) * 0.05;
      pointer.cy += (pointer.y - pointer.cy) * 0.05;
    }
    camPos.set(
      target.x -
        d * 0.26 +
        pointer.cx * PARALLAX_X * drift +
        Math.sin(now * 0.00011) * 0.5 * drift,
      Math.max(2.6, target.y - d * 0.14) -
        pointer.cy * PARALLAX_Y * drift +
        Math.sin(now * 0.00008) * 0.12 * drift,
      target.z + d * 0.96,
    );
    camera.position.copy(camPos);
    lookAt.set(target.x + pointer.cx * 0.5 * drift, target.y, target.z);
    camera.lookAt(lookAt);
    fog.density = fogBase * (1 + 1.1 * (1 - easeOutCubic(seg(t, 0, 3))));

    // billboard + lamps flicker on, then the bottle tips in and the pour starts
    const f = flicker(t, 0.3);
    billboard.setGlow(f);
    spot.intensity = SPOT_I * f;
    bottle.pivot.rotation.z = 0.45 * (1 - easeInOut(seg(t, 0.2, 1.3)));
    stream.setGrow(easeInOut(seg(t, 1.0, 1.5)));
    splash.setScale(easeOutBack(seg(t, 2.2, 0.7)));
    callouts.update(t, time, reduced);

    // the only things that move while idle
    stream.update(time);
    splash.update(time);

    // PERF: the shadow map is NOT redrawn every frame. Refreshed during the
    // intro (the bottle moves), then frozen — nothing else casts a moving shadow.
    if (!shadowsPrimed) {
      renderer.shadowMap.needsUpdate = true;
      shadowsPrimed = true;
      if (t >= SHADOW_FINAL_T) shadowsFinal = true;
    } else if (!shadowsFinal) {
      if (t >= SHADOW_FINAL_T) {
        renderer.shadowMap.needsUpdate = true;
        shadowsFinal = true;
      } else if (t >= 0 && shadowTick++ % shadowEvery === 0) {
        renderer.shadowMap.needsUpdate = true;
      }
    }
  };

  /* ═════════════ run / pause logic ═════════════
   * The loop only runs while the scene is warmed up, the banner is on screen,
   * the tab is visible and the GPU context is alive. Otherwise: zero GPU work. */
  let raf = 0;
  let running = false;
  let inView = false;
  let contextLost = false;
  let disposed = false;
  let lastFrame = 0;
  let lastTick = 0;
  let vsyncMs = 1000 / 60;
  let frameMs = 1000 / TARGET_FPS;

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
    const go = ready && inView && !document.hidden && !contextLost && !reduced;
    if (go) startLoop();
    else stopLoop();
  };
  const beginReveal = () => {
    if (reduced || revealStart !== null) return;
    revealStart = performance.now();
    sync();
  };

  /* ═════════════ GPU context loss ═════════════ */
  const onContextLost = (e: Event) => {
    e.preventDefault();
    contextLost = true;
    stopLoop();
  };
  const onContextRestored = () => {
    contextLost = false;
    try {
      envTexture.dispose();
      envTexture = pmrem.fromScene(room, 0.04).texture;
      scene.environment = envTexture;
      applyEnv();
    } catch {
      /* the scene still renders without the soft env light */
    }
    shadowsPrimed = false;
    shadowsFinal = false;
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
  if (finePointer && !reduced) {
    window.addEventListener("pointermove", onMove, { passive: true });
  }
  document.addEventListener("visibilitychange", sync);

  const ro = new ResizeObserver(resize);
  ro.observe(host);

  const section = host.parentElement?.parentElement ?? host;
  const io = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      if (entry.intersectionRatio >= REVEAL_RATIO) {
        wantReveal = true;
        if (ready) beginReveal();
      }
      sync();
    },
    { threshold: [0, REVEAL_RATIO] },
  );
  io.observe(section);

  /* ═════════════ warm-up: no hitch when the banner scrolls in ═════════════
   * compile the shaders off the main thread, draw one real frame (uploads all
   * textures + geometry, builds the first shadow map), THEN allow the intro. */
  const prewarm = async () => {
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
    ready = true;
    try {
      update(performance.now());
      renderer.render(scene, camera);
    } catch {
      /* not critical */
    }
    if (wantReveal) beginReveal();
    else sync();
  };

  resize();
  void prewarm();

  return () => {
    disposed = true;
    stopLoop();
    ro.disconnect();
    io.disconnect();
    document.removeEventListener("visibilitychange", sync);
    window.removeEventListener("pointermove", onMove);
    renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
    renderer.domElement.removeEventListener(
      "webglcontextrestored",
      onContextRestored,
    );
    disposeObject(scene);
    (room as unknown as { dispose?: () => void }).dispose?.();
    envTexture.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}

/* ═══════════════════════════ REACT WRAPPER ════════════════════════════════ */

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
    let stop: (() => void) | null = null;

    // Lazy: nothing is built (no WebGL context, no textures) until the banner
    // is close to the viewport, so the hero / about scenes load first.
    if (typeof IntersectionObserver === "undefined") {
      stop = mountScene(host);
      return () => stop?.();
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (stop || !entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        stop = mountScene(host);
      },
      { rootMargin: MOUNT_MARGIN },
    );
    io.observe(host);
    return () => {
      io.disconnect();
      stop?.();
      stop = null;
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
