import type { Rule } from "eslint";

import type { DependencyInfo, ImportKind } from "./DependencyInfo.types";
import { fileInfo, importInfo } from "./elementsInfo";

function getParent(elementInfo) {
  return elementInfo.parents?.[0]?.elementPath;
}

function getCommonAncestor(elementInfoA, elementInfoB) {
  const commonAncestor = elementInfoA.parents.find((elementParentA) => {
    return !!elementInfoB.parents.find((elementParentB) => {
      return elementParentA.elementPath === elementParentB.elementPath;
    });
  });
  return commonAncestor?.elementPath;
}

function isUncle(elementA, elementB) {
  const commonAncestor = getCommonAncestor(elementA, elementB);
  return commonAncestor && commonAncestor === getParent(elementA);
}

function isBrother(elementA, elementB) {
  const parentA = getParent(elementA);
  const parentB = getParent(elementB);
  return parentA && parentB && parentA === parentB;
}

function isDescendant(elementA, elementB) {
  return elementA.parents.some(
    (parent) => parent.elementPath === elementB.elementPath,
  );
}

function isChild(elementA, elementB) {
  return getParent(elementA) == elementB.elementPath;
}

function isInternal(elementA, elementB) {
  return elementA.elementPath === elementB.elementPath;
}

function dependencyRelationship(dependency, element) {
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
  importKind: ImportKind | null,
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
