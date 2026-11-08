import type { Sketch } from "./Sketch.types";
import type { StateStore } from "./StateStore.types";

/** Store that keeps the sketch in memory, so it is lost when the page reloads */
export class MemoryStore implements StateStore {
  private _sketch: Sketch | undefined;

  /**
   * Creates a store in memory.
   * @param sketch The sketch saved from the start, if any.
   */
  constructor(sketch?: Sketch) {
    this._sketch = sketch;
  }

  public load(): Promise<Sketch | undefined> {
    return Promise.resolve(this._sketch);
  }

  public save(sketch: Sketch): Promise<void> {
    this._sketch = sketch;
    return Promise.resolve();
  }

  public clear(): Promise<void> {
    this._sketch = undefined;
    return Promise.resolve();
  }
}
