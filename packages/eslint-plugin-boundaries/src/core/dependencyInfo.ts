import type { Rule } from "eslint";

import type { ImportKind } from "../constants/settings";

import type { DependencyInfo } from "./DependencyInfo.types";
import { fileInfo, importInfo } from "./elementsInfo";
import type { ElementInfo } from "./ElementsInfo.types";

function getParent(elementInfo: ElementInfo) {
  return elementInfo.parents?.[0]?.elementPath;
}

function getCommonAncestor(
  elementInfoA: ElementInfo,
  elementInfoB: ElementInfo,
) {
  const commonAncestor = elementInfoA.parents.find((elementParentA) => {
    return !!elementInfoB.parents.find((elementParentB) => {
      return elementParentA.elementPath === elementParentB.elementPath;
    });
  });
  return commonAncestor?.elementPath;
}

function isUncle(elementA: ElementInfo, elementB: ElementInfo) {
  const commonAncestor = getCommonAncestor(elementA, elementB);
  return commonAncestor && commonAncestor === getParent(elementA);
}

function isBrother(elementA: ElementInfo, elementB: ElementInfo) {
  const parentA = getParent(elementA);
  const parentB = getParent(elementB);
  return parentA && parentB && parentA === parentB;
}

function isDescendant(elementA: ElementInfo, elementB: ElementInfo) {
  return elementA.parents.some(
    (parent) => parent.elementPath === elementB.elementPath,
  );
}

function isChild(elementA: ElementInfo, elementB: ElementInfo) {
  return getParent(elementA) === elementB.elementPath;
}

function isInternal(elementA: ElementInfo, elementB: ElementInfo) {
  return elementA.elementPath === elementB.elementPath;
}

function dependencyRelationship(
  dependency: DependencyInfo,
  element: ElementInfo,
) {
  if (
    !dependency.isLocal ||
    dependency.isIgnored ||
    !element.type ||
    !dependency.type
  ) {
    return null;
  }
  if (isInternal(dependency, element)) {
    return "internal";
  }
  if (isChild(dependency, element)) {
    return "child";
  }
  if (isDescendant(dependency, element)) {
    return "descendant";
  }
  if (isBrother(dependency, element)) {
    return "brother";
  }
  if (isChild(element, dependency)) {
    return "parent";
  }
  if (isUncle(dependency, element)) {
    return "uncle";
  }
  if (isDescendant(element, dependency)) {
    return "ancestor";
  }
  return null;
}

export function dependencyInfo(
  source: string,
  importKind: ImportKind,
  context: Rule.RuleContext,
): DependencyInfo {
  const elementInfo = fileInfo(context);
  const dependency = importInfo(source, context);

  return {
    ...dependency,
    importKind: importKind || "value",
    relationship: dependencyRelationship(dependency, elementInfo),
    isInternal: isInternal(dependency, elementInfo),
  };
}
