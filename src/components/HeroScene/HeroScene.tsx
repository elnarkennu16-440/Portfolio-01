import React, { MutableRefObject, useEffect, useRef } from "react";
import styles from "./HeroScene.module.css";
import { SceneController, SceneInput, createScene } from "./glScene";

interface HeroSceneProps {
  /** true when the loader is finished → the reveal animation starts */
  ready?: boolean;
  /** phones / weak devices: fewer pieces, lower resolution cap, 30 fps */
  lite?: boolean;
  /** pointer + scroll values written by Hero.tsx (read by the scene every frame) */
  inputRef: MutableRefObject<SceneInput>;
  /** called the moment the reveal really begins (textures are ready) */
  onStart?: () => void;
}

/**
 * The 3D street. Everything is drawn on one <canvas> with WebGL (see glScene.ts),
 * so for the page it is a single flat image. That is what keeps scrolling and
 * the rest of the UI smooth.
 */
export const HeroScene: React.FC<HeroSceneProps> = ({
  ready = true,
  lite = false,
  inputRef,
  onStart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctrl = useRef<SceneController | null>(null);
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const startRef = useRef(onStart);
  startRef.current = onStart;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = createScene(canvas, {
      lite,
      input: inputRef,
      onStart: () => startRef.current?.(),
    });
    ctrl.current = scene;
    if (!scene) startRef.current?.(); // no WebGL: just show the text
    scene?.setReady(readyRef.current);
    return () => {
      scene?.dispose();
      ctrl.current = null;
    };
  }, [lite, inputRef]);

  useEffect(() => {
    ctrl.current?.setReady(ready);
  }, [ready]);

  return (
    <div className={styles.scene} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
};

export default HeroScene;
