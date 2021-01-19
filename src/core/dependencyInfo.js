const { fileInfo, importInfo } = require("./elementsInfo");

function getParent(elementInfo) {
  const parent = elementInfo.parents && elementInfo.parents[0];
  return parent && parent.typePath;
}

function getCommonAncestor(elementInfoA, elementInfoB) {
  const commonAncestor = elementInfoA.parents.find((elementParentA) => {
    return !!elementInfoB.parents.find((elementParentB) => {
      return elementParentA.typePath === elementParentB.typePath;
    });
  });
  return commonAncestor && commonAncestor.typePath;
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
  return !!elementA.parents.find((parent) => parent.typePath === elementB.typePath);
}

function isChild(elementA, elementB) {
  return getParent(elementA) == elementB.typePath;
}

function isInternal(elementA, elementB) {
  return elementA.typePath === elementB.typePath;
}

function dependencyRelationship(dependencyInfo, elementInfo) {
  if (
    !dependencyInfo.isLocal ||
    dependencyInfo.isIgnored ||
    !elementInfo.type ||
    !dependencyInfo.type
  ) {
    return null;
  }
  if (isInternal(dependencyInfo, elementInfo)) {
    return "internal";
  }
  if (isChild(dependencyInfo, elementInfo)) {
    return "child";
  }
  if (isDescendant(dependencyInfo, elementInfo)) {
    return "descendant";
  }
  if (isBrother(dependencyInfo, elementInfo)) {
    return "brother";
  }
  if (isChild(elementInfo, dependencyInfo)) {
    return "parent";
  }
  if (isUncle(dependencyInfo, elementInfo)) {
    return "uncle";
  }
  if (isDescendant(elementInfo, dependencyInfo)) {
    return "ancestor";
  }
  return null;
}

function dependencyInfo(source, context) {
  const elementInfo = fileInfo(context);
  const dependency = importInfo(source, context);

  return {
    ...dependency,
    relationship: dependencyRelationship(dependency, elementInfo),
  };
}

module.exports = {
  dependencyInfo,
};
