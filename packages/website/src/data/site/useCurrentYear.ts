import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useSyncExternalStore } from "react";

// The year does not change while the page is open
const subscribe = () => () => undefined;

const getCurrentYear = () => new Date().getFullYear();

/**
 * Returns the current year: the build year during SSR and hydration, and the visitor's year afterwards.
 * @returns The current year.
 */
export function useCurrentYear(): number {
  // Serialized at build time (`customFields.buildYear` in docusaurus.config.ts), so SSR and hydration agree
  const buildYear = Number(
    useDocusaurusContext().siteConfig.customFields?.buildYear
  );
  return useSyncExternalStore(subscribe, getCurrentYear, () => buildYear);
}
