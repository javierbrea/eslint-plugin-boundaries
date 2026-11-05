import type { SettingsNormalized } from "@boundaries/config";
import type { EntityDescription } from "@boundaries/elements";
import { describeEntity } from "@boundaries/policies";

import type { DescribedFiles } from "./describeFiles.types";

/** The description of each file, by path */
type Descriptions = Map<string, EntityDescription>;

/**
 * Describes files with some settings.
 * @param settings The normalized settings.
 * @param paths The paths of the files.
 * @returns The description of each file, by path.
 */
function describe(
  settings: SettingsNormalized,
  paths: readonly string[]
): Descriptions {
  return new Map(paths.map((path) => [path, describeEntity(settings, path)]));
}

/**
 * Counts the files that each descriptor labels. Each descriptor gets its own type or category, its position, so that descriptors that share one are told apart. Labels take no part in matching, so the files are matched as with the settings.
 * @param settings The normalized settings.
 * @param paths The paths of the files.
 * @returns How many files each element descriptor and each file descriptor of the settings labels.
 */
function countFilesByDescriptor(
  settings: SettingsNormalized,
  paths: readonly string[]
): Pick<DescribedFiles, "elementDescriptorFiles" | "fileDescriptorFiles"> {
  const labelled: SettingsNormalized = {
    ...settings,
    elementDescriptors: settings.elementDescriptors.map(
      (descriptor, index) => ({
        ...descriptor,
        type: String(index),
      })
    ),
    fileDescriptors: settings.fileDescriptors.map((descriptor, index) => ({
      ...descriptor,
      category: String(index),
    })),
  };
  const descriptions = [...describe(labelled, paths).values()];

  return {
    elementDescriptorFiles: settings.elementDescriptors.map(
      (_descriptor, index) =>
        descriptions.filter(({ element }) =>
          element.types?.includes(String(index))
        ).length
    ),
    fileDescriptorFiles: settings.fileDescriptors.map(
      (_descriptor, index) =>
        descriptions.filter(({ file }) =>
          file.categories?.includes(String(index))
        ).length
    ),
  };
}

/**
 * Describes the files of a sketch as the plugin does. `normalizeConfig` leaves out the descriptors that `describeEntity` cannot use, such as one whose `capture` or `baseCapture` is not a list, so describing the files with the normalized settings does not throw.
 * @param settings The normalized settings.
 * @param paths The paths of the files.
 * @returns The description of each file, and how many files each descriptor labels.
 */
export function describeFiles(
  settings: SettingsNormalized,
  paths: readonly string[]
): DescribedFiles {
  return {
    files: describe(settings, paths),
    ...countFilesByDescriptor(settings, paths),
  };
}
