import { useCallback, useEffect, useRef, useState } from "react";

import type { PlaygroundProps, Sketch } from "@/contract";
import type {
  SketchLoad,
  SketchLoader,
} from "@/domains/session/helpers/sketchLoad";

/** What a request loads: the sketch to start from, or the one that follows a reset. */
type LoadKind = "open" | "reset";

/** The source and the store to load the sketch from, and what to load. Each change of either makes a new one, even back to earlier ones, and so does each load that is asked for. */
type LoadRequest = {
  source: PlaygroundProps["source"];
  store: PlaygroundProps["store"];
  kind: LoadKind;
};

/** A settled load, with the request it answers and the number of the sketch that it put on screen */
type SettledLoad = {
  request: LoadRequest;
  sketchLoad: SketchLoad;
  generation: number;
};

const LOADING: SketchLoad = { status: "loading" };

/**
 * Loads the sketch to show: the one saved in the store or, when nothing is saved, the one of the source. It loads again, as the first time, when the store says that its sketch changed outside the playground, and it resets the sketch when it is asked to.
 * @param source Where the project comes from.
 * @param store Where the state is kept.
 * @returns The state of the load: loading, loaded with the sketch, or failed with the reason that the store or the source gave, with the number of the sketch on screen and the ways to reset it or to show another one. Each source and store load once, so the shell takes one sketch from them.
 */
export function useSketchLoad(
  source: PlaygroundProps["source"],
  store: PlaygroundProps["store"]
): SketchLoader {
  const [request, setRequest] = useState<LoadRequest>({
    source,
    store,
    kind: "open",
  });
  const [settledLoad, setSettledLoad] = useState<SettledLoad>();
  const generationRef = useRef(0);

  // A source or a store that comes back is loaded again, because the store may have saved edits since its last load. Comparing the source and the store of the settled load would show that load, and the shell would keep it
  if (request.source !== source || request.store !== store) {
    setRequest({ source, store, kind: "open" });
  }

  useEffect(() => {
    // A load that ends after the request changed, or after unmounting, must not replace the newer one
    let active = true;

    const settle = (sketchLoad: SketchLoad) => {
      if (active) {
        generationRef.current += 1;
        setSettledLoad({
          request,
          sketchLoad,
          generation: generationRef.current,
        });
      }
    };
    const load = async () => {
      try {
        let sketch: Sketch;

        if (request.kind === "reset") {
          await request.store.clear();
          sketch = await request.source.load();
        } else {
          sketch =
            (await request.store.load()) ?? (await request.source.load());
        }
        settle({ status: "loaded", sketch });
      } catch (error) {
        settle({ status: "failed", error });
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [request]);

  // A store that changes outside the playground, such as the hash of the URL, loads again. A new request replaces the one in flight, and the sketch on screen goes away until the new one arrives, as for the first load
  useEffect(
    () => store.subscribe?.(() => setRequest({ source, store, kind: "open" })),
    [source, store]
  );

  const reset = useCallback(
    () => setRequest({ source, store, kind: "reset" }),
    [source, store]
  );

  const show = useCallback(
    (sketch: Sketch) => {
      generationRef.current += 1;
      setSettledLoad({
        request,
        sketchLoad: { status: "loaded", sketch },
        generation: generationRef.current,
      });
    },
    [request]
  );

  // The sketch or the error of a previous request is not shown while the new one loads
  const settled = settledLoad?.request === request ? settledLoad : undefined;

  return {
    load: settled?.sketchLoad ?? LOADING,
    generation: settled?.generation ?? 0,
    reset,
    show,
  };
}
