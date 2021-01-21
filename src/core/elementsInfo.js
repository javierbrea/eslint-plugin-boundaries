const isCoreModule = require("is-core-module");
const micromatch = require("micromatch");
const resolve = require("eslint-module-utils/resolve").default;

const { IGNORE } = require("../constants/settings");
const { getElements } = require("../helpers/settings");

function baseModule(name, path) {
  if (path) {
    return null;
  }
  if (isScoped(name)) {
    const [scope, pkg] = name.split("/");
    return `${scope}/${pkg}`;
  }
  const [pkg] = name.split("/");
  return pkg;
}

function isIgnored(path, settings) {
  return micromatch.isMatch(path, settings[IGNORE] || []);
}

function isBuiltIn(name, path) {
  if (path || !name) return false;
  const base = baseModule(name);
  return isCoreModule(base);
}

const scopedRegExp = /^@[^/]*\/?[^/]+/;
function isScoped(name) {
  return name && scopedRegExp.test(name);
}

const externalModuleRegExp = /^\w/;
function isExternal(name, path) {
  return !path && (externalModuleRegExp.test(name) || isScoped(name));
}

function elementCaptureValues(capture, captureSettings) {
  if (!captureSettings) {
    return null;
  }
  return capture.reduce((captureValues, capture, index) => {
    if (captureSettings[index]) {
      captureValues[captureSettings[index]] = capture;
    }
    return captureValues;
  }, {});
}

function elementTypeAndParents(path, settings) {
  const parents = [];
  const elementResult = {
    type: null,
    elementPath: null,
    capture: null,
    capturedValues: null,
    internalPath: null,
  };

  if (!path || isIgnored(path, settings)) {
    return {
      ...elementResult,
      parents,
    };
  }

  path
    .split("/")
    .reverse()
    .reduce((accumulator, elementPathSegment, segmentIndex, elementPaths) => {
      accumulator.unshift(elementPathSegment);
      let elementFound = false;
      getElements(settings).forEach((element) => {
        if (!elementFound) {
          const pattern =
            element.match === "parentFolders" && !elementResult.type
              ? `${element.pattern}/**/*`
              : element.pattern;
          const capture = micromatch.capture(pattern, accumulator.join("/"));
          if (capture) {
            elementFound = true;
            accumulator = [];
            const capturedValues = elementCaptureValues(capture, element.capture);
            const elementPath = elementPaths
              .slice(segmentIndex - 1)
              .reverse()
              .join("/");
            if (!elementResult.type) {
              elementResult.type = element.type;
              elementResult.elementPath = elementPath;
              elementResult.capture = capture;
              elementResult.capturedValues = capturedValues;
              elementResult.internalPath =
                element.match === "parentFolders" ? path.replace(`${elementPath}/`, "") : null;
            } else {
              parents.push({
                type: element.type,
                elementPath: elementPath,
                capture: capture,
                capturedValues: capturedValues,
              });
            }
          }
        }
      });
      return accumulator;
    }, []);

  return {
    ...elementResult,
    parents,
  };
}

function projectPath(absolutePath) {
  if (absolutePath) {
    return absolutePath.replace(`${process.cwd()}/`, "");
  }
}

function importInfo(source, context) {
  const path = projectPath(resolve(source, context));
  const isBuiltInModule = isBuiltIn(source, path);
  const isExternalModule = isExternal(source, path);
  return {
    source,
    path,
    isIgnored: isIgnored(path, context.settings),
    isLocal: !!path && !isBuiltInModule && !isExternalModule,
    isBuiltIn: isBuiltInModule,
    isExternal: isExternalModule,
    baseModule: baseModule(source, path),
    ...elementTypeAndParents(path, context.settings),
  };
}

function fileInfo(context) {
  const path = projectPath(context.getFilename());
  return {
    path,
    isIgnored: isIgnored(path, context.settings),
    ...elementTypeAndParents(path, context.settings),
  };
}

module.exports = {
  importInfo,
  fileInfo,
};
