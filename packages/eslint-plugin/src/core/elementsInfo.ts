import {
  ELEMENT_ORIGINS_MAP,
  DEPENDENCY_RELATIONSHIPS_MAP,
  isIgnoredElement,
} from "@boundaries/elements";
import type { DependencyKind } from "@boundaries/elements";
import type { Rule } from "eslint";
import resolve from "eslint-module-utils/resolve";

import type { DependencyInfo } from "../constants/DependencyInfo.types";
import type { FileInfo } from "../constants/ElementsInfo.types";
import { getElementsDescriptor } from "../elements/elements";
import { debugElementDescription } from "../helpers/debug";
import { getRootPath } from "../helpers/settings";

function replacePathSlashes(absolutePath: string) {
  return absolutePath.replace(/\\/g, "/");
}

function projectPath(
  absolutePath: string | undefined | null,
  rootPath: string,
) {
  if (absolutePath) {
    return replacePathSlashes(absolutePath).replace(
      `${replacePathSlashes(rootPath)}/`,
      "",
    );
  }
  return "";
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
  source: string,
  importKind: DependencyKind,
  context: Rule.RuleContext,
): DependencyInfo {
  const elementsDescriptors = getElementsDescriptor(context);
  const dependencyData = elementsDescriptors.describeDependency({
    from: projectPath(context.filename, getRootPath(context.settings)),
    to: projectPath(resolve(source, context), getRootPath(context.settings)),
    source,
    kind: importKind || "value",
    nodeKind: "ESM", // TODO: Pass the real node kind
    specifiers: [], // TODO: Pass specifiers
  });

  debugElementDescription(dependencyData.to);

  // TODO: Align types, use the data from elements package directly
  return {
    ...dependencyData.to,
    isLocal: dependencyData.to.origin === ELEMENT_ORIGINS_MAP.LOCAL,
    isBuiltIn: dependencyData.to.origin === ELEMENT_ORIGINS_MAP.CORE,
    isExternal: dependencyData.to.origin === ELEMENT_ORIGINS_MAP.EXTERNAL,
    isIgnored: isIgnoredElement(dependencyData.to),
    baseModule: !isIgnoredElement(dependencyData.to)
      ? dependencyData.to.baseSource
      : null,
    importKind: dependencyData.dependency.kind,
    // @ts-expect-error Support nephews in relationship
    relationship:
      dependencyData.dependency.relationship.from ===
      DEPENDENCY_RELATIONSHIPS_MAP.SIBLING
        ? DEPENDENCY_RELATIONSHIPS_MAP.BROTHER
        : dependencyData.dependency.relationship.from,
    isInternal:
      dependencyData.dependency.relationship.from ===
      DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL,
    originalDescription: dependencyData,
  };
}
