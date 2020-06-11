const { getDependencyPathInfo, getElementPathInfo } = require("./paths");

const getLastParent = (elementInfo) => {
  return elementInfo.parents && elementInfo.parents[0];
};

const getCommonAncestor = (elementInfo, dependencyInfo) => {
  return elementInfo.parents.find((parent) => dependencyInfo.parents.includes(parent));
};

const isCommonAncestorChildDependency = (elementInfo, dependencyInfo) => {
  return getCommonAncestor(elementInfo, dependencyInfo) === getLastParent(dependencyInfo);
};

const isChildDependency = (elementInfo, dependencyInfo) => {
  return elementInfo.self === getLastParent(dependencyInfo);
};

const isBrotherDependency = (elementInfo, dependencyInfo) => {
  return getLastParent(elementInfo) === getLastParent(dependencyInfo);
};

const isInternalDependency = (elementInfo, dependencyInfo) => {
  return elementInfo.self === dependencyInfo.self;
};

const getElementInfo = (filePath, settings) => {
  return getElementPathInfo(filePath, settings);
};

const getDependencyInfo = (filePath, dependencyPath, settings) => {
  const elementInfo = getElementInfo(filePath, settings);
  const dependencyPathInfo = getDependencyPathInfo(filePath, dependencyPath, settings);

  if (dependencyPathInfo.isLocal) {
    const isInternal = isInternalDependency(elementInfo, dependencyPathInfo);
    const isBrother = !isInternal && isBrotherDependency(elementInfo, dependencyPathInfo);
    const isChild =
      !isInternal && !isBrother && isChildDependency(elementInfo, dependencyPathInfo);
    const isCommonAncestorChild =
      !isInternal &&
      !isBrother &&
      isCommonAncestorChildDependency(elementInfo, dependencyPathInfo);

    return {
      ...dependencyPathInfo,
      isInternal,
      isBrother,
      isChild,
      isCommonAncestorChild,
    };
  }

  return dependencyPathInfo;
};

module.exports = {
  getElementInfo,
  getDependencyInfo,
};
