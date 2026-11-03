import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import type { PlaygroundProps } from "./contract";
import { Root } from "./theme";
import { Placeholder } from "./ui";
import type { SketchLoad } from "./ui";

/** A settled load, with the source and the store it was loaded from */
type SettledLoad = {
  source: PlaygroundProps["source"];
  store: PlaygroundProps["store"];
  sketchLoad: SketchLoad;
};

const LOADING: SketchLoad = { status: "loading" };

/**
 * Loads the sketch to show: the one saved in the store or, when nothing is saved, the one of the source.
 * @param source Where the project comes from.
 * @param store Where the state is kept.
 * @returns The state of the load: loading, loaded with the sketch, or failed with the reason that the store or the source gave.
 */
function useSketch(
  source: PlaygroundProps["source"],
  store: PlaygroundProps["store"]
): SketchLoad {
  const [settledLoad, setSettledLoad] = useState<SettledLoad>();

  useEffect(() => {
    // A load that ends after the source or the store changed, or after unmounting, must not replace the newer one
    let active = true;
    const load = async () => {
      try {
        const sketch = (await store.load()) ?? (await source.load());
        if (active) {
          setSettledLoad({
            source,
            store,
            sketchLoad: { status: "loaded", sketch },
          });
        }
      } catch (error) {
        if (active) {
          setSettledLoad({
            source,
            store,
            sketchLoad: { status: "failed", error },
          });
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [source, store]);

  // The sketch or the error of a previous source or store is not shown while the new ones load
  return settledLoad?.source === source && settledLoad.store === store
    ? settledLoad.sketchLoad
    : LOADING;
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

  return (
    <Root>
      <Placeholder sketchLoad={sketchLoad} />
    </Root>
  );
}
