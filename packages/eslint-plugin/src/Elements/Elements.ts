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
import type { Expression, Identifier, ImportSpecifier } from "estree";

import { debugDescription } from "../Debug";
import type { SettingsNormalized } from "../Shared";
import { isString } from "../Shared";

import type {
  EslintDependencyNode,
  TypeScriptAssertion,
  TypeScriptAssertionType,
} from "./Elements.types";

const TYPESCRIPT_ASSERTION_TYPES: TypeScriptAssertionType[] = [
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSTypeAssertion",
  "TSNonNullExpression",
];

/**
 * Returns whether a node is a TypeScript assertion, which asserts the type of an expression without changing its value
 * @param node The node to check
 * @returns True if the node is a TypeScript assertion, false otherwise
 */
export function isTypeScriptAssertion(
  node: Expression | TypeScriptAssertion
): node is TypeScriptAssertion {
  return TYPESCRIPT_ASSERTION_TYPES.includes(
    node.type as TypeScriptAssertionType
  );
}

/**
 * Returns the source of a dependency when it is known statically: a string literal or a template literal without substitutions, inside any number of TypeScript assertions
 * @param node The node matched by a dependency node selector
 * @returns The source of the dependency, or null when it is only known at runtime or the node does not define one
 */
export function getDependencySource(node: EslintDependencyNode): string | null {
  let expression: Expression | TypeScriptAssertion = node;
  while (isTypeScriptAssertion(expression)) {
    expression = expression.expression;
  }

  if (expression.type === "Literal") {
    return isString(expression.value) ? expression.value : null;
  }

  if (
    expression.type === "TemplateLiteral" &&
    expression.expressions.length === 0
  ) {
    const source = expression.quasis[0].value.cooked;
    return isString(source) ? source : null;
  }

  return null;
}

/**
 * Returns the specifiers used in an import or export statement
 * @param node The source literal of the import or export
 * @returns The list of specifiers used in the import or export
 */
export function getSpecifiers(node: EslintDependencyNode): string[] {
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
 * @param options.source The source of the dependency, as returned by getDependencySource
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
    source,
    kind,
    nodeKind,
  }: {
    node: EslintDependencyNode;
    source: string;
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
