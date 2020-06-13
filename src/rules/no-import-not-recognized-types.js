const simpleDependencyRule = require("../rules-factories/simple-dependency-rule");

const dependencyIsNotValid = (dependencyInfo) => {
  return dependencyInfo.isLocal && !dependencyInfo.isIgnored && !dependencyInfo.type;
};

module.exports = simpleDependencyRule(
  "Prevent importing not recognized elements from the recognized ones",
  dependencyIsNotValid,
  "Importing not recognized elements is not allowed"
);
