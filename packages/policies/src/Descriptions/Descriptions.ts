import type { SettingsNormalized } from "@boundaries/config";
import { Elements } from "@boundaries/elements";
import type {
  DependencyDescription,
  DependencyDescriptorOptions,
  EntityDescription,
  Matcher,
} from "@boundaries/elements";

const elements = new Elements();

/**
 * Memoizes the matcher by normalized settings identity. A host passes the same `SettingsNormalized` object for a given config, as the ESLint plugin does across an ESLint run, so this avoids rebuilding the config and hashing all descriptors again for every description.
 */
const matchersBySettings = new WeakMap<SettingsNormalized, Matcher>();

/**
 * Returns the `@boundaries/elements` matcher of some normalized settings, memoized by settings identity.
 * @param settings The settings, normalized by `@boundaries/config`.
 * @returns The matcher of the settings.
 */
export function getMatcher(settings: SettingsNormalized): Matcher {
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
