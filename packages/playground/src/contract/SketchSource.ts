import type { ProjectCapabilities, ProjectSource } from "./ProjectSource.types";
import type { Sketch } from "./Sketch.types";

/** A sketch with an empty config and no files */
export const EMPTY_SKETCH: Sketch = {
  config: "{\n  settings: {},\n  rules: {},\n}\n",
  tree: [],
  dependencies: [],
};

/** Source of a sketch kept in memory, where everything can be edited. The website host uses it */
export class SketchSource implements ProjectSource {
  public readonly capabilities: ProjectCapabilities = {
    editTree: true,
    editDependencies: true,
    editConfig: true,
  };

  private readonly _sketch: Sketch;

  /**
   * Creates a source of a sketch.
   * @param sketch The sketch to start from. Defaults to {@link EMPTY_SKETCH}.
   */
  constructor(sketch: Sketch = EMPTY_SKETCH) {
    this._sketch = sketch;
  }

  public load(): Promise<Sketch> {
    return Promise.resolve(this._sketch);
  }
}
