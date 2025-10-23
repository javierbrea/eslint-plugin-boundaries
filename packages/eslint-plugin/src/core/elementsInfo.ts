import mod from "module";

import type { ElementsDescriptor } from "@boundaries/elements";
import { Elements } from "@boundaries/elements";
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

import { importsCache } from "./cache";

const { IGNORE, INCLUDE } = SETTINGS;

const elements = new Elements();

function getElementsDescriptor(context: Rule.RuleContext): ElementsDescriptor {
  const elementsDescriptor = elements.getDescriptor(
    getElements(context.settings),
    {
      ignorePaths: context.settings[SETTINGS.IGNORE] as string[],
      includePaths: context.settings[SETTINGS.INCLUDE] as string[],
      rootPath: getRootPath(context.settings),
    },
  );
  return elementsDescriptor;
}

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
  // TODO: Migrate logic to determine whether it is external based on path to describeFile
  const isExternalModule = isExternal(source, path);
  // TODO: Define types for the cache storage
  const resultCache = importsCache.load(
    isExternalModule ? source : path,
    context.settings,
  );
  let result: ImportInfo;
  let elementResult: ElementInfo;

  if (resultCache) {
    result = resultCache as ImportInfo;
  } else {
    const baseModuleValue = isExternalModule ? baseModule(source) : null;
    const isBuiltInModule = isBuiltIn(source, path);
    const pathToUse = isExternalModule
      ? externalModulePath(source, baseModuleValue)
      : path;
    const elementsDescriptor = getElementsDescriptor(context);
    //@ts-expect-error Types are not aligned
    elementResult = elementsDescriptor.describeFile(path);

    // @ts-expect-error Types are not aligned
    result = {
      source, // TODO: Migrate to describeDependency in Elements
      ...elementResult,
      isIgnored: !isExternalModule && isIgnored(pathToUse, context.settings), // External modules are never ignored, why?
      isLocal: !isExternalModule && !isBuiltInModule, // TODO: Remove
      isBuiltIn: isBuiltInModule, // TODO: Migrate to describeDependency in Elements. Use is-core-module as fallback for browsers, passing node version in settings
      baseModule: baseModuleValue, // TODO: Migrate to describeDependency in Elements. Rename to sourceBase, use also for local dependencies, because it might be useful
      internalPath: isExternalModule ? pathToUse : elementResult.internalPath,
      isExternal: isExternalModule, //TODO: Migrate to describeFile, and override in describeDependency for external deps (just in case the source goes directly to node_modules, which might be considered local. This must be documented)
    };

    importsCache.save(path, result, context.settings);

    if (result.isLocal) {
      debugFileInfo(result);
    }
  }
  return result;
}

export function fileInfo(context: Rule.RuleContext): FileInfo {
  const elementsDescriptor = getElementsDescriptor(context);
  // TODO: Calculate project path in Elements. Rename to relativePath.
  const path = projectPath(context.filename, getRootPath(context.settings));
  const result = elementsDescriptor.describeFile(path);
  // @ts-expect-error Types are not aligned
  debugFileInfo(result);
  // @ts-expect-error Types are not aligned
  return result;
}
