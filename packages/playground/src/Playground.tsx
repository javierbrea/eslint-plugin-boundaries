import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import type { PlaygroundProps, Sketch } from "./contract";
import { Root } from "./theme";
import { Placeholder } from "./ui";

/**
 * Loads the sketch to show: the one saved in the store or, when nothing is saved, the one of the source.
 * @param source Where the project comes from.
 * @param store Where the state is kept.
 * @returns The sketch, or `undefined` while it loads.
 */
function useSketch(
  source: PlaygroundProps["source"],
  store: PlaygroundProps["store"]
): Sketch | undefined {
  const [sketch, setSketch] = useState<Sketch>();

  useEffect(() => {
    let active = true;
    const load = async () => {
      const loaded = (await store.load()) ?? (await source.load());
      if (active) {
        setSketch(loaded);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [source, store]);

  return sketch;
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
  const sketch = useSketch(source, store);

  return (
    <Root>
      <Placeholder sketch={sketch} />
    </Root>
  );
}
