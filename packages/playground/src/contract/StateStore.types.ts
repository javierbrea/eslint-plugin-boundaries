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
  /**
   * Forgets the saved sketch, so that the next {@link StateStore.load} returns `undefined`.
   */
  clear(): Promise<void>;
  /**
   * Makes a link that opens a sketch. The playground shows Share only when the store has this method.
   * @param sketch The sketch the link opens.
   * @returns The link, as an absolute URL.
   */
  share?(sketch: Sketch): Promise<string>;
  /**
   * Tells the playground when the saved sketch changes outside of it, such as a hash that the user changes in the address bar. The playground then loads the store again.
   * @param listener Called each time the saved sketch changes outside the playground.
   * @returns A function that removes the listener.
   */
  subscribe?(listener: () => void): () => void;
}
