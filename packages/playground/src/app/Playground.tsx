import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { PlaygroundProps, Sketch } from "@/contract";
import { EXAMPLES } from "@/domains/examples/data/examples";
import type { Example } from "@/domains/examples/data/examples";
import { findSameSketch, isSameSketch } from "@/domains/project/helpers/sketch";
import { useSketchLoad } from "@/domains/session/data/sketchLoad";
import { useSourceSketch } from "@/domains/session/data/sourceSketch";
import { Shell } from "@/domains/shell/modules/Shell";
import { LoadState } from "@/domains/shell/ui/atoms/LoadState";
import { ReplaceSketchDialog } from "@/domains/shell/ui/atoms/ReplaceSketchDialog";
import { ThemeRoot } from "@/ui-kit/providers/ThemeRoot";

import { PLAYGROUND_TEST_ID } from "./Playground.constants";
import type {
  ConfirmedReplacement,
  FocusRequest,
  Replacement,
} from "./Playground.types";

/**
 * The playground: classifies the files of a project and evaluates its dependencies against a boundaries config. The host owns the page and its theme, and passes the project and the store.
 * @param props Playground props.
 * @param props.source Where the project comes from, and what the user can change in it.
 * @param props.store Where the state is kept.
 * @param props.guideUrl The URL of the playground guide, which the help links to. The help draws no link to it without it.
 * @param props.quickStartUrl The URL of the Quick start guide, which the help links to. The help draws no link to it without it.
 * @returns The playground.
 */
export function Playground({
  source,
  store,
  guideUrl,
  quickStartUrl,
}: Readonly<PlaygroundProps>): ReactNode {
  const { load, generation, reset, show } = useSketchLoad(source, store);
  const getSourceSketch = useSourceSketch(source);
  // What the confirmation asks about, which stays while the dialog fades out, and the sketch it was asked about: a sketch that comes from outside makes a new generation, and the question about the old one goes with it
  const [replacement, setReplacement] = useState<Replacement>({
    kind: "reset",
  });
  const [askedAbout, setAskedAbout] = useState<number | undefined>(undefined);
  // The replacement that the user confirmed, which waits for the dialog to be gone before it comes on screen
  const [confirmed, setConfirmed] = useState<ConfirmedReplacement | undefined>(
    undefined
  );
  // The control that had the keyboard focus goes with the old shell when a replacement shows a new one, so the new shell is asked to focus the control that made the replacement. The request is for the first sketch that comes on screen after it, so a sketch that comes from outside later does not take the focus from where the user is
  const [focusRequest, setFocusRequest] = useState<FocusRequest | undefined>(
    undefined
  );

  if (
    focusRequest !== undefined &&
    focusRequest.shell === undefined &&
    generation > focusRequest.after
  ) {
    setFocusRequest({ ...focusRequest, shell: generation });
  }

  // The shell reports the sketches that edits make, and never the one that was loaded. A save that fails shows nothing: the sketch stays on screen, and the next edit saves again
  const save = useCallback(
    async (sketch: Sketch) => {
      try {
        await store.save(sketch);
      } catch {
        // Nothing to show: the next edit saves again
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

  // Share is offered only by a store that can make a link, which it makes with its own state: the method goes with the store it belongs to
  const makeLink = useMemo(() => store.share?.bind(store), [store]);

  // Puts the replacement on screen as a new sketch: the one of the source after the store forgets its own, or an example that the store keeps
  const replace = useCallback(
    (replacing: Replacement) => {
      if (replacing.kind === "reset") {
        setFocusRequest({ target: "reset", after: generation });
        reset();
      } else {
        setFocusRequest({ target: "examples", after: generation });
        void save(replacing.example.sketch);
        show(replacing.example.sketch);
      }
    },
    [generation, reset, save, show]
  );
  // The button of a failed load resets the sketch as the one of the top bar does, so the new shell takes the focus in the same way
  const resetAfterFailure = useCallback(() => {
    setFocusRequest({ target: "reset", after: generation });
    reset();
  }, [generation, reset]);

  // A replacement loses the edits of the user unless the sketch on screen is something that comes back: an example, or the sketch of the source. The examples are static, so they are compared at once. The sketch of the source is asked for only when it is needed and only once for the source (`useSourceSketch`), so a source that reads a project from disk is not read for a sketch that is an example, and a source that cannot be read leaves no way to tell, so the user is asked
  const requestReplacement = useCallback(
    (replacing: Replacement, current: Sketch) => {
      if (findSameSketch(EXAMPLES, current) !== undefined) {
        replace(replacing);
        return;
      }
      void getSourceSketch().then((sourceSketch) => {
        if (sourceSketch !== undefined && isSameSketch(current, sourceSketch)) {
          replace(replacing);
        } else {
          setReplacement(replacing);
          setAskedAbout(generation);
        }
      });
    },
    [replace, getSourceSketch, generation]
  );

  const handleReset = useCallback(
    (current: Sketch) => requestReplacement({ kind: "reset" }, current),
    [requestReplacement]
  );
  const handleSelectExample = useCallback(
    (example: Example, current: Sketch) =>
      requestReplacement({ kind: "example", example }, current),
    [requestReplacement]
  );

  const cancelReplacement = useCallback(() => setAskedAbout(undefined), []);
  const confirmReplacement = useCallback(() => {
    setAskedAbout(undefined);
    setConfirmed({ replacement, askedAbout });
  }, [replacement, askedAbout]);
  // The dialog keeps the keyboard focus while it fades out. A new shell that came on screen with it would ask for the focus and lose it to the dialog, and the focus would fall to the page when the dialog leaves, so the confirmed replacement waits for the dialog to be gone. The sketch on screen can change meanwhile, because the store or the host changed it, and the user confirmed about another one: the replacement is dropped then, so it does not overwrite what came from outside
  const replaceConfirmed = useCallback(() => {
    if (confirmed !== undefined) {
      setConfirmed(undefined);
      if (confirmed.askedAbout === generation) {
        replace(confirmed.replacement);
      }
    }
  }, [confirmed, generation, replace]);

  return (
    <ThemeRoot testId={PLAYGROUND_TEST_ID}>
      {load.status === "loaded" ? (
        // The generation makes a new shell for each sketch that comes from outside, even when it is equal to the one on screen
        <Shell
          key={generation}
          initialSketch={load.sketch}
          capabilities={source.capabilities}
          onSketchChange={handleSketchChange}
          guideUrl={guideUrl}
          quickStartUrl={quickStartUrl}
          onReset={handleReset}
          onSelectExample={handleSelectExample}
          makeLink={makeLink}
          initialFocus={
            focusRequest?.shell === generation ? focusRequest.target : undefined
          }
        />
      ) : (
        <LoadState load={load} onReset={resetAfterFailure} />
      )}
      <ReplaceSketchDialog
        isOpen={askedAbout === generation}
        replacement={
          replacement.kind === "reset"
            ? replacement
            : { kind: "example", title: replacement.example.title }
        }
        onCancel={cancelReplacement}
        onConfirm={confirmReplacement}
        onExited={replaceConfirmed}
      />
    </ThemeRoot>
  );
}
