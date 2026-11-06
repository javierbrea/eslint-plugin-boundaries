import type {
  SketchDependency,
  SketchDependencySyntax,
  SketchDependencyTarget,
} from "@/contract";
import {
  getDependencySource,
  getSyntaxFacts,
  toStatementTokens,
} from "@/domains/project/helpers/sketch";
import type {
  SourceResolver,
  StatementToken,
} from "@/domains/project/helpers/sketch";

import { PREVIEW_PLACEHOLDER } from "./dependencyDraft.constants";
import type { DependencyDraft } from "./dependencyDraft.types";

/**
 * Starts the draft of the picker: the dependency being edited, or an empty draft that imports values from a file of the sketch.
 * @param initial The dependency being edited. The draft is empty when it is unset.
 * @returns The draft. Of a target of one kind, the other kind starts empty.
 */
export function createDraft(initial?: SketchDependency): DependencyDraft {
  const target = initial?.target;

  return {
    targetKind: target?.kind ?? "node",
    file: target?.kind === "node" ? target.path : null,
    module: target?.kind === "external" ? target.name : "",
    syntax: initial?.syntax ?? "import",
    importKind: initial?.importKind ?? "value",
    specifiers: initial?.specifiers ?? [],
  };
}

/**
 * Changes the syntax of the draft. It keeps the names that the new syntax holds and drops the others, and goes back to `value` when the new syntax does not hold the kind the draft had, which is the case of `require()` and `import()`, which hold values only.
 * @param draft The draft to change.
 * @param syntax The new syntax.
 * @returns The new draft.
 */
export function changeSyntax(
  draft: DependencyDraft,
  syntax: SketchDependencySyntax
): DependencyDraft {
  const { importKinds, specifierKinds } = getSyntaxFacts(syntax);

  return {
    ...draft,
    syntax,
    importKind: importKinds.includes(draft.importKind)
      ? draft.importKind
      : "value",
    specifiers: draft.specifiers.filter(({ kind }) =>
      specifierKinds.includes(kind)
    ),
  };
}

/**
 * Gets the dependency a draft says, with a target that is given.
 * @param draft The draft.
 * @param from The path of the file the dependency belongs to.
 * @param target What the dependency points to.
 */
function withTarget(
  draft: DependencyDraft,
  from: string,
  target: SketchDependencyTarget
): SketchDependency {
  const { syntax, importKind, specifiers } = draft;

  return { from, target, syntax, importKind, specifiers };
}

/**
 * Gets the dependency a draft says.
 * @param draft The draft.
 * @param from The path of the file the dependency belongs to.
 * @returns The dependency, or `undefined` while the draft has no target: no file is picked, or the module has no name. The name of a module is taken without the spaces around it.
 */
export function toDependency(
  draft: DependencyDraft,
  from: string
): SketchDependency | undefined {
  const moduleName = draft.module.trim();

  if (draft.targetKind === "node") {
    return draft.file === null
      ? undefined
      : withTarget(draft, from, { kind: "node", path: draft.file });
  }
  return moduleName === ""
    ? undefined
    : withTarget(draft, from, { kind: "external", name: moduleName });
}

/**
 * Writes the statement of a draft, as the pieces that the preview colors. A draft with no target yet has `…` as its source.
 * @param draft The draft.
 * @param from The path of the file the dependency belongs to.
 * @param files The paths of the files of the sketch, which the source of a file is written among.
 * @param resolvers The resolvers of the config, which the source of a file is written for.
 * @returns The pieces of the statement, in order.
 */
export function getPreviewTokens(
  draft: DependencyDraft,
  from: string,
  files: readonly string[],
  resolvers: readonly SourceResolver[]
): readonly StatementToken[] {
  const dependency =
    toDependency(draft, from) ??
    withTarget(draft, from, { kind: "external", name: PREVIEW_PLACEHOLDER });

  return toStatementTokens(
    dependency,
    getDependencySource(files, dependency, resolvers)
  );
}
