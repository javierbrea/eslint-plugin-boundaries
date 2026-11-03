import type { Sketch } from "../contract";

/** State of the load of the sketch: loading, loaded with the sketch, or failed with the reason the source or the store gave. */
export type SketchLoad =
  | { status: "loading" }
  | { status: "loaded"; sketch: Sketch }
  | { status: "failed"; error: unknown };
