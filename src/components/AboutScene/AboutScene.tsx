import React, { useEffect, useRef, useState } from "react";
import styles from "./AboutScene.module.css";
import { createAboutScene } from "./aboutEngine";
import type { SceneHandle } from "./aboutEngine";
import {
  CAT_SHOT,
  CAT_SHOT_MS,
  GITHUB_IMAGE_SRC,
  PREBUILD_AFTER_LOAD_MS,
  SHOTS,
  SHOT_COUNT,
  TOUR_MS,
} from "./aboutSceneConfig";

/* ────────────────────────────────────────────────────────────────────────────
 * AboutScene — the React side of the About street: mounts the canvas host, starts
 * the (pre)build at the right moment, and drives the phone tour buttons.
 * The 3D engine itself is split out, like the hero:
 *   aboutEngine.ts        engine: build steps + render loop + auto quality
 *   aboutSceneConfig.ts  every tunable number (camera, timing, theme looks)
 *   aboutQuality.ts      per-device quality (resolution / fps / MSAA)
 *   aboutSceneParts.ts   the 3D objects (road, city, boards, cat, sign ...)
 * ──────────────────────────────────────────────────────────────────────────── */

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
      handleRef.current = createAboutScene(host, {
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
    let warmTimer = 0;
    let onLoad: (() => void) | null = null;
    if (typeof IntersectionObserver === "undefined") {
      start();
    } else {
      // PERF: build the scene in the background shortly after the page has loaded, so
      // that scrolling into About never has to wait for it. (The observer below stays
      // as the fallback: if the visitor gets here first, it starts immediately.)
      const nav = navigator as Navigator & {
        deviceMemory?: number;
        connection?: { saveData?: boolean };
      };
      // FIX: low-memory phones and "data saver" used to skip the prebuild completely, so
      // the whole build only started when About was already on screen (long blank).
      // They now prebuild too, just a bit later (the build itself is sliced and gentle).
      const canPrebuild = PREBUILD_AFTER_LOAD_MS >= 0;
      const gentle =
        (nav.deviceMemory !== undefined && nav.deviceMemory < 4) ||
        !!nav.connection?.saveData;
      if (canPrebuild) {
        // never build while the hero is still revealing: wait until Hero.tsx says it
        // has settled (data-reveal-done), with a safety limit so we never wait forever
        const go = () => {
          lazy?.disconnect();
          start();
        };
        const waitForHero = (since: number) => {
          const hero = document.getElementById("hero");
          if (
            !hero ||
            hero.dataset.revealDone === "true" ||
            performance.now() - since > 15000
          ) {
            go();
            return;
          }
          warmTimer = window.setTimeout(() => waitForHero(since), 250);
        };
        const arm = () => {
          warmTimer = window.setTimeout(
            () => waitForHero(performance.now()),
            PREBUILD_AFTER_LOAD_MS + (gentle ? 1500 : 0),
          );
        };
        if (document.readyState === "complete") {
          arm();
        } else {
          onLoad = arm;
          window.addEventListener("load", arm, { once: true });
        }
      }
      lazy = new IntersectionObserver(
        (entries) => {
          if (entries.some((en) => en.isIntersecting)) {
            lazy?.disconnect();
            start();
          }
        },
        { rootMargin: "0px 0px 0px 0px" },
      );
      lazy.observe(host);
    }

    return () => {
      gone = true;
      window.clearTimeout(warmTimer);
      if (onLoad) window.removeEventListener("load", onLoad);
      lazy?.disconnect();
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [githubImageSrc]);

  useEffect(() => {
    if (!tour || !live || reduced) return;
    const timer = window.setTimeout(
      () => setShot((s) => (s + 1) % SHOT_COUNT),
      shot === CAT_SHOT ? CAT_SHOT_MS : TOUR_MS,
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
                    style={{
                      animationDuration: `${shot === CAT_SHOT ? CAT_SHOT_MS : TOUR_MS}ms`,
                    }}
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
