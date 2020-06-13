const simpleDependencyRule = require("../rules-factories/simple-dependency-rule");

const dependencyIsNotValid = (dependencyInfo) => {
  return dependencyInfo.isLocal && dependencyInfo.isIgnored;
};

module.exports = simpleDependencyRule(
  "Prevent importing files marked as ignored from the recognized elements",
  dependencyIsNotValid,
  "Importing ignored files is not allowed"
);
