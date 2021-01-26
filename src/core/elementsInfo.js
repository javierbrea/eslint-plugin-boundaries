const isCoreModule = require("is-core-module");
const micromatch = require("micromatch");
const resolve = require("eslint-module-utils/resolve").default;

const { IGNORE, VALID_MODES } = require("../constants/settings");
const { getElements } = require("../helpers/settings");

function baseModule(name, path) {
  if (path) {
    return null;
  }
  if (isScoped(name)) {
    const [scope, packageName] = name.split("/");
    return `${scope}/${packageName}`;
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
  return capture.reduce((captureValues, captureValue, index) => {
    if (captureSettings[index]) {
      captureValues[captureSettings[index]] = captureValue;
    }
    return captureValues;
  }, {});
}

function getElementPath(pattern, pathSegmentsMatching, fullPath) {
  // Get full left side of the path matching pattern (full element path except internal files)
  const elementPathRegexp = micromatch.makeRe(pattern);
  const testedSegments = [];
  let result;
  pathSegmentsMatching.forEach((pathSegment) => {
    if (!result) {
      testedSegments.push(pathSegment);
      const joinedSegments = testedSegments.join("/");
      if (elementPathRegexp.test(joinedSegments)) {
        result = joinedSegments;
      }
    }
  });
  return `${[...fullPath].reverse().join("/").split(result)[0]}${result}`;
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
        const typeOfMatch = VALID_MODES.includes(element.mode) ? element.mode : VALID_MODES[0];
        if (!elementFound) {
          const pattern =
            typeOfMatch === VALID_MODES[0] && !elementResult.type
              ? `${element.pattern}/**/*`
              : element.pattern;
          const capture = micromatch.capture(pattern, accumulator.join("/"));
          if (capture) {
            elementFound = true;
            const capturedValues = elementCaptureValues(capture, element.capture);
            const elementPath = getElementPath(element.pattern, accumulator, elementPaths);
            accumulator = [];
            if (!elementResult.type) {
              elementResult.type = element.type;
              elementResult.elementPath = elementPath;
              elementResult.capture = capture;
              elementResult.capturedValues = capturedValues;
              elementResult.internalPath =
                typeOfMatch === VALID_MODES[0]
                  ? path.replace(`${elementPath}/`, "")
                  : elementPath.split("/").pop();
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

function replacePathSlashes(absolutePath) {
  return absolutePath.replace(/\\/g, "/");
}

function projectPath(absolutePath) {
  if (absolutePath) {
    return replacePathSlashes(absolutePath).replace(`${replacePathSlashes(process.cwd())}/`, "");
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
