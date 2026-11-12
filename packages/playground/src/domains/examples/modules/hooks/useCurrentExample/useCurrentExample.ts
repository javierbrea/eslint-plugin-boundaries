import { EXAMPLES } from "@/domains/examples/data/examples";
import type { Example } from "@/domains/examples/data/examples";
import { findSameSketch } from "@/domains/project/helpers/sketch";
import { useSessionSelector } from "@/domains/session/data/store";

/**
 * Reads the example that the sketch on screen is: the first one of the examples that has the same config, files and dependencies. An edit makes it none, and an edit that undoes itself makes it one again.
 * @returns The example, or `undefined` when the sketch is none of them.
 */
export function useCurrentExample(): Example | undefined {
  return useSessionSelector((state) => findSameSketch(EXAMPLES, state.sketch));
}
