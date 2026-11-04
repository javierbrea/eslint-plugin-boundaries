import type { Sketch } from "../contract";

/** State of the load of the sketch: loading, loaded with the sketch, or failed with the reason the source or the store gave. */
export type SketchLoad =
  | { status: "loading" }
  | { status: "loaded"; sketch: Sketch }
  | { status: "failed"; error: unknown };

/** A load that has not produced a sketch: the states that {@link LoadState} describes. */
export type PendingLoad = Exclude<SketchLoad, { status: "loaded" }>;

/** Props of {@link LoadState}. */
export type LoadStateProps = {
  /** The state of the load of the sketch. */
  load: PendingLoad;
};
