import type { Sketch } from "../contract";

/** A sketch the playground ships with, for a host to start from or to offer in a list */
export type Example = {
  /** Stable id, such as `quick-start` */
  readonly id: string;
  /** Name shown to the user */
  readonly title: string;
  /** The project, its config and its dependencies */
  readonly sketch: Sketch;
};
