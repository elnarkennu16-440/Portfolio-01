/* ────────────────────────────────────────────────────────────────────────────
 * ABOUT SCENE ENGINE (WebGL2, no libraries)
 *
 * One <canvas>, ~35 draw calls, real depth buffer. Light + dark look, a camera
 * that is driven by SCROLL (so it connects with the Hero: the high Hero view
 * dollies down into the street-level POV as About scrolls into place), and a
 * typing animation on the comment sign.
 *
 * Runs only while the section is on screen. Nothing here touches the DOM
 * except the one canvas.
 * ──────────────────────────────────────────────────────────────────────────── */

import {
  BILLBOARD,
  BUILDINGS,
  CAMERA,
  CARS,
  CAT,
  DUST,
  FOG,
  LAMP,
  LOOKS,
  Pose,
  SIGN,
  STREET,
  TIMELINE,
} from "./aboutSceneConfig";
import {
  Mat4,
  MeshBuilder,
  STRIDE,
  V3,
  around,
  clamp01,
  easeOut,
  easeOutBack,
  identity,
  lerp,
  lerp3,
  lookAt,
  makeProgram,
  mul,
  perspective,
  rotateY,
  rotateZ,
  scale3,
  smooth,
  translate,
} from "./aboutGlUtils";
import { AboutCanvases, buildAboutCanvases } from "./aboutTextures";
import {
  buildBillboard,
  buildBuilding,
  buildCar,
  buildCat,
  buildCommentSign,
  buildDust,
  buildFloor,
  buildGround,
  buildLamp,
  buildSignPosts,
} from "./aboutSceneParts";

export interface AboutInput {
  /** pointer, -1…1 */
  mx: number;
  my: number;
  /** 0 = About just peeking in from below, 1 = fully in place (set from scroll) */
  progress: number;
  /** true = dark look */
  dark: boolean;
}

export interface AboutController {
  dispose(): void;
}

/* ── shaders ────────────────────────────────────────────────────────────── */
const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aUV;
layout(location=2) in vec4 aCol;
layout(location=3) in vec2 aExtra;
uniform mat4 uVP;
uniform mat4 uLocal;
uniform vec3 uEye;
uniform float uPoint;
out vec2 vUV;
out vec4 vCol;
out float vDist;
out float vKind;
void main() {
  vec4 wp = uLocal * vec4(aPos, 1.0);
  gl_Position = uVP * wp;
  gl_PointSize = uPoint;
  vUV = aUV;
  vCol = aCol;
  vDist = length(wp.xyz - uEye);
  vKind = aExtra.x;
}`;

const FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform float uUseTex;
uniform float uAlpha;
uniform float uFade;
uniform vec3 uBg;
uniform vec3 uFadeTo;
uniform vec2 uFog;
uniform float uLook;
uniform float uPass;
uniform vec4 uType;
uniform float uTypeOn;
uniform float uBlink;
uniform float uPointMode;
in vec2 vUV;
in vec4 vCol;
in float vDist;
in float vKind;
out vec4 outColor;
void main() {
  vec4 c = vCol;
  if (uUseTex > 0.5) c *= texture(uTex, vUV);

  if (uPointMode > 0.5) {
    float d = length(gl_PointCoord - 0.5);
    c.a *= smoothstep(0.5, 0.05, d);
  }

  // comment-sign typing: lines above the caret are shown, the caret line up to x
  if (uTypeOn > 0.5) {
    float li = floor((vUV.y - uType.z) / uType.w);
    float full = step(li + 0.5, uType.x);
    float part = step(abs(li - uType.x), 0.5) * step(vUV.x, uType.y);
    c.a *= max(full, part);
    float caret = step(abs(li - uType.x), 0.5) * step(abs(vUV.x - uType.y), 0.0018) * uBlink;
    c = mix(c, vec4(0.93, 0.93, 0.95, 1.0), caret);
  }

  // light look: lift the darks so the same scene reads as a pale grey street
  if (vKind < 0.5) c.rgb = mix(c.rgb, c.rgb * 0.62 + 0.30, uLook);

  float fog = smoothstep(uFog.x, uFog.y, vDist) * 0.92;
  vec3 rgb = mix(c.rgb, uBg, fog);
  rgb = mix(uFadeTo, rgb, uFade);
  float a = c.a * uAlpha;
  if (uPass > 1.5) a *= mix(1.0, 0.3, uLook); // glow is quieter on the light look
  outColor = vec4(rgb, a);
}`;

