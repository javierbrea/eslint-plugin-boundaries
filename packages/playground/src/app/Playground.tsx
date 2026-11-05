import { useCallback } from "react";
import type { ReactNode } from "react";

import type { PlaygroundProps, Sketch } from "@/contract";
import { useSketchLoad } from "@/domains/session/data/sketchLoad";
import { Shell } from "@/domains/shell/modules/Shell";
import { LoadState } from "@/domains/shell/ui/atoms/LoadState";
import { ThemeRoot } from "@/ui-kit/providers/ThemeRoot";

import { PLAYGROUND_TEST_ID } from "./Playground.constants";

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
  const sketchLoad = useSketchLoad(source, store);

  // The shell reports the sketches that edits make, and never the one that was loaded. A save that fails shows nothing in M1: the memory store cannot fail, and what a store that can fail does is for the host that has one
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
  // The shell reports a sketch again when its callback changes, so the callback changes only with the store
  const handleSketchChange = useCallback(
    (sketch: Sketch) => {
      void save(sketch);
    },
    [save]
  );

  return (
    <ThemeRoot testId={PLAYGROUND_TEST_ID}>
      {sketchLoad.status === "loaded" ? (
        <Shell
          initialSketch={sketchLoad.sketch}
          capabilities={source.capabilities}
          onSketchChange={handleSketchChange}
        />
      ) : (
        <LoadState load={sketchLoad} />
      )}
    </ThemeRoot>
  );
}
