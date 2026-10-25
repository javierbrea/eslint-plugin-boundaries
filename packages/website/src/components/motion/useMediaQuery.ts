import { useCallback, useSyncExternalStore } from "react";

/**
 * Tracks a media query. It is `false` during SSR and hydration, and follows the query afterwards.
 * @param query The media query, such as `(hover: none)`.
 * @returns Whether the query matches.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}
