import type {
  DependencyDescription,
  DependencyKind,
  EntityDescription,
} from "@boundaries/elements";
import {
  describeDependency,
  describeEntity,
  getMatcher,
} from "@boundaries/policies";
import type { Rule } from "eslint";
import resolve from "eslint-module-utils/resolve";
import type { Identifier, ImportSpecifier } from "estree";

import { debugDescription } from "../Debug";
import type { SettingsNormalized } from "../Shared";

import type { EslintLiteralNode } from "./Elements.types";

/**
 * Returns the specifiers used in an import or export statement
 * @param node The source literal of the import or export
 * @returns The list of specifiers used in the import or export
 */
export function getSpecifiers(node: EslintLiteralNode): string[] {
  if (node.parent.type === "ImportDeclaration") {
    return node.parent.specifiers
      .filter(
        (specifier) =>
          specifier.type === "ImportSpecifier" &&
          specifier.imported &&
          (specifier.imported as Identifier).name
      )
      .map(
        (specifier) =>
          ((specifier as ImportSpecifier).imported as Identifier).name
      );
  }

  if (node.parent.type === "ExportNamedDeclaration") {
    return node.parent.specifiers
      .filter(
        (specifier) =>
          specifier.type === "ExportSpecifier" &&
          (specifier.exported as Identifier).name
      )
      .map((specifier) => (specifier.exported as Identifier).name);
  }

  return [];
}

/**
 * Returns the description of the current entity being linted
 * @param fileName The file name (absolute path)
 * @param settings The ESLint rule context settings normalized
 * @returns The description of the current entity being linted
 */
export function entityDescription(
  fileName: string,
  settings: SettingsNormalized
): EntityDescription {
  const result = describeEntity(settings, fileName);
  debugDescription(result, settings, getMatcher(settings));
  return result;
}

/**
 * Returns the description of a dependency node
 * @param options The dependency node info
 * @param options.node The dependency node
 * @param options.kind The kind of the dependency
 * @param options.nodeKind The kind of the node generating the dependency
 * @param fileName The file name (absolute path)
 * @param settings The ESLint rule context settings normalized
 * @param context The ESLint rule context
 * @returns The description of the dependency node
 */
export function dependencyDescription(
  {
    node,
    kind,
    nodeKind,
  }: {
    node: EslintLiteralNode;
    kind: DependencyKind;
    nodeKind?: string;
  },
  /** The file name (absolute path) */
  fileName: string,
  /** The ESLint rule context settings normalized */
  settings: SettingsNormalized,
  /** The ESLint rule context */
  context: Rule.RuleContext
): DependencyDescription {
  const source = String(node.value);
  const resolvedPath = resolve(source, context);

  const description = describeDependency(settings, {
    from: fileName,
    to: resolvedPath || undefined,
    source,
    kind: kind || "value",
    nodeKind,
    specifiers: getSpecifiers(node),
  });

  debugDescription(description, settings, getMatcher(settings));

  return description;
}
