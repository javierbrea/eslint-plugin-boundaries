// TODO, remove

const path = require("path");
const globule = require("globule");

const { IGNORE, ALIAS, TYPES } = require("../constants/settings");

const CODE_PATH_SEP = "/";
const PATH_SEP = path.sep;
const NODE_MODULES = "node_modules";
const INDEX = "index.js";

let basePath;
let _globuleFound = {};

const isMatch = (matcher, filePath) => globule.match(matcher, filePath).length > 0;

const getBasePath = () => {
  if (basePath) {
    return basePath;
  }
  basePath = path.resolve(process.cwd());
  return basePath;
};

const getLastPath = (filePath) => {
  return filePath.split(PATH_SEP).pop();
};

const getUsedAlias = (relativeFilePath, settings) => {
  if (settings[ALIAS]) {
    return Object.keys(settings[ALIAS]).find((alias) => relativeFilePath.indexOf(alias) === 0);
  }
  return null;
};

const isAlias = (relativeFilePath, settings) => !!getUsedAlias(relativeFilePath, settings);

const replaceAliasByAbsolutePath = (relativeFilePath, settings) => {
  const usedAlias = getUsedAlias(relativeFilePath, settings);
  return path.resolve(
    getBasePath(),
    relativeFilePath.replace(usedAlias, settings[ALIAS][usedAlias])
  );
};

const getParentFolders = (filePath, level = 1) => {
  const parentFolders = filePath.split(PATH_SEP);
  return parentFolders.slice(0, parentFolders.length - level);
};

const getFileFolder = (filePath, level) => {
  return getParentFolders(filePath, level).join(PATH_SEP);
};

const hasFileExtension = (filePath) => /\.js$/.test(filePath);

const addFileExtension = (filePath) => {
  if (!hasFileExtension(filePath)) {
    return `${filePath}.js`;
  }
  return filePath;
};

const getRelativePath = (filePath) => {
  return filePath.replace(`${getBasePath()}${PATH_SEP}`, "");
};

const existingPath = (absolutePath) => {
  if (!_globuleFound[absolutePath]) {
    _globuleFound[absolutePath] = {
      exists: globule.find(absolutePath).length > 0,
    };
  }
  return _globuleFound[absolutePath].exists ? absolutePath : null;
};

const addIndexFileToPath = (filePath) => path.resolve(filePath, INDEX);

const isAliasToNodeModules = (dependencyPath, settings) => {
  const absolutePath = replaceAliasByAbsolutePath(dependencyPath, settings);
  return absolutePath.indexOf(NODE_MODULES) >= 0;
};

const isLocalDependency = (dependencyPath, settings) => {
  return (
    ((dependencyPath.indexOf(`..${CODE_PATH_SEP}`) === 0 ||
      dependencyPath.indexOf(`.${CODE_PATH_SEP}`) === 0) &&
      dependencyPath.indexOf(NODE_MODULES) < 1) ||
    (isAlias(dependencyPath, settings) && !isAliasToNodeModules(dependencyPath, settings))
  );
};

const getDependencyAbsolutePath = (filePath, dependencyPath, settings) => {
  const fileFolder = getFileFolder(filePath);
  const absoluteFilePath = isAlias(dependencyPath, settings)
    ? replaceAliasByAbsolutePath(dependencyPath, settings)
    : path.resolve(fileFolder, dependencyPath);

  return (
    existingPath(addFileExtension(absoluteFilePath)) ||
    existingPath(addIndexFileToPath(absoluteFilePath)) ||
    existingPath(absoluteFilePath) ||
    absoluteFilePath
  );
};

const isIgnored = (filePath, settings) => {
  return isMatch(settings[IGNORE], filePath);
};

const getElementType = (relativePath) => {
  return getLastPath(getFileFolder(relativePath, 1));
};

const getElementName = (relativePath) => {
  return getLastPath(getFileFolder(relativePath, 0));
};

const getLastTypeAndName = (folders, settings, index, parentElements = []) => {
  const startIndex = typeof index !== "undefined" ? index : folders.length;
  if (
    Array.isArray(settings[TYPES]) &&
    settings[TYPES].includes(folders[startIndex]) &&
    folders[startIndex + 1]
  ) {
    parentElements.push(folders.slice(0, startIndex + 2).join(PATH_SEP));
  }
  if (startIndex > 0) {
    return getLastTypeAndName(folders, settings, startIndex - 1, parentElements);
  }
  return parentElements;
};

const getParentElements = (relativePath, settings) => {
  return getLastTypeAndName(getParentFolders(relativePath), settings);
};

const getElementSelf = (relativePath, settings) => {
  return getLastTypeAndName(getParentFolders(relativePath), settings)[0];
};

const getElementPathInfo = (absolutePath, settings) => {
  const relativePath = getRelativePath(absolutePath);
  const selfElement = getElementSelf(relativePath, settings);
  return {
    absolutePath,
    relativePath,
    isLocal: true,
    isIgnored: isIgnored(relativePath, settings),
    self: selfElement,
    parents: selfElement && getParentElements(selfElement, settings),
    type: selfElement && getElementType(selfElement),
    name: selfElement && getElementName(selfElement),
    privatePath: relativePath.replace(`${selfElement}${PATH_SEP}`, ""),
    exists: existingPath(absolutePath) ? true : false,
  };
};

const getDependencyPathInfo = (filePath, dependencyPath, settings) => {
  if (isLocalDependency(dependencyPath, settings)) {
    const absolutePath = getDependencyAbsolutePath(filePath, dependencyPath, settings);
    return getElementPathInfo(absolutePath, settings);
  }

  return {
    name: dependencyPath,
  };
};

module.exports = {
  isMatch,
  getBasePath,
  getRelativePath,
  getDependencyPathInfo,
  getElementPathInfo,
  isIgnored,
};
