import { Elements } from "@boundaries/elements";
import type {
  Matcher,
  DependencyDescription,
  DependencyKind,
  EntityDescription,
} from "@boundaries/elements";
import type { Rule } from "eslint";
import resolve from "eslint-module-utils/resolve";
import type { Identifier, ImportSpecifier } from "estree";

import { debugDescription } from "../Debug";
import type { SettingsNormalized } from "../Shared";

import type { EslintLiteralNode } from "./Elements.types";

const elements = new Elements();

/**
 * Returns the elements matcher based on the ESLint rule context settings already normalized, filtering out invalid descriptors
 * @param settings The ESLint rule context settings normalized
 * @returns The elements matcher
 */
export function getElementsMatcher(settings: SettingsNormalized): Matcher {
  const elementsMatcher = elements.getMatcher(
    { elements: settings.elementDescriptors, files: settings.fileDescriptors },
    {
      ignorePaths: settings.ignorePaths,
      includePaths: settings.includePaths,
      legacyTemplates: settings.legacyTemplates,
      cache: settings.cache,
      flagAsExternal: settings.flagAsExternal,
      rootPath: settings.rootPath,
    }
  );
  return elementsMatcher;
}

/**
 * Returns the specifiers used in an import or export statement
 * @param node The AST node representing the import or export
 * @returns The list of specifiers used in the import or export
 */
export function getSpecifiers(node: Rule.Node): string[] {
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
  const matcher = getElementsMatcher(settings);
  const result = matcher.describeEntity(fileName);
  debugDescription(result, settings, matcher);
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
  const matcher = getElementsMatcher(settings);
  const resolvedPath = resolve(source, context);

  const description = matcher.describeDependency({
    from: fileName,
    to: resolvedPath || undefined,
    source,
    kind: kind || "value",
    nodeKind,
    specifiers: getSpecifiers(node),
  });

  debugDescription(description, settings, matcher);

  return description;
}
