import type { Sketch } from "@/contract";

/** State of the load of the sketch: loading, loaded with the sketch, or failed with the reason the source or the store gave. */
export type SketchLoad =
  | { status: "loading" }
  | { status: "loaded"; sketch: Sketch }
  | { status: "failed"; error: unknown };

/** A load that has not produced a sketch: the states that `LoadState` describes. */
export type PendingLoad = Exclude<SketchLoad, { status: "loaded" }>;

/** What the playground gets from the load of its sketch: the state of the load and the ways to start another one. */
export type SketchLoader = {
  /** The state of the load. */
  readonly load: SketchLoad;
  /** The number of the sketch that is on screen, which changes each time a sketch comes from outside the shell: a load, a reset or a sketch that the host shows. It is what tells a new shell from the same one, even when two sketches are equal. */
  readonly generation: number;
  /** Forgets the saved sketch in the store and loads the one of the source, which shows the loading and the failure of that load as the first load does. */
  readonly reset: () => void;
  /** Shows a sketch that the host already has, at once and with no load, as a new sketch from outside the shell. */
  readonly show: (sketch: Sketch) => void;
};
