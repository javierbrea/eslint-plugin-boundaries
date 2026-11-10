/** Where a dependency is: the file that has it, its line and the source its statement writes. */
export type DependencyLocation = {
  /** The path of the file that has the dependency. */
  readonly path: string;
  /** The line of the dependency in its file, after a colon, such as `:3`. */
  readonly position: string;
  /** The source that the statement of the dependency writes, as written. */
  readonly source: string;
};
