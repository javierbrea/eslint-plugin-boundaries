import { Elements, isElementDescriptor } from "@boundaries/elements";
import type {
  Matcher,
  DependencyDescription,
  DependencyKind,
  ElementDescription,
} from "@boundaries/elements";
import type { Rule } from "eslint";
import resolve from "eslint-module-utils/resolve";
import type { Identifier, ImportSpecifier } from "estree";

import { SETTINGS, getElements, getRootPath } from "../Settings";
import { warnOnce, debugDescription } from "../Support";

import type { EslintLiteralNode } from "./Elements.types";

export const elements = new Elements();

/**
 * Returns the elements matcher based on the ESLint rule context, filtering out invalid descriptors
 * @param context The ESLint rule context
 * @returns The elements matcher
 */
export function getElementsMatcher(context: Rule.RuleContext): Matcher {
  // NOTE: Filter valid descriptors only to avoid a breaking change for the moment

  const validDescriptors = getElements(context.settings).filter(
    isElementDescriptor
  );
  const invalidDescriptors = getElements(context.settings).filter(
    (desc) => !isElementDescriptor(desc)
  );
  if (invalidDescriptors.length > 0) {
    // TODO: Report invalid descriptors in ESLint context as a warning in a separate rule
    /* context.report({
      message: `Some element descriptors are invalid and will be ignored: ${JSON.stringify(
        invalidDescriptors,
      )}`,
      loc: { line: 1, column: 0 },
    });*/
    warnOnce(
      `Some element descriptors are invalid and will be ignored: ${JSON.stringify(
        invalidDescriptors
      )}`
    );
  }

  const elementsMatcher = elements.getMatcher(validDescriptors, {
    ignorePaths: context.settings[SETTINGS.IGNORE] as string[],
    includePaths: context.settings[SETTINGS.INCLUDE] as string[],
  });
  return elementsMatcher;
}

/**
 * Replaces backslashes with forward slashes in a given path
 * @param filePath The file path to modify
 * @returns The modified file path with forward slashes
 */
function replacePathSlashes(filePath: string) {
  return filePath.replace(/\\/g, "/");
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
 * @param context The ESLint rule context
 * @returns The description of the current file being linted
 */
export function elementDescription(
  // TODO: Pass matcher instead of context
  context: Rule.RuleContext
): ElementDescription {
  const matcher = getElementsMatcher(context);
  const path = projectPath(context.filename, getRootPath(context.settings));
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
  /** The ESLint rule context */
  // TODO: Pass matcher instead of context
  context: Rule.RuleContext
): DependencyDescription {
  const source = String(node.value);
  const matcher = getElementsMatcher(context);

  const description = matcher.describeDependency({
    from: projectPath(context.filename, getRootPath(context.settings)),
    to: projectPath(resolve(source, context), getRootPath(context.settings)),
    source,
    kind: kind || "value", // TODO: Change by runtime in a backwards compatible way
    nodeKind,
    specifiers: getSpecifiers(node),
  });

  debugDescription(description);

  return description;
}
