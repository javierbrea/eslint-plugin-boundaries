import { SETTINGS } from "@boundaries/config";
import type {
  DependencyNodeSelector,
  SettingsNormalized,
} from "@boundaries/config";

import type {
  BuiltInSelectorGroup,
  ReadImportKind,
  ReadNode,
  ReadNodes,
} from "./DependencyNodes.types";

/** The import kinds of a statement, in the order the result lists them */
const IMPORT_KINDS: readonly ReadImportKind[] = ["value", "type"];

/** The built-in selectors of each syntax and each import kind, in the order of `DEFAULT_DEPENDENCY_NODES`: the analysis reads every statement of a syntax and an import kind through the run node of the first of them that has one */
const BUILT_IN_SELECTOR_GROUPS: readonly BuiltInSelectorGroup[] =
  Object.entries(SETTINGS.DEFAULT_DEPENDENCY_NODES).flatMap(
    ([syntax, builtIns]) =>
      IMPORT_KINDS.map((importKind) => ({
        syntax,
        importKind,
        selectors: builtIns
          .filter(({ kind }) => kind === importKind)
          .map(({ selector }) => selector),
      }))
  );

/** The built-in selectors of every syntax and every import kind: the only selectors that the analysis runs */
const BUILT_IN_SELECTORS: ReadonlySet<string> = new Set(
  BUILT_IN_SELECTOR_GROUPS.flatMap(({ selectors }) => selectors)
);

/**
 * Finds the node that ESLint runs for a selector.
 * @param nodes The dependency nodes of the settings.
 * @param selector A selector.
 * @returns The last node with that selector, or `undefined` when no node has it. The plugin keys its visitors by selector, so a node replaces the visitor of every node before it with the same selector.
 */
function findRunNode(
  nodes: readonly DependencyNodeSelector[],
  selector: string
): DependencyNodeSelector | undefined {
  return nodes.filter((node) => node.selector === selector).at(-1);
}

/**
 * Finds the node that ESLint runs for each built-in selector of a syntax and an import kind.
 * @param nodes The dependency nodes of the settings.
 * @param selectors The built-in selectors of the syntax and the import kind, in the order of `DEFAULT_DEPENDENCY_NODES`.
 * @returns The run node of each selector, in the same order, or `undefined` for a selector that no node has.
 */
function findRunNodes(
  nodes: readonly DependencyNodeSelector[],
  selectors: readonly string[]
): (DependencyNodeSelector | undefined)[] {
  return selectors.map((selector) => findRunNode(nodes, selector));
}

/**
 * Tells whether two run nodes read a statement alike.
 * @param node A run node, or `undefined` when its selector has none.
 * @param other Another run node, or `undefined` when its selector has none.
 * @returns Whether both are missing, or both exist with the same `name` and `kind` as the plugin uses them: it passes `kind || "value"` as the kind of the dependency, and `@boundaries/elements` gives the description `name || null` as its `nodeKind`, so a missing or empty `name` counts as none, and a missing or empty `kind` counts as `value`.
 */
function isSameRunNode(
  node: DependencyNodeSelector | undefined,
  other: DependencyNodeSelector | undefined
): boolean {
  if (node === undefined || other === undefined) {
    return node === other;
  }
  return (
    (node.name || null) === (other.name || null) &&
    (node.kind || "value") === (other.kind || "value")
  );
}

/**
 * Finds, for each syntax and each import kind, the dependency node that the analysis reads its statements through.
 * @param settings The normalized settings, whose `dependencyNodes` hold the selectors of `boundaries/dependency-nodes` followed by the valid ones of `boundaries/additional-dependency-nodes`.
 * @returns For each syntax, by the key of its built-in nodes such as `require`, and each import kind, `value` or `type`, the `name` and the `kind` of the run node of the first built-in selector of that syntax and that `kind` that has one, in the order of `DEFAULT_DEPENDENCY_NODES`, whatever its own `name` and `kind` are. The run node of a selector is the last node with it: the plugin keys its visitors by selector, so that node is the one that runs, and it passes its `name` as the node kind and its `kind` as the kind of the dependency. The analysis cannot run a selector, so a selector that is not a built-in one reads nothing, whatever its name is. The analysis does not tell the forms of a syntax apart, such as `require('x')` and `import x = require('x')`, so when the run nodes of the built-in selectors of a syntax and kind differ, or only some of them have one, it reads every form through that one, while ESLint reads each form through the run node of its own selector, or not at all; `areDependencyNodesReadAsESLint` tells when. A syntax or an import kind that no node reads is left out.
 */
export function getReadNodes(settings: SettingsNormalized): ReadNodes {
  const readNodes = new Map<string, Map<ReadImportKind, ReadNode>>();
  for (const { syntax, importKind, selectors } of BUILT_IN_SELECTOR_GROUPS) {
    const node = findRunNodes(settings.dependencyNodes, selectors).find(
      (found) => found !== undefined
    );
    if (node !== undefined) {
      const byImportKind =
        readNodes.get(syntax) ?? new Map<ReadImportKind, ReadNode>();
      byImportKind.set(importKind, { name: node.name, kind: node.kind });
      readNodes.set(syntax, byImportKind);
    }
  }
  return readNodes;
}

/**
 * Tells whether the analysis reads the statements of a project through the dependency nodes of the settings as ESLint does.
 * @param settings The normalized settings, whose `dependencyNodes` hold the selectors of `boundaries/dependency-nodes` followed by the valid ones of `boundaries/additional-dependency-nodes`.
 * @returns False when a node has a selector that is not one of the built-in selectors of `DEFAULT_DEPENDENCY_NODES`, which the analysis does not run, or when, for some syntax and import kind, the built-in selectors do not all have the same run node, the last node with each selector: one has a node and another has none, or their nodes differ in `name` or `kind` as the plugin uses them, while the analysis reads every statement of them through one node, as `getReadNodes` says. True otherwise, as for the default nodes. Only `boundaries/additional-dependency-nodes` makes it false: `boundaries/dependency-nodes` adds every built-in selector of a syntax with the same `name` and `kind`.
 */
export function areDependencyNodesReadAsESLint(
  settings: SettingsNormalized
): boolean {
  const nodes = settings.dependencyNodes;
  return (
    nodes.every(({ selector }) => BUILT_IN_SELECTORS.has(selector)) &&
    BUILT_IN_SELECTOR_GROUPS.every(({ selectors }) => {
      const [first, ...others] = findRunNodes(nodes, selectors);
      return others.every((node) => isSameRunNode(first, node));
    })
  );
}
