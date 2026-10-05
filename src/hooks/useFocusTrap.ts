import { useEffect, useRef } from "react";

interface UseFocusTrapOptions {
  isOpen: boolean;
  onClose: () => void;
}

export function useFocusTrap<T extends HTMLElement>({
  isOpen,
  onClose,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save previously focused element to restore upon close
    previousActiveElement.current =
      document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    if (!container) return;

    // Prevent background scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Find all focusable elements within dialog
    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    const getFocusableElements = (): HTMLElement[] => {
      if (!container) return [];
      return Array.from(container.querySelectorAll(focusableSelectors));
    };

    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Focus first element with preventScroll to ensure the viewport does not jump
      requestAnimationFrame(() => {
        focusableElements[0]?.focus({ preventScroll: true });
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const elements = getFocusableElements();
        if (elements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = elements[0];
        const lastElement = elements[elements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus({ preventScroll: true });
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus({ preventScroll: true });
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;

      // Restore focus to trigger element without page jumping
      if (
        previousActiveElement.current &&
        typeof previousActiveElement.current.focus === "function"
      ) {
        previousActiveElement.current.focus({ preventScroll: true });
      }
    };
  }, [isOpen, onClose]);

  return containerRef;
}
