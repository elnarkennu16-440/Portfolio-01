import { useEffect, useRef, useState, useCallback } from "react";

export type LookDirection =
  | "center"
  | "up"
  | "up-right"
  | "right"
  | "down-right"
  | "down"
  | "down-left"
  | "left"
  | "up-left";

export interface LookFrameMap {
  id: LookDirection;
  file: string;
  label: string;
}

export const LOOK_FRAMES: LookFrameMap[] = [
  {
    id: "center",
    file: "looking-center.png",
    label: "Kennu looking straight forward",
  },
  { id: "up", file: "Looking-up.png", label: "Kennu looking up" },
  {
    id: "up-right",
    file: "looking-up-right.png",
    label: "Kennu looking up-right",
  },
  { id: "right", file: "looking-right.png", label: "Kennu looking right" },
  {
    id: "down-right",
    file: "looking-down-right.png",
    label: "Kennu looking down-right",
  },
  { id: "down", file: "looking-down.png", label: "Kennu looking down" },
  {
    id: "down-left",
    file: "looking-down-left.png",
    label: "Kennu looking down-left",
  },
  { id: "left", file: "looking-left.png", label: "Kennu looking left" },
  {
    id: "up-left",
    file: "looking-up-left.png",
    label: "Kennu looking up-left",
  },
];

interface UseLookAtPointerOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  basePath?: string;
}

export function useLookAtPointer({
  containerRef,
  basePath = "/images/profile/look/",
}: UseLookAtPointerOptions) {
  const [activeDirection, setActiveDirection] =
    useState<LookDirection>("center");
  const [previousDirection, setPreviousDirection] =
    useState<LookDirection>("center");
  const activeDirectionRef = useRef<LookDirection>("center");

  // Keep ref in sync and maintain solid previous frame to eliminate any black flicker
  const updateDirection = useCallback((dir: LookDirection) => {
    if (activeDirectionRef.current !== dir) {
      const prev = activeDirectionRef.current;
      activeDirectionRef.current = dir;
      setPreviousDirection(prev);
      setActiveDirection(dir);
    }
  }, []);

  // Pre-decode all 9 images directly into memory upfront
  useEffect(() => {
    LOOK_FRAMES.forEach((frame) => {
      const img = new Image();
      img.src = `${basePath}${frame.file}`;
      if ("decode" in img) {
        img.decode().catch(() => {});
      }
    });
  }, [basePath]);

  // Pointer and Touch movement tracking
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      updateDirection("center");
      return;
    }

    let rafId: number | null = null;
    let pendingX: number | null = null;
    let pendingY: number | null = null;
    let cachedRect: DOMRect | null = null;

    const getContainerRect = () => {
      if (!cachedRect && containerRef.current) {
        cachedRect = containerRef.current.getBoundingClientRect();
      }
      return cachedRect;
    };

    const invalidateRect = () => {
      cachedRect = null;
    };

    const processCoordinates = (clientX: number, clientY: number) => {
      const rect = getContainerRect();
      if (!rect) return;

      // If portrait is entirely offscreen (e.g. user scrolled past hero), skip computation
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        return;
      }

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.hypot(dx, dy);

      // Deadzone: if pointer/finger is on or very close to Kennu's face (within 18% width of portrait), look straight ahead
      const deadzone = rect.width * 0.18;
      if (distance < deadzone) {
        updateDirection("center");
        return;
      }

      // Compute angle in degrees:
      let deg = Math.atan2(dy, dx) * (180 / Math.PI);
      if (deg < 0) deg += 360;

      // 8 precise 45-degree sectors:
      if (deg >= 337.5 || deg < 22.5) {
        updateDirection("right");
      } else if (deg >= 22.5 && deg < 67.5) {
        updateDirection("down-right");
      } else if (deg >= 67.5 && deg < 112.5) {
        updateDirection("down");
      } else if (deg >= 112.5 && deg < 157.5) {
        updateDirection("down-left");
      } else if (deg >= 157.5 && deg < 202.5) {
        updateDirection("left");
      } else if (deg >= 202.5 && deg < 247.5) {
        updateDirection("up-left");
      } else if (deg >= 247.5 && deg < 292.5) {
        updateDirection("up");
      } else {
        updateDirection("up-right");
      }
    };

    const scheduleProcessing = (x: number, y: number) => {
      pendingX = x;
      pendingY = y;
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          if (pendingX !== null && pendingY !== null) {
            processCoordinates(pendingX, pendingY);
          }
          rafId = null;
        });
      }
    };

    // Desktop pointer tracker (mouse)
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // Touch is handled with touchmove for continuous finger drag
      scheduleProcessing(e.clientX, e.clientY);
    };

    const handlePointerLeave = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      updateDirection("center");
    };

    // Mobile finger slide/drag tracker
    let touchResetTimeout: number | undefined;

    const handleTouchStart = (e: TouchEvent) => {
      if (touchResetTimeout) window.clearTimeout(touchResetTimeout);
      const touch = e.touches[0];
      if (touch) {
        scheduleProcessing(touch.clientX, touch.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchResetTimeout) window.clearTimeout(touchResetTimeout);
      const touch = e.touches[0];
      if (touch) {
        scheduleProcessing(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      touchResetTimeout = window.setTimeout(() => {
        updateDirection("center");
      }, 500);
    };

    window.addEventListener("scroll", invalidateRect, { passive: true });
    window.addEventListener("resize", invalidateRect, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    document.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", invalidateRect);
      window.removeEventListener("resize", invalidateRect);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      if (touchResetTimeout) window.clearTimeout(touchResetTimeout);
    };
  }, [containerRef, updateDirection]);

  return {
    activeDirection,
    previousDirection,
    frames: LOOK_FRAMES,
  };
}
