const isCoreModule = require("is-core-module");
const micromatch = require("micromatch");
const resolve = require("eslint-module-utils/resolve").default;

const { IGNORE, INCLUDE, VALID_MODES } = require("../constants/settings");
const { getElements } = require("../helpers/settings");
const { debugFileInfo } = require("../helpers/debug");
const { isArray } = require("../helpers/utils");

const { filesCache, importsCache, elementsCache } = require("./cache");

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

function matchesIgnoreSetting(path, settings) {
  return micromatch.isMatch(path, settings[IGNORE] || []);
}

function isIgnored(path, settings) {
  if (!path) {
    return true;
  }
  if (settings[INCLUDE]) {
    if (micromatch.isMatch(path, settings[INCLUDE])) {
      return matchesIgnoreSetting(path, settings);
    }
    return true;
  }
  return matchesIgnoreSetting(path, settings);
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
  return (
    (!path || (!!path && path.includes("node_modules"))) &&
    (externalModuleRegExp.test(name) || isScoped(name))
  );
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

  if (isIgnored(path, settings)) {
    return {
      ...elementResult,
      parents,
    };
  }

  path
    .split("/")
    .reverse()
    .reduce(
      ({ accumulator, lastSegmentMatching }, elementPathSegment, segmentIndex, elementPaths) => {
        accumulator.unshift(elementPathSegment);
        let elementFound = false;
        getElements(settings).forEach((element) => {
          const typeOfMatch = VALID_MODES.includes(element.mode) ? element.mode : VALID_MODES[0];
          const elementPatterns = isArray(element.pattern) ? element.pattern : [element.pattern];
          elementPatterns.forEach((elementPattern) => {
            if (!elementFound) {
              const useFullPathMatch = typeOfMatch === VALID_MODES[2] && !elementResult.type;
              const pattern =
                typeOfMatch === VALID_MODES[0] && !elementResult.type
                  ? `${elementPattern}/**/*`
                  : elementPattern;
              let basePatternCapture = true;

              if (element.basePattern) {
                basePatternCapture = micromatch.capture(
                  [element.basePattern, "**", pattern].join("/"),
                  path
                    .split("/")
                    .slice(0, path.split("/").length - lastSegmentMatching)
                    .join("/")
                );
              }
              const capture = micromatch.capture(
                pattern,
                useFullPathMatch ? path : accumulator.join("/")
              );

              if (capture && basePatternCapture) {
                elementFound = true;
                lastSegmentMatching = segmentIndex + 1;
                let capturedValues = elementCaptureValues(capture, element.capture);
                if (element.basePattern) {
                  capturedValues = {
                    ...elementCaptureValues(basePatternCapture, element.baseCapture),
                    ...capturedValues,
                  };
                }
                const elementPath = useFullPathMatch
                  ? path
                  : getElementPath(elementPattern, accumulator, elementPaths);
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
        });
        return { accumulator, lastSegmentMatching };
      },
      { accumulator: [], lastSegmentMatching: 0 }
    );

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
  const resultCache = importsCache.load(path, context.settings);
  let elementCache;
  let result;
  let elementResult;

  if (resultCache) {
    result = resultCache;
  } else {
    elementCache = elementsCache.load(path, context.settings);
    const isBuiltInModule = isBuiltIn(source, path);
    const isExternalModule = isExternal(source, path);
    const pathToUse = isExternalModule ? null : path;
    if (elementCache) {
      elementResult = elementCache;
    } else {
      elementResult = elementTypeAndParents(pathToUse, context.settings);
      elementsCache.save(pathToUse, elementResult, context.settings);
    }

    result = {
      source,
      path: pathToUse,
      isIgnored: !isExternalModule && isIgnored(pathToUse, context.settings),
      isLocal: !isExternalModule && !isBuiltInModule,
      isBuiltIn: isBuiltInModule,
      isExternal: isExternalModule,
      baseModule: baseModule(source, pathToUse),
      ...elementResult,
    };

    importsCache.save(path, result, context.settings);

    if (result.isLocal) {
      debugFileInfo(result);
    }
  }
  return result;
}

function fileInfo(context) {
  const path = projectPath(context.getFilename());
  const resultCache = filesCache.load(path, context.settings);
  let elementCache;
  let result;
  let elementResult;
  if (resultCache) {
    result = resultCache;
  } else {
    elementCache = elementsCache.load(path, context.settings);
    if (elementCache) {
      elementResult = elementCache;
    } else {
      elementResult = elementTypeAndParents(path, context.settings);
      elementsCache.save(path, elementResult, context.settings);
    }
    result = {
      path,
      isIgnored: isIgnored(path, context.settings),
      ...elementResult,
    };
    filesCache.save(path, result, context.settings);
    debugFileInfo(result);
  }
  return result;
}

module.exports = {
  importInfo,
  fileInfo,
};
