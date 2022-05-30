const resolve = require("resolve");

const getUsedAlias = (relativeFilePath, config) => {
  return Object.keys(config).find((alias) => relativeFilePath.indexOf(alias) === 0);
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
    if (resolve.isCore(source)) return { found: true, path: null };
    try {
      return {
        found: true,
        path: resolve.sync(replaceAliases(source, config), {
          basedir: process.cwd(),
        }),
      };
    } catch (err) {
      return { found: false };
    }
  },
};
