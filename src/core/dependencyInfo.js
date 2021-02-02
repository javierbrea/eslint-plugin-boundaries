const { fileInfo, importInfo } = require("./elementsInfo");

function getParent(elementInfo) {
  const parent = elementInfo.parents && elementInfo.parents[0];
  return parent && parent.elementPath;
}

function getCommonAncestor(elementInfoA, elementInfoB) {
  const commonAncestor = elementInfoA.parents.find((elementParentA) => {
    return !!elementInfoB.parents.find((elementParentB) => {
      return elementParentA.elementPath === elementParentB.elementPath;
    });
  });
  return commonAncestor && commonAncestor.elementPath;
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
  return !!elementA.parents.find((parent) => parent.elementPath === elementB.elementPath);
}

function isChild(elementA, elementB) {
  return getParent(elementA) == elementB.elementPath;
}

function isInternal(elementA, elementB) {
  return elementA.elementPath === elementB.elementPath;
}

function dependencyRelationship(dependency, element) {
  if (!dependency.isLocal || dependency.isIgnored || !element.type || !dependency.type) {
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

function dependencyInfo(source, context) {
  const elementInfo = fileInfo(context);
  const dependency = importInfo(source, context);

  return {
    ...dependency,
    relationship: dependencyRelationship(dependency, elementInfo),
    isInternal: isInternal(dependency, elementInfo),
  };
}

module.exports = {
  dependencyInfo,
};
