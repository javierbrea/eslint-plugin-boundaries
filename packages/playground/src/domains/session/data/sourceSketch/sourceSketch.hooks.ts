import { useCallback, useRef } from "react";

import type { PlaygroundProps, Sketch } from "@/contract";

/** The sketch that a source gave, still on its way or arrived, with the source that gave it */
type SourceLoad = {
  source: PlaygroundProps["source"];
  sketch: Promise<Sketch | undefined>;
};

/**
 * Gives the sketch of the source to whoever needs to compare something with it, such as the playground when it decides whether a reset would lose the edits of the user. The source loads the first time somebody asks, and that sketch is kept for as long as the source is the same, so that a source that reads a project from disk is read once, and only if it is needed. A load that fails is not kept, so the next ask tries again.
 * @param source Where the project comes from.
 * @returns A function that gets the sketch of the source, which is `undefined` when the source cannot load it. It is stable for the source.
 */
export function useSourceSketch(
  source: PlaygroundProps["source"]
): () => Promise<Sketch | undefined> {
  const loadRef = useRef<SourceLoad | undefined>(undefined);

  return useCallback(() => {
    if (loadRef.current?.source === source) {
      return loadRef.current.sketch;
    }

    const load: SourceLoad = {
      source,
      sketch: source.load().catch(() => {
        if (loadRef.current === load) {
          loadRef.current = undefined;
        }
        return undefined;
      }),
    };

    loadRef.current = load;
    return load.sketch;
  }, [source]);
}
