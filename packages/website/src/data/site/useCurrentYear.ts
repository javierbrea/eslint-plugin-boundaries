import { useSyncExternalStore } from "react";

// Year of the build. SSR and hydration use it, so the markup never mismatches
const BUILD_YEAR = new Date().getFullYear();

// The year does not change while the page is open
const subscribe = () => () => undefined;

/**
 * Returns the current year: the build year during SSR and hydration, and the visitor's year afterwards.
 * @returns The current year.
 */
export function useCurrentYear(): number {
  return useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => BUILD_YEAR
  );
}
