import type { SettingsNormalized } from "@boundaries/config";
import { Elements } from "@boundaries/elements";
import type {
  DependencyDescription,
  DependencyDescriptorOptions,
  EntityDescription,
  Matcher,
} from "@boundaries/elements";

import type { MatcherGetter } from "./Descriptions.types";

/**
 * Returns a function that returns the matcher of some normalized settings, built by an `Elements` instance and memoized by settings identity. The matchers are kept by the `Elements` instance, which returns the same matcher for settings of equal content, and are freed with it.
 * @param elements The `Elements` instance that builds and keeps the matchers.
 * @returns The function that returns the matcher of some normalized settings.
 */
export function createMatcherGetter(elements: Elements): MatcherGetter {
  /**
   * Memoizes the matcher by normalized settings identity. A host passes the same `SettingsNormalized` object for a given config, as the ESLint plugin does across an ESLint run, so this avoids rebuilding the config and hashing all descriptors again for every description.
   */
  const matchersBySettings = new WeakMap<SettingsNormalized, Matcher>();

  return (settings) => {
    const cachedMatcher = matchersBySettings.get(settings);
    if (cachedMatcher) {
      return cachedMatcher;
    }
    const matcher = elements.getMatcher(
      {
        elements: settings.elementDescriptors,
        files: settings.fileDescriptors,
        elementsSingleMatch: settings.elementsSingleMatch,
        filesSingleMatch: settings.filesSingleMatch,
      },
      {
        ignorePaths: settings.ignorePaths,
        includePaths: settings.includePaths,
        legacyTemplates: settings.legacyTemplates,
        cache: settings.cache,
        flagAsExternal: settings.flagAsExternal,
        rootPath: settings.rootPath,
      }
    );
    matchersBySettings.set(settings, matcher);
    return matcher;
  };
}

/**
 * The getter of the matchers of the module functions, which keeps every matcher it builds for the life of the module.
 */
const getModuleMatcher = createMatcherGetter(new Elements());

/**
 * Returns the `@boundaries/elements` matcher of some normalized settings, memoized by settings identity. The matchers are kept for the life of the module, and settings of equal content get the same matcher.
 * @param settings The settings, normalized by `@boundaries/config`.
 * @returns The matcher of the settings.
 */
export function getMatcher(settings: SettingsNormalized): Matcher {
  return getModuleMatcher(settings);
}

/**
 * Describes a file: the element it belongs to, its file categories and its module origin.
 * @param settings The settings, normalized by `@boundaries/config`.
 * @param filePath The path of the file.
 * @returns The description of the file.
 */
export function describeEntity(
  settings: SettingsNormalized,
  filePath: string
): EntityDescription {
  return getMatcher(settings).describeEntity(filePath);
}

/**
 * Describes a dependency: the files it connects and the dependency itself.
 * @param settings The settings, normalized by `@boundaries/config`.
 * @param dependency The dependency: the paths of the importing file and of the resolved target, the source as written, its kind, the name of its dependency node and its specifiers.
 * @returns The description of the dependency.
 */
export function describeDependency(
  settings: SettingsNormalized,
  dependency: DependencyDescriptorOptions
): DependencyDescription {
  return getMatcher(settings).describeDependency(dependency);
}
