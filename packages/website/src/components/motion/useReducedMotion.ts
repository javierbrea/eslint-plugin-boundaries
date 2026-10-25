import { useMediaQuery } from "./useMediaQuery";

/**
 * Tracks the visitor's reduced motion preference. It is `false` during SSR and hydration.
 * @returns Whether the visitor asked for reduced motion.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
