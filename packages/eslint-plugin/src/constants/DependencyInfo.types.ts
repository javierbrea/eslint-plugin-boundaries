import type { DependencyKind } from "@boundaries/elements";

import type { ImportInfo } from "./ElementsInfo.types";

export type ElementsRelationship =
  | "internal"
  | "child"
  | "descendant"
  | "brother"
  | "parent"
  | "uncle"
  | "ancestor"
  | null;

export type DependencyInfo = ImportInfo & {
  importKind: DependencyKind;
  relationship: ElementsRelationship;
  isInternal: boolean;
  baseModule: string | null;
};
