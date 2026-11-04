import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import type { PlaygroundProps, Sketch } from "./contract";
import { Root } from "./theme";
import { LoadState, Workbench } from "./ui";
import type { SketchLoad } from "./ui";

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
 * @returns The state of the load: loading, loaded with the sketch, or failed with the reason that the store or the source gave. Each source and store load once, so the workbench takes one sketch from them.
 */
function useSketch(
  source: PlaygroundProps["source"],
  store: PlaygroundProps["store"]
): SketchLoad {
  const [request, setRequest] = useState<LoadRequest>({ source, store });
  const [settledLoad, setSettledLoad] = useState<SettledLoad>();

  // A source or a store that comes back is loaded again, because the store may have saved edits since its last load. Comparing the source and the store of the settled load would show that load, and the workbench would keep it
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

/**
 * The playground: classifies the files of a project and evaluates its dependencies against a boundaries config. The host owns the page and its theme, and passes the project and the store.
 * @param props Playground props.
 * @param props.source Where the project comes from, and what the user can change in it.
 * @param props.store Where the state is kept.
 * @returns The playground.
 */
export function Playground({
  source,
  store,
}: Readonly<PlaygroundProps>): ReactNode {
  const sketchLoad = useSketch(source, store);

  // The workbench reports the sketches that edits make, and never the one that was loaded. A save that fails shows nothing in M1: the memory store cannot fail, and what a store that can fail does is for the host that has one
  const save = useCallback(
    async (sketch: Sketch) => {
      try {
        await store.save(sketch);
      } catch {
        // Nothing to show: the sketch stays on screen, and the next edit saves again
      }
    },
    [store]
  );

  return (
    <Root>
      {sketchLoad.status === "loaded" ? (
        <Workbench
          initialSketch={sketchLoad.sketch}
          capabilities={source.capabilities}
          onSketchChange={(sketch) => void save(sketch)}
        />
      ) : (
        <LoadState load={sketchLoad} />
      )}
    </Root>
  );
}
