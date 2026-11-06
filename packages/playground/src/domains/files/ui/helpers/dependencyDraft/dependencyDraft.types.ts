import type { SketchDependencySyntax, SketchSpecifier } from "@/contract";
import type { ImportKind } from "@/domains/files/ui/helpers/dependencyLabels";

/** What the user has set in the picker of a dependency so far. It keeps the file and the module apart, so that switching the kind of target brings back what each one had. */
export type DependencyDraft = {
  /** Whether the target is a file of the sketch or an external module. */
  readonly targetKind: "node" | "external";
  /** The file picked, or `null` while none is. */
  readonly file: string | null;
  /** The name of the module as it was typed. */
  readonly module: string;
  /** Syntax of the statement. */
  readonly syntax: SketchDependencySyntax;
  /** Whether the statement imports values or only types. */
  readonly importKind: ImportKind;
  /** The names of the statement, in the order the user added them. */
  readonly specifiers: readonly SketchSpecifier[];
};