/* ── a drawable thing ───────────────────────────────────────────────────── */
interface Frame {
  m: Mat4;
  fade?: number; // 0 = hidden, 1 = shown (opaque things)
  alpha?: number; // see-through things
}
interface Item {
  vao: WebGLVertexArrayObject;
  count: number;
  tex: WebGLTexture | null;
  pass: 0 | 1 | 2 | 3; // solid, see-through, additive glow, points
  fadeTo?: V3; // colour an item fades up from (default: the background)
  typed?: boolean;
  upd: (t: number) => Frame | null;
}

const ID = identity();

/* ── controller ─────────────────────────────────────────────────────────── */
export function createAboutScene(
  canvas: HTMLCanvasElement,
  opts: { lite: boolean; input: { current: AboutInput } },
): AboutController | null {
  const gl = canvas.getContext("webgl2", { antialias: true, alpha: false, powerPreference: "high-performance" });
  if (!gl) return null;
  const { lite, input } = opts;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let disposed = false;
  let visible = true;
  let raf = 0;
  let W = 1;
  let H = 1;
  let portrait = false;
  let t0 = -1;
  let built = false;
  let lastDraw = 0;
  const cur = { mx: 0, my: 0, p: input.current.progress, look: input.current.dark ? 0 : 1 };

  let program: WebGLProgram | null = null;
  let items: Item[] = [];
  let textures: WebGLTexture[] = [];
  let buffers: WebGLBuffer[] = [];
  let vaos: WebGLVertexArrayObject[] = [];
  let white: WebGLTexture | null = null;
  let layout: AboutCanvases["sign"] | null = null;
  const U: Record<string, WebGLUniformLocation | null> = {};

  /* ── GPU resources ────────────────────────────────────────────────────── */
  const tex = (c: HTMLCanvasElement, repeat = false) => {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    const ext = gl.getExtension("EXT_texture_filter_anisotropic");
    if (ext) {
      const max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
      gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(lite ? 4 : 8, max));
    }
    textures.push(t);
    return t;
  };

  const mesh = (mb: MeshBuilder) => {
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mb.data), gl.STATIC_DRAW);
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const f = 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, STRIDE * f, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, STRIDE * f, 3 * f);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, STRIDE * f, 5 * f);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, STRIDE * f, 9 * f);
    gl.bindVertexArray(null);
    buffers.push(buf);
    vaos.push(vao);
    return { vao, count: mb.data.length / STRIDE };
  };

  /* ── animation helpers (t = seconds since the reveal started) ─────────── */
  const prog = (t: number, delay: number, dur: number) => (t - delay) / dur;

  /** grows out of the ground (the floor hides the part that is still below it) */
  const rise = (delay: number, dur: number, sink: number, base: Mat4 = ID) => (t: number): Frame | null => {
    const p = prog(t, delay, dur);
    if (p <= 0) return null;
    return { m: mul(base, translate(0, -sink * (1 - easeOut(p)), 0)), fade: clamp01(p * 2.2) };
  };
  const fadeIn = (delay: number, dur: number, base: Mat4 = ID) => (t: number): Frame | null => {
    const p = prog(t, delay, dur);
    if (p <= 0) return null;
    return { m: base, fade: smooth(p), alpha: smooth(p) };
  };

  /* ── build the whole scene ────────────────────────────────────────────── */
  function build(c: AboutCanvases) {
    program = makeProgram(gl!, VS, FS);
    for (const n of ["uVP", "uLocal", "uEye", "uPoint", "uTex", "uUseTex", "uAlpha", "uFade", "uBg", "uFadeTo", "uFog", "uLook", "uPass", "uType", "uTypeOn", "uBlink", "uPointMode"]) {
      U[n] = gl!.getUniformLocation(program, n);
    }
    const wc = document.createElement("canvas");
    wc.width = wc.height = 2;
    const wg = wc.getContext("2d")!;
    wg.fillStyle = "#fff";
    wg.fillRect(0, 0, 2, 2);
    white = tex(wc);

    const glowT = tex(c.glow);
    const reflT = tex(c.reflection);
    items = [];
    const add = (mb: MeshBuilder, texture: WebGLTexture | null, pass: Item["pass"], upd: Item["upd"], extra: Partial<Item> = {}) =>
      items.push({ ...mesh(mb), tex: texture, pass, upd, ...extra });

    const T = TIMELINE;
    const lampX = LAMP.x;
    void lampX;

    /* floor + street */
    add(buildFloor(), null, 0, fadeIn(T.ground.delay, T.ground.dur));
    add(buildGround(), tex(c.ground), 0, fadeIn(T.ground.delay, T.ground.dur));

    /* buildings */
    const blds = BUILDINGS.filter((b) => !(lite && b.skipOnLite));
    blds.forEach((b, i) => {
      const g = buildBuilding(b);
      const r = rise(b.delay, 1.5, b.h + 2);
      add(g.front, tex(c.walls[i].front), 0, r);
      add(g.side, tex(c.walls[i].side), 0, r);
      add(g.top, null, 0, r);
    });

    /* GitHub billboard */
    {
      const bb = BILLBOARD;
      const pb = portrait ? bb.portrait : null;
      const base = mul(translate(pb ? pb.x : bb.x, 0, pb ? pb.z : bb.z), mul(rotateY(bb.yaw), pb ? scale3(pb.scale, pb.scale, pb.scale) : identity()));
      const geo = buildBillboard();
      const r = rise(TIMELINE.billboard.delay, TIMELINE.billboard.dur, 7, base);
      add(geo.frame, null, 0, r);
      // the screen: dark while the board rises, then switches on (with a short flicker)
      add(geo.panel, tex(c.board), 0, (t) => {
        const f = r(t);
        if (!f) return null;
        const on = prog(t, TIMELINE.billboardOn, 0.9);
        const flick = on < 0 ? 0 : on < 1 ? (Math.sin(on * 38) > -0.2 ? smooth(on) : 0.15) : 1;
        return { m: f.m, fade: (f.fade ?? 1) * flick };
      }, { fadeTo: [0.025, 0.025, 0.03] });
      add(geo.beams, null, 2, (t) => {
        const f = r(t);
        if (!f) return null;
        const on = prog(t, TIMELINE.billboardOn, 1.2);
        return on <= 0 ? null : { m: f.m, alpha: smooth(on) };
      });
    }

    /* street lamp + wet reflection */
    {
      const lamp = buildLamp();
      add(lamp.pole, null, 0, rise(1.2, 1.2, 9));
      const lampOn = (t: number): Frame | null => {
        const p = prog(t, TIMELINE.lampOn, 1.4);
        if (p <= 0) return null;
        const flick = p < 0.5 ? (Math.sin(p * 60) > -0.1 ? 1 : 0.2) : 1;
        return { m: ID, alpha: smooth(p) * flick };
      };
      add(lamp.beam, null, 2, lampOn);
      add(lamp.pool, glowT, 2, lampOn);
      add(lamp.streak, reflT, 2, lampOn);
    }

    /* comment sign + cat (the layout of the sign text decides the typing) */
    layout = c.sign;
    {
      const sx = portrait ? SIGN.portrait.x : SIGN.x;
      const sy = portrait ? SIGN.portrait.y : SIGN.y;
      const sw = portrait ? SIGN.portrait.w : SIGN.w;
      const sh = portrait ? SIGN.portrait.h : SIGN.h;
      const geo = buildCommentSign(sw, sh, portrait ? SIGN.portrait.tailX : SIGN.tailX);
      const tip = geo.tip;
      const sz = portrait ? SIGN.portrait.z : SIGN.z;
      const place = mul(translate(sx, sy, sz), rotateY(SIGN.yaw));
      const sign = (t: number): Frame | null => {
        const p = prog(t, TIMELINE.sign.delay, TIMELINE.sign.dur);
        if (p <= 0) return null;
        const s = lerp(0.15, 1, easeOutBack(p));
        const bob = Math.sin(t * 0.8) * 0.05;
        const pop = around(tip, scale3(s, s, s));
        return { m: mul(translate(0, bob, 0), mul(place, pop)), fade: clamp01(p * 2.4), alpha: clamp01(p * 2.4) };
      };
      add(geo.body, null, 0, sign);
      add(geo.text, tex(c.sign.canvas), 1, sign, { typed: true });
      add(buildSignPosts(sx, sy - sh / 2 - SIGN.tailLen * 0.2, sz, sw), null, 0, rise(TIMELINE.sign.delay, 1.0, 6));
    }

    {
      const cat = buildCat();
      const cx = portrait ? CAT.portraitX : CAT.x;
      const cz = portrait ? CAT.portraitZ : CAT.z;
      const k = CAT.scale;
      const base = mul(translate(cx, 0, cz), mul(rotateY(CAT.yaw), scale3(k, k, k)));
      const appear = (t: number): Frame | null => {
        const p = prog(t, TIMELINE.cat.delay, TIMELINE.cat.dur);
        if (p <= 0) return null;
        return { m: mul(base, translate(0, -0.5 * (1 - easeOut(p)), 0)), fade: smooth(p * 1.4) };
      };
      add(cat.body, null, 0, appear);
      add(cat.head, null, 0, (t) => {
        const f = appear(t);
        if (!f) return null;
        const turn = Math.sin(t * 0.5) * 7 + Math.sin(t * 0.17) * 3;
        const tilt = Math.sin(t * 0.37 + 1) * 2.5;
        return { m: mul(f.m, around(cat.headPivot, mul(rotateY(turn), rotateZ(tilt)))), fade: f.fade };
      });
      // eyes: light up after the cat has appeared, blink now and then
      add(cat.eyes, null, 0, (t) => {
        const f = appear(t);
        if (!f) return null;
        const on = prog(t, TIMELINE.cat.delay + 0.9, 0.5);
        if (on <= 0) return null;
        const turn = Math.sin(t * 0.5) * 7 + Math.sin(t * 0.17) * 3;
        const tilt = Math.sin(t * 0.37 + 1) * 2.5;
        const ph = (t % 4.6) / 4.6;
        const blink = ph > 0.94 ? Math.max(0.05, Math.abs(ph - 0.97) / 0.03) : 1;
        const lid = around(cat.eyesPivot, scale3(1, blink, 1));
        return { m: mul(f.m, mul(around(cat.headPivot, mul(rotateY(turn), rotateZ(tilt))), lid)), fade: smooth(on) };
      }, { fadeTo: [0.02, 0.02, 0.02] });
      add(cat.tail, null, 0, (t) => {
        const f = appear(t);
        if (!f) return null;
        const sway = Math.sin(t * 1.1) * 6 + Math.sin(t * 0.43) * 3;
        return { m: mul(f.m, around(cat.tailPivot, rotateZ(sway))), fade: f.fade };
      });
    }

    /* cars driving by */
    {
      CARS.forEach((cr, i) => {
        const car = buildCar(cr.len, cr.tone);
        const flip = cr.dir < 0 ? -1 : 1;
        const move = (t: number): Frame | null => {
          const p = prog(t, TIMELINE.cars + i * 1.2, 0.8);
          if (p <= 0) return null;
          const range = 150;
          const x = ((((cr.x0 + 75 + cr.dir * cr.speed * (t - TIMELINE.cars)) % range) + range) % range) - 75;
          return { m: mul(translate(x, 0, cr.lane), scale3(flip, 1, 1)), fade: 1 };
        };
        add(car.body, null, 0, move);
        add(car.lights, null, 0, move);
      });
    }

    /* dust / stars */
    add(buildDust(lite ? DUST.liteCount : DUST.count), null, 3, (t) => {
      const p = prog(t, 0.8, 2);
      if (p <= 0) return null;
      return { m: translate(0, Math.sin(t * 0.12) * 0.4, Math.cos(t * 0.09) * 0.3), alpha: smooth(p) };
    });
  }

  /* ── drawing ──────────────────────────────────────────────────────────── */
  function poseFor(p: number, aspect: number): { eye: V3; target: V3; fov: number } {
    const end: Pose = portrait ? CAMERA.endPortrait : CAMERA.end;
    const a = CAMERA.start;
    const e = smooth(p);
    let eye = lerp3(a.eye, end.eye, e);
    let target = lerp3(a.target, end.target, e);
    const base = lerp(a.fov, end.fov, e);
    // keep the horizontal view wide enough on narrow screens
    const minH = portrait ? CAMERA.minHFovPortrait : CAMERA.minHFov;
    const need = (2 * Math.atan(Math.tan((minH * Math.PI) / 360) / aspect) * 180) / Math.PI;
    const fov = Math.min(portrait ? CAMERA.maxFovPortrait : CAMERA.maxFov, Math.max(base, lerp(base, need, e)));
    // pointer parallax (only when we are close to the street)
    eye = [eye[0] + cur.mx * 0.4 * e, eye[1] - cur.my * 0.14 * e, eye[2]];
    target = [target[0] + cur.mx * 0.3 * e, target[1], target[2]];
    return { eye, target, fov };
  }

  function draw(now: number) {
    const g = gl!;
    cur.mx += (input.current.mx - cur.mx) * 0.06;
    cur.my += (input.current.my - cur.my) * 0.06;
    cur.p += (input.current.progress - cur.p) * (reduced ? 1 : 0.14);
    cur.look += ((input.current.dark ? 0 : 1) - cur.look) * 0.12;

    const bgD = LOOKS.dark.bg;
    const bgL = LOOKS.light.bg;
    const bg: V3 = [
      lerp(bgD[0], bgL[0], cur.look) / 255,
      lerp(bgD[1], bgL[1], cur.look) / 255,
      lerp(bgD[2], bgL[2], cur.look) / 255,
    ];

    g.viewport(0, 0, canvas.width, canvas.height);
    g.clearColor(bg[0], bg[1], bg[2], 1);
    g.clear(g.COLOR_BUFFER_BIT | g.DEPTH_BUFFER_BIT);
    if (!program || !items.length) return;

    // the reveal starts the first time the section peeks into view
    if (t0 < 0) {
      if (cur.p > 0.04 || reduced) t0 = reduced ? now - 60_000 : now;
      else return;
    }
    const t = (now - t0) / 1000;

    const aspect = W / H;
    const pose = poseFor(cur.p, aspect);
    const vp = mul(perspective(pose.fov, aspect, CAMERA.near, CAMERA.far), lookAt(pose.eye, pose.target));

    g.useProgram(program);
    g.uniformMatrix4fv(U.uVP, false, vp);
    g.uniform3f(U.uEye, pose.eye[0], pose.eye[1], pose.eye[2]);
    g.uniform3f(U.uBg, bg[0], bg[1], bg[2]);
    g.uniform2f(U.uFog, FOG.start, FOG.end);
    g.uniform1f(U.uLook, cur.look);
    g.uniform1i(U.uTex, 0);
    g.uniform1f(U.uPoint, Math.max(1.5, (canvas.width / W) * 2.2));
    g.enable(g.DEPTH_TEST);
    g.depthFunc(g.LEQUAL);
    g.disable(g.CULL_FACE);

    // typing state for the comment sign
    let typeLine = 0;
    let typeX = 0;
    let typeOn = 0;
    if (layout) {
      const chars = Math.max(0, (t - TIMELINE.typeStart) * SIGN.charsPerSecond);
      let n = Math.floor(reduced ? 1e9 : chars);
      typeX = layout.x0;
      if (n >= layout.total) {
        typeLine = layout.lines.length + 1;
        typeX = 1;
      } else {
        let li = 0;
        while (li < layout.lines.length && n > layout.lines[li].text.length) {
          n -= layout.lines[li].text.length + 1;
          li++;
        }
        typeLine = li;
        const ln = layout.lines[Math.min(li, layout.lines.length - 1)];
        typeX = n <= 0 ? layout.x0 : ln.ends[Math.min(n, ln.ends.length) - 1];
      }
      typeOn = 1;
    }
    const typing = !!layout && typeLine <= layout.lines.length;
    const caret = typing && t > TIMELINE.sign.delay + 0.6 && Math.floor(t * 2.2) % 2 === 0 ? 1 : 0;
    g.uniform1f(U.uBlink, caret);

    for (let pass = 0; pass < 4; pass++) {
      if (pass === 0) {
        g.disable(g.BLEND);
        g.depthMask(true);
      } else {
        g.enable(g.BLEND);
        g.depthMask(false);
        g.blendFunc(g.SRC_ALPHA, pass === 1 ? g.ONE_MINUS_SRC_ALPHA : g.ONE);
      }
      g.uniform1f(U.uPass, pass);
      g.uniform1f(U.uPointMode, pass === 3 ? 1 : 0);
      for (const it of items) {
        if (it.pass !== pass) continue;
        const f = it.upd(t);
        if (!f) continue;
        const fade = f.fade ?? 1;
        const alpha = f.alpha ?? 1;
        if (pass === 0 ? fade <= 0.002 : alpha <= 0.002) continue;
        g.uniformMatrix4fv(U.uLocal, false, f.m);
        g.activeTexture(g.TEXTURE0);
        g.bindTexture(g.TEXTURE_2D, it.tex ?? white);
        g.uniform1f(U.uUseTex, it.tex ? 1 : 0);
        const ft = it.fadeTo ?? bg;
        g.uniform3f(U.uFadeTo, ft[0], ft[1], ft[2]);
        g.uniform1f(U.uFade, pass === 0 ? fade : 1);
        g.uniform1f(U.uAlpha, pass === 0 ? 1 : alpha);
        g.uniform1f(U.uTypeOn, it.typed ? typeOn : 0);
        if (it.typed) g.uniform4f(U.uType, typeLine, typeX, layout!.topUV, layout!.lineHUV);
        g.bindVertexArray(it.vao);
        g.drawArrays(pass === 3 ? g.POINTS : g.TRIANGLES, 0, it.count);
      }
    }
    g.bindVertexArray(null);
  }

  /* ── loop: only while the section is on screen ────────────────────────── */
  const frame = (now: number) => {
    raf = 0;
    if (disposed || !visible) return;
    if (lite && now - lastDraw < 30) {
      raf = requestAnimationFrame(frame);
      return;
    }
    lastDraw = now;
    draw(now);
    if (!reduced) raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (!raf && visible && !disposed) raf = requestAnimationFrame(frame);
  };

  /* ── size ─────────────────────────────────────────────────────────────── */
  const resize = () => {
    const r = (canvas.parentElement ?? canvas).getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    const wasPortrait = portrait;
    portrait = W / H < 1.1;
    let dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2);
    dpr = Math.min(dpr, Math.sqrt(4_200_000 / (W * H)));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    if (wasPortrait !== portrait && (built || building)) {
      built = false;
      building = false;
      rebuild().catch(() => undefined); // different bubble + cat spot for portrait
    }
    if (reduced) draw(performance.now());
    start();
  };
  let rt = 0;
  const onResize = () => {
    window.clearTimeout(rt);
    rt = window.setTimeout(resize, 90);
  };
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
  ro?.observe(canvas.parentElement ?? canvas);

  const io =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([e]) => {
          visible = e.isIntersecting && !document.hidden;
          if (visible) {
            ensureBuilt();
            start();
          }
        })
      : null;
  io?.observe(canvas);
  const onVis = () => {
    visible = !document.hidden;
    if (visible) start();
  };
  document.addEventListener("visibilitychange", onVis);

  const onLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const onRestored = () => rebuild();
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  function release() {
    textures.forEach((x) => gl!.deleteTexture(x));
    buffers.forEach((x) => gl!.deleteBuffer(x));
    vaos.forEach((x) => gl!.deleteVertexArray(x));
    if (program) gl!.deleteProgram(program);
    textures = [];
    buffers = [];
    vaos = [];
    items = [];
    program = null;
  }

  /* the textures are drawn in small steps, while the browser is idle (so the
     Hero intro is never disturbed) — or at once if About is already on screen */
  let building = false;
  let canvases: AboutCanvases | null = null;
  async function rebuild() {
    if (building) return;
    building = true;
    release();
    built = false;
    try {
      canvases = await buildAboutCanvases(lite, portrait);
      if (disposed) return;
      build(canvases);
      built = true;
      start();
    } finally {
      building = false;
    }
  }
  const ensureBuilt = () => {
    if (!built && !building && !disposed) rebuild().catch(() => undefined);
  };

  resize();
  type Idle = (cb: () => void, o?: { timeout: number }) => number;
  const ric = (window as unknown as { requestIdleCallback?: Idle }).requestIdleCallback;
  const idleTimer = ric ? ric(ensureBuilt, { timeout: 5000 }) : window.setTimeout(ensureBuilt, 2500);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(rt);
      window.clearTimeout(idleTimer);
      const cic = (window as unknown as { cancelIdleCallback?: (n: number) => void }).cancelIdleCallback;
      cic?.(idleTimer);
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      release();
    },
  };
}
