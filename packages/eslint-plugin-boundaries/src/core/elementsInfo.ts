import mod from "module";

import type { Rule } from "eslint";
import resolve from "eslint-module-utils/resolve";
import micromatch from "micromatch";

import { SETTINGS } from "../constants/settings";
import { debugFileInfo } from "../helpers/debug";
import { getElements, getRootPath } from "../helpers/settings";
import { isArray } from "../helpers/utils";

import { filesCache, importsCache, elementsCache } from "./cache";
import type { FileInfo, ImportInfo, ElementInfo } from "./ElementsInfo.types";

const { IGNORE, INCLUDE, VALID_MODES } = SETTINGS;

function isCoreModule(moduleName) {
  const moduleNameWithoutPrefix = moduleName.startsWith("node:")
    ? moduleName.slice(5)
    : moduleName;

  return mod.builtinModules.includes(moduleNameWithoutPrefix);
}

function baseModule(name) {
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
  const elementResult: ElementInfo = {
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
      (
        { accumulator, lastSegmentMatching },
        elementPathSegment,
        segmentIndex,
        elementPaths,
      ) => {
        accumulator.unshift(elementPathSegment);
        let elementFound = false;
        getElements(settings).forEach((element) => {
          const typeOfMatch = VALID_MODES.includes(element.mode)
            ? element.mode
            : VALID_MODES[0];
          const elementPatterns = isArray(element.pattern)
            ? element.pattern
            : [element.pattern];
          elementPatterns.forEach((elementPattern) => {
            if (!elementFound) {
              const useFullPathMatch =
                typeOfMatch === VALID_MODES[2] && !elementResult.type;
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
                    .join("/"),
                );
              }
              const capture = micromatch.capture(
                pattern,
                useFullPathMatch ? path : accumulator.join("/"),
              );

              if (capture && basePatternCapture) {
                elementFound = true;
                lastSegmentMatching = segmentIndex + 1;
                let capturedValues = elementCaptureValues(
                  capture,
                  element.capture,
                );
                if (element.basePattern) {
                  capturedValues = {
                    ...elementCaptureValues(
                      basePatternCapture,
                      element.baseCapture,
                    ),
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
      { accumulator: [], lastSegmentMatching: 0 },
    );

  return {
    ...elementResult,
    parents,
  };
}

function replacePathSlashes(absolutePath) {
  return absolutePath.replace(/\\/g, "/");
}

function projectPath(absolutePath, rootPath) {
  if (absolutePath) {
    return replacePathSlashes(absolutePath).replace(
      `${replacePathSlashes(rootPath)}/`,
      "",
    );
  }
}

function externalModulePath(source, baseModuleValue) {
  return source.replace(baseModuleValue, "");
}

export function importInfo(
  source: string,
  context: Rule.RuleContext,
): ImportInfo {
  const path = projectPath(
    resolve(source, context),
    getRootPath(context.settings),
  );
  const isExternalModule = isExternal(source, path);
  const resultCache = importsCache.load(
    isExternalModule ? source : path,
    context.settings,
  );
  let elementCache;
  let result;
  let elementResult;

  if (resultCache) {
    result = resultCache;
  } else {
    elementCache = elementsCache.load(path, context.settings);
    const baseModuleValue = isExternalModule ? baseModule(source) : null;
    const isBuiltInModule = isBuiltIn(source, path);
    const pathToUse = isExternalModule
      ? externalModulePath(source, baseModuleValue)
      : path;
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
      baseModule: baseModuleValue,
      ...elementResult,
    };

    importsCache.save(path, result, context.settings);

    if (result.isLocal) {
      debugFileInfo(result);
    }
  }
  return result;
}

export function fileInfo(context: Rule.RuleContext): FileInfo {
  const path = projectPath(
    context.getFilename(),
    getRootPath(context.settings),
  );
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
