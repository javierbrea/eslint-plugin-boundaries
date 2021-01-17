const resolve = require("eslint-module-utils/resolve").default;

function importInfo(source, context) {
  return {
    elementPath: context.getFilename(),
    dependencyPath: resolve(source, context),
  };
}

module.exports = {
  importInfo,
};
