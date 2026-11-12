import type { InspectorPlace } from "./inspectorPlaces.types";

/** Every place of the file inspector that folds, in the order it draws them. */
export const INSPECTOR_PLACES: readonly InspectorPlace[] = [
  "from",
  "from.element",
  "from.file",
  "from.module",
  "to",
  "to.element",
  "to.file",
  "to.module",
  "dependency",
];

/** The places that start folded: the module, which is `local` for almost every file of a project, and so is what the user reads least. */
export const FOLDED_BY_DEFAULT: readonly InspectorPlace[] = [
  "from.module",
  "to.module",
];
