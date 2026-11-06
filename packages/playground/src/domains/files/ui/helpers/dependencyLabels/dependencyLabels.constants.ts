import type { SketchDependencySyntax } from "@/contract";

import type {
  ImportKind,
  LabeledOption,
  SpecifierKind,
  SyntaxFacts,
} from "./dependencyLabels.types";

/** The syntaxes of a dependency, in the order the picker offers them, with the label the user reads. */
export const SYNTAX_OPTIONS: readonly LabeledOption<SketchDependencySyntax>[] =
  [
    { value: "import", label: "import" },
    { value: "export-from", label: "export … from" },
    { value: "require", label: "require()" },
    { value: "dynamic-import", label: "import()" },
  ];

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

/** What each syntax lets the user pick. `export … from` holds named names (`default` is a name there) or one namespace; `require()` and `import()` hold no names and write values only. */
export const SYNTAX_FACTS: Readonly<
  Record<SketchDependencySyntax, SyntaxFacts>
> = {
  import: {
    importKinds: ["value", "type"],
    specifierKinds: ["default", "named", "namespace"],
  },
  "export-from": {
    importKinds: ["value", "type"],
    specifierKinds: ["named", "namespace"],
  },
  require: { importKinds: [], specifierKinds: [] },
  "dynamic-import": { importKinds: [], specifierKinds: [] },
};
