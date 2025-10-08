import type { ImportKind } from "../constants/settings";

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
  importKind: ImportKind;
  relationship: ElementsRelationship;
  isInternal: boolean;
  baseModule: string | null;
};
