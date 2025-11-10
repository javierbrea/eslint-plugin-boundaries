import { Elements } from "@boundaries/elements";
import type {
  Matcher,
  DependencyDescription,
  DependencyKind,
  ElementDescription,
} from "@boundaries/elements";
import type { Rule } from "eslint";
import resolve from "eslint-module-utils/resolve";
import type { Identifier, ImportSpecifier } from "estree";

import type { SettingsNormalized } from "../Settings";
import { debugDescription } from "../Support";

import type { EslintLiteralNode } from "./Elements.types";

const elements = new Elements();

/**
 * Returns the elements matcher based on the ESLint rule context, filtering out invalid descriptors
 * @param context The ESLint rule context
 * @returns The elements matcher
 */
export function getElementsMatcher(settings: SettingsNormalized): Matcher {
  const elementsMatcher = elements.getMatcher(settings.elementDescriptors, {
    ignorePaths: settings.ignorePaths,
    includePaths: settings.includePaths,
    legacyTemplates: settings.legacyTemplates,
  });
  return elementsMatcher;
}

/**
 * Replaces backslashes with forward slashes in a given path
 * @param filePath The file path to modify
 * @returns The modified file path with forward slashes
 */
function replacePathSlashes(filePath: string) {
  return filePath.replaceAll("\\", "/");
}

/**
 * Transforms an absolute path into a project-relative path
 * @param absolutePath The absolute path to transform
 * @param rootPath The root path of the project
 * @returns The relative path from the project root
 */
function projectPath(
  absolutePath: string | undefined | null,
  rootPath: string
) {
  if (absolutePath) {
    // TODO: Use path.relative when possible. With caution because this would break current external paths
    return replacePathSlashes(absolutePath).replace(
      `${replacePathSlashes(rootPath)}/`,
      ""
    );
  }
  return "";
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
 * Returns the description of the current file being linted
 * @param fileName The file name
 * @param settings The ESLint rule context settings normalized
 * @returns The description of the current file being linted
 */
export function elementDescription(
  fileName: string,
  settings: SettingsNormalized
): ElementDescription {
  const matcher = getElementsMatcher(settings);
  const path = projectPath(fileName, settings.rootPath);
  const result = matcher.describeElement(path);
  debugDescription(result);
  return result;
}

/**
 * Returns the description of a dependency node
 * @param param0 The dependency node info
 * @param context The ESLint rule context
 * @returns The description of the dependency node
 */
export function dependencyDescription(
  {
    node,
    kind,
    nodeKind,
  }: {
    /** The dependency node */
    node: EslintLiteralNode;
    /** The kind of the dependency */
    kind: DependencyKind;
    /** The kind of the node generating the dependency */
    nodeKind?: string;
  },
  /** The file name */
  fileName: string,
  /** The ESLint rule context settings normalized */
  settings: SettingsNormalized,
  /** The ESLint rule context */
  context: Rule.RuleContext
): DependencyDescription {
  const source = String(node.value);
  const matcher = getElementsMatcher(settings);

  const description = matcher.describeDependency({
    from: projectPath(fileName, settings.rootPath),
    to: projectPath(resolve(source, context), settings.rootPath),
    source,
    kind: kind || "value", // TODO: Change by runtime in a backwards compatible way
    nodeKind,
    specifiers: getSpecifiers(node),
  });

  debugDescription(description);

  return description;
}
