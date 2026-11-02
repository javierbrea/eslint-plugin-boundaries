import type { Sketch } from "./Sketch.types";

/** Where the state of the playground is kept and shared, such as the URL on the website or memory in a local app */
export interface StateStore {
  /**
   * Loads the saved sketch.
   * @returns The saved sketch, or `undefined` when nothing is saved.
   */
  load(): Promise<Sketch | undefined>;
  /**
   * Saves a sketch, replacing the saved one.
   * @param sketch The sketch to save.
   */
  save(sketch: Sketch): Promise<void>;
}
