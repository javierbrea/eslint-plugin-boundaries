const { isBuiltin } = require("node:module");

const getUsedAlias = (relativeFilePath, config) => {
  return Object.keys(config).find(
    (alias) => relativeFilePath.indexOf(alias) === 0
  );
};

const replaceAliases = (filePath, config) => {
  const usedAlias = getUsedAlias(filePath, config);
  if (usedAlias) {
    return filePath.replace(usedAlias, config[usedAlias]);
  }
  return filePath;
};

module.exports = {
  interfaceVersion: 2,
  resolve: function (source, _file, config) {
    if (isBuiltin(source)) return { found: true, path: null };
    try {
      return {
        found: true,
        path: require.resolve(replaceAliases(source, config), {
          paths: [process.cwd()],
        }),
      };
    } catch {
      return { found: false };
    }
  },
};
