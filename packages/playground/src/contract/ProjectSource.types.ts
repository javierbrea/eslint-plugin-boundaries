import type { Sketch } from "./Sketch.types";

/** What the user can change in the project of a source */
export type ProjectCapabilities = {
  /** Whether files can be added, renamed and removed */
  readonly editTree: boolean;
  /** Whether the dependencies of the files can be added, changed and removed */
  readonly editDependencies: boolean;
  /** Whether the config can be edited */
  readonly editConfig: boolean;
};

/** Where the project comes from, which is what differs between hosts: a sketch kept in memory on the website, a project read from disk in a local app */
export interface ProjectSource {
  /** What the user can change in the project */
  readonly capabilities: ProjectCapabilities;
  /**
   * Loads the project.
   * @returns The project as a sketch.
   */
  load(): Promise<Sketch>;
}
