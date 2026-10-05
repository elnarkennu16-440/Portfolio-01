import { useEffect, useRef } from "react";

interface PointerParallaxRefs {
  containerRef: React.RefObject<HTMLDivElement | null>;
  cutoutRef: React.RefObject<HTMLDivElement | null>;
  backdropRef: React.RefObject<HTMLDivElement | null>;
  lightOverlayRef: React.RefObject<HTMLDivElement | null>;
}

export function usePointerParallax(): PointerParallaxRefs {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cutoutRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const lightOverlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check system preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

    if (prefersReducedMotion) {
      // Keep static for reduced motion
      return;
    }

    let isVisible = true;
    let isTabActive = !document.hidden;
    let animationFrameId: number;

    // Pointer coordinates normalized from -1 to 1
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let lastPointerTime = performance.now();

    const handlePointerMove = (e: PointerEvent) => {
      if (!hasFinePointer) return;

      const rect = container.getBoundingClientRect();
      // Calculate cursor relative to center of container
      const relX = (e.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
      const relY = (e.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2);

      // Clamp between -1 and 1
      targetX = Math.max(-1, Math.min(1, relX));
      targetY = Math.max(-1, Math.min(1, relY));
      lastPointerTime = performance.now();
    };

    const handlePointerLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    // Render loop with lerp (0.08) and idle breathing
    const renderLoop = (time: number) => {
      if (isVisible && isTabActive) {
        // Lerp towards target
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;

        // Idle breathing calculation (always active or smooth when pointer is still)
        const idleElapsed = time - lastPointerTime;
        const idleWeight = hasFinePointer ? Math.min(1, Math.max(0, (idleElapsed - 1500) / 1000)) : 1;
        const breathY = Math.sin(time * 0.0016) * (1.8 * idleWeight);

        // Calculate 3D rotations (max ~6 degrees)
        const rotY = (currentX * 6.5).toFixed(2);
        const rotX = (-currentY * 5.5).toFixed(2);

        // Apply to cutout layer (front depth)
        if (cutoutRef.current) {
          const transX = (currentX * 8).toFixed(2);
          const transY = (currentY * 6 + breathY).toFixed(2);
          cutoutRef.current.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translate3d(${transX}px, ${transY}px, 16px)`;
        }

        // Apply to backdrop aura layer (back depth - moves slightly opposite for parallax)
        if (backdropRef.current) {
          const bgX = (-currentX * 12).toFixed(2);
          const bgY = (-currentY * 8 - breathY * 0.5).toFixed(2);
          backdropRef.current.style.transform = `translate3d(${bgX}px, ${bgY}px, -20px)`;
        }

        // Apply to subtle lighting overlay
        if (lightOverlayRef.current) {
          const lightX = 50 + currentX * 20;
          const lightY = 40 + currentY * 20;
          lightOverlayRef.current.style.background = `radial-gradient(circle at ${lightX.toFixed(1)}% ${lightY.toFixed(1)}%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 65%)`;
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    // Start loop
    animationFrameId = requestAnimationFrame(renderLoop);

    // Visibility and tab state listeners
    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Pause when hero is out of screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // Attach pointer event listeners
    if (hasFinePointer) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      document.addEventListener("pointerleave", handlePointerLeave);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();

      if (hasFinePointer) {
        window.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerleave", handlePointerLeave);
      }
    };
  }, []);

  return { containerRef, cutoutRef, backdropRef, lightOverlayRef };
}
