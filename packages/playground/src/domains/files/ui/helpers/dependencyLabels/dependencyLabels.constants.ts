import type { SketchDependencySyntax } from "@/contract";
import { SYNTAX_FACTS } from "@/domains/project/helpers/sketch";
import type {
  ImportKind,
  SpecifierKind,
} from "@/domains/project/helpers/sketch";

import type { LabeledOption } from "./dependencyLabels.types";

/** The syntaxes of a dependency, in the order of the table of the syntaxes of the sketch, with the name that table gives each one as the label the user reads. */
export const SYNTAX_OPTIONS: readonly LabeledOption<SketchDependencySyntax>[] =
  Object.entries(SYNTAX_FACTS).map(([value, facts]) => ({
    value: value as SketchDependencySyntax,
    label: facts.name,
  }));

/** The kinds of statement, in the order the picker offers them, with the label the user reads. */
export const IMPORT_KIND_OPTIONS: readonly LabeledOption<ImportKind>[] = [
  { value: "value", label: "value" },
  { value: "type", label: "type" },
];

/** The kinds of name, with the label the user reads. */
export const SPECIFIER_KIND_LABELS: Readonly<Record<SpecifierKind, string>> = {
  default: "default",
  named: "named",
  namespace: "namespace",
};

/** What the label of a file says when no element descriptor matches it. */
export const NO_ELEMENT_LABEL = "no element";
