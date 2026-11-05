import { useEffect, useState } from "react";

import type { PlaygroundProps } from "@/contract";
import type { SketchLoad } from "@/domains/session/helpers/sketchLoad";

/** The source and the store to load the sketch from. Each change of either makes a new one, even back to earlier ones */
type LoadRequest = {
  source: PlaygroundProps["source"];
  store: PlaygroundProps["store"];
};

/** A settled load, with the request it answers */
type SettledLoad = {
  request: LoadRequest;
  sketchLoad: SketchLoad;
};

const LOADING: SketchLoad = { status: "loading" };

/**
 * Loads the sketch to show: the one saved in the store or, when nothing is saved, the one of the source.
 * @param source Where the project comes from.
 * @param store Where the state is kept.
 * @returns The state of the load: loading, loaded with the sketch, or failed with the reason that the store or the source gave. Each source and store load once, so the shell takes one sketch from them.
 */
export function useSketchLoad(
  source: PlaygroundProps["source"],
  store: PlaygroundProps["store"]
): SketchLoad {
  const [request, setRequest] = useState<LoadRequest>({ source, store });
  const [settledLoad, setSettledLoad] = useState<SettledLoad>();

  // A source or a store that comes back is loaded again, because the store may have saved edits since its last load. Comparing the source and the store of the settled load would show that load, and the shell would keep it
  if (request.source !== source || request.store !== store) {
    setRequest({ source, store });
  }

  useEffect(() => {
    // A load that ends after the request changed, or after unmounting, must not replace the newer one
    let active = true;
    const load = async () => {
      try {
        const sketch =
          (await request.store.load()) ?? (await request.source.load());
        if (active) {
          setSettledLoad({
            request,
            sketchLoad: { status: "loaded", sketch },
          });
        }
      } catch (error) {
        if (active) {
          setSettledLoad({
            request,
            sketchLoad: { status: "failed", error },
          });
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [request]);

  // The sketch or the error of a previous request is not shown while the new one loads
  return settledLoad?.request === request ? settledLoad.sketchLoad : LOADING;
}
