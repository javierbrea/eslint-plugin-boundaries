import { useEffect, useState } from "react";
import type { RefObject } from "react";

import { useReducedMotion } from "./useReducedMotion";

/** Options of {@link useReveal}. */
export type UseRevealOptions = {
  /** Stop observing once the element has been revealed. */
  once?: boolean;
};

/**
 * Tells when an element has entered the viewport (8% of it visible), to reveal it. With reduced motion it is always revealed.
 * @param ref The element to observe.
 * @param options Reveal options.
 * @returns Whether the element has been revealed.
 */
export function useReveal(
  ref: RefObject<Element | null>,
  { once = true }: UseRevealOptions = {}
): boolean {
  const [isIn, setIsIn] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element || reducedMotion) {
      return undefined;
    }
    if (typeof IntersectionObserver === "undefined") {
      // Browsers without the observer reveal everything right away
      const frame = requestAnimationFrame(() => setIsIn(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsIn(true);
            if (once) {
              observer.disconnect();
            }
          } else if (!once) {
            setIsIn(false);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, once, reducedMotion]);

  return isIn || reducedMotion;
}
