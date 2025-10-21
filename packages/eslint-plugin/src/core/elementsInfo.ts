import mod from "module";

import type {
  CapturedValues,
  ElementDescriptorMode,
} from "@boundaries/elements";
import type { Rule } from "eslint";
import resolve from "eslint-module-utils/resolve";
import micromatch from "micromatch";

import type {
  FileInfo,
  ElementInfo,
  ImportInfo,
} from "../constants/ElementsInfo.types";
import type { Settings } from "../constants/settings";
import { SETTINGS } from "../constants/settings";
import { debugFileInfo } from "../helpers/debug";
import { getElements, getRootPath } from "../helpers/settings";
import { isArray } from "../helpers/utils";

import { filesCache, importsCache, elementsCache } from "./cache";

const { IGNORE, INCLUDE, VALID_MODES } = SETTINGS;

function isCoreModule(moduleName: string) {
  const moduleNameWithoutPrefix = moduleName.startsWith("node:")
    ? moduleName.slice(5)
    : moduleName;

  return mod.builtinModules.includes(moduleNameWithoutPrefix);
}

function baseModule(name: string) {
  if (isScoped(name)) {
    const [scope, packageName] = name.split("/");
    return `${scope}/${packageName}`;
  }
  const [pkg] = name.split("/");
  return pkg;
}

function matchesIgnoreSetting(path: string, settings: Settings) {
  return micromatch.isMatch(path, settings[IGNORE] || []);
}

function isIgnored(path: string | undefined, settings: Settings) {
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

function isBuiltIn(name: string | undefined, path: string | undefined) {
  if (path || !name) return false;
  const base = baseModule(name);
  return isCoreModule(base);
}

const scopedRegExp = /^@[^/]*\/?[^/]+/;
function isScoped(name: string | undefined) {
  return name && scopedRegExp.test(name);
}

const externalModuleRegExp = /^\w/;

function isExternal(name: string, path: string | undefined): boolean {
  return Boolean(
    (!path || (!!path && path.includes("node_modules"))) &&
      (externalModuleRegExp.test(name) || isScoped(name)),
  );
}

function elementCaptureValues(
  capture: string[],
  captureSettings: string[] | undefined,
): CapturedValues | null {
  if (!captureSettings) {
    return null;
  }
  return capture.reduce((captureValues, captureValue, index) => {
    if (captureSettings[index]) {
      captureValues[captureSettings[index]] = captureValue;
    }
    return captureValues;
  }, {} as CapturedValues);
}

function getElementPath(
  pattern: string,
  pathSegmentsMatching: string[],
  fullPath: string[],
) {
  // Get full left side of the path matching pattern (full element path except internal files)
  const elementPathRegexp = micromatch.makeRe(pattern);
  const testedSegments: string[] = [];
  let result: string | undefined;
  pathSegmentsMatching.forEach((pathSegment) => {
    if (!result) {
      testedSegments.push(pathSegment);
      const joinedSegments = testedSegments.join("/");
      if (elementPathRegexp.test(joinedSegments)) {
        result = joinedSegments;
      }
    }
  });
  if (!result) {
    return [...fullPath].reverse().join("/");
  }
  return `${[...fullPath].reverse().join("/").split(result)[0]}${result}`;
}

function isValidMode(mode: string | undefined): mode is ElementDescriptorMode {
  return VALID_MODES.includes(mode as ElementDescriptorMode);
}

function elementTypeAndParents(path: string, settings: Settings): ElementInfo {
  const parents: ElementInfo["parents"] = [];
  const elementResult: ElementInfo = {
    type: null,
    elementPath: "",
    capture: null,
    capturedValues: {},
    internalPath: null,
    parents: [],
  };

  if (isIgnored(path, settings)) {
    return {
      ...elementResult,
      parents,
    };
  }

  const result: {
    accumulator: string[];
    lastSegmentMatching: number;
  } = {
    accumulator: [],
    lastSegmentMatching: 0,
  };

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
          const typeOfMatch = isValidMode(element.mode)
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
              let hasCapture = true;
              let basePatternCapture: string[] | null = null;

              if (element.basePattern) {
                basePatternCapture = micromatch.capture(
                  [element.basePattern, "**", pattern].join("/"),
                  path
                    .split("/")
                    .slice(0, path.split("/").length - lastSegmentMatching)
                    .join("/"),
                );
                hasCapture = basePatternCapture !== null;
              }
              const capture = micromatch.capture(
                pattern,
                useFullPathMatch ? path : accumulator.join("/"),
              );

              if (capture && hasCapture) {
                elementFound = true;
                lastSegmentMatching = segmentIndex + 1;
                let capturedValues =
                  elementCaptureValues(capture, element.capture) || {};
                if (element.basePattern && basePatternCapture) {
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
                      : elementPath.split("/").pop() || null;
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
      result,
    );

  return {
    ...elementResult,
    parents,
  };
}

function replacePathSlashes(absolutePath: string) {
  return absolutePath.replace(/\\/g, "/");
}

function projectPath(
  absolutePath: string | undefined | null,
  rootPath: string,
) {
  if (absolutePath) {
    return replacePathSlashes(absolutePath).replace(
      `${replacePathSlashes(rootPath)}/`,
      "",
    );
  }
  return "";
}

function externalModulePath(source: string, baseModuleValue: string | null) {
  if (!baseModuleValue) {
    return source;
  }
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
  // TODO: Define types for the cache storage
  const resultCache = importsCache.load(
    isExternalModule ? source : path,
    context.settings,
  );
  let elementCache;
  let result: ImportInfo;
  let elementResult: ElementInfo;

  if (resultCache) {
    result = resultCache as ImportInfo;
  } else {
    elementCache = elementsCache.load(path, context.settings);
    const baseModuleValue = isExternalModule ? baseModule(source) : null;
    const isBuiltInModule = isBuiltIn(source, path);
    const pathToUse = isExternalModule
      ? externalModulePath(source, baseModuleValue)
      : path;
    if (elementCache) {
      elementResult = elementCache as ElementInfo;
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
      // TODO: Check why it is necessary the cast
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
  let result: FileInfo;
  let elementResult: ElementInfo;
  if (resultCache) {
    result = resultCache as FileInfo;
  } else {
    elementCache = elementsCache.load(path, context.settings);
    if (elementCache) {
      elementResult = elementCache as ElementInfo;
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
