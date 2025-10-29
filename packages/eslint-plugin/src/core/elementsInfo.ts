import {
  ELEMENT_ORIGINS_MAP,
  DEPENDENCY_RELATIONSHIPS_MAP,
  isIgnoredElement,
  isExternalDependencyElement,
} from "@boundaries/elements";
import type { DependencyKind } from "@boundaries/elements";
import type { Rule } from "eslint";
import resolve from "eslint-module-utils/resolve";
import type { Identifier, ImportSpecifier } from "estree";

import type { DependencyInfo } from "../constants/DependencyInfo.types";
import type { FileInfo } from "../constants/ElementsInfo.types";
import { getElementsDescriptor } from "../elements/elements";
import { debugElementDescription } from "../helpers/debug";
import { getRootPath } from "../helpers/settings";

import type { EslintLiteralNode } from "./elementsInfo.types";

function replacePathSlashes(absolutePath: string) {
  return absolutePath.replace(/\\/g, "/");
}

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

export function fileInfo(context: Rule.RuleContext): FileInfo {
  const elementsDescriptors = getElementsDescriptor(context);
  const path = projectPath(context.filename, getRootPath(context.settings));
  const result = elementsDescriptors.describeElement(path);
  debugElementDescription(result);
  // @ts-expect-error Types are not aligned yet
  return result;
}

export function dependencyInfo(
  {
    node,
    kind,
    nodeKind,
  }: {
    node: EslintLiteralNode;
    kind: DependencyKind;
    nodeKind?: string;
  },
  context: Rule.RuleContext
): DependencyInfo {
  const source = String(node.value);
  const elementsDescriptors = getElementsDescriptor(context);

  const dependencyData = elementsDescriptors.describeDependency({
    from: projectPath(context.filename, getRootPath(context.settings)),
    to: projectPath(resolve(source, context), getRootPath(context.settings)),
    source,
    kind: kind || "value", // TODO: Change by runtime in a backwards compatible way
    nodeKind,
    specifiers: getSpecifiers(node),
  });

  debugElementDescription(dependencyData.to);

  // TODO: Align types, use the data from elements package directly
  return {
    ...dependencyData.to,
    isLocal: dependencyData.to.origin === ELEMENT_ORIGINS_MAP.LOCAL,
    isBuiltIn: dependencyData.to.origin === ELEMENT_ORIGINS_MAP.CORE,
    isExternal: dependencyData.to.origin === ELEMENT_ORIGINS_MAP.EXTERNAL,
    isIgnored: isIgnoredElement(dependencyData.to),
    baseModule: isExternalDependencyElement(dependencyData.to)
      ? dependencyData.to.baseSource
      : null,
    importKind: dependencyData.dependency.kind,
    // @ts-expect-error Support nephews in relationship
    relationship:
      dependencyData.dependency.relationship.to ===
      DEPENDENCY_RELATIONSHIPS_MAP.SIBLING
        ? DEPENDENCY_RELATIONSHIPS_MAP.BROTHER
        : dependencyData.dependency.relationship.to,
    isInternal:
      dependencyData.dependency.relationship.to ===
      DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL,
    originalDescription: dependencyData,
  };
}
