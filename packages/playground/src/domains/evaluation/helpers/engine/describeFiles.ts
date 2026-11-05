import type { SettingsNormalized } from "@boundaries/config";
import type { EntityDescription } from "@boundaries/elements";
import { describeEntity } from "@boundaries/policies";

import type { DescribedFiles, DescriptorFailure } from "./describeFiles.types";

/** The description of each file, by path */
type Descriptions = Map<string, EntityDescription>;

/** Settings that describe the files without throwing, with the descriptions they make and the position in the full settings of each descriptor they keep */
type DescribingSettings = {
  readonly settings: SettingsNormalized;
  readonly files: Descriptions;
  readonly elementPositions: readonly number[];
  readonly filePositions: readonly number[];
};

/**
 * Describes files with some settings.
 * @param settings The normalized settings.
 * @param paths The paths of the files.
 * @returns The description of each file, by path. It throws what `describeEntity` throws.
 */
function describe(
  settings: SettingsNormalized,
  paths: readonly string[]
): Descriptions {
  return new Map(paths.map((path) => [path, describeEntity(settings, path)]));
}

/**
 * Describes files with some settings, and tells why it cannot.
 * @param settings The normalized settings.
 * @param paths The paths of the files.
 * @returns The description of each file, by path, or the message of what describing them throws.
 */
function tryDescribe(
  settings: SettingsNormalized,
  paths: readonly string[]
): Descriptions | string {
  try {
    return describe(settings, paths);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/**
 * Adds the descriptors to the settings one by one, in their order, and leaves out each one that makes describing the files throw with the descriptors kept before it.
 * @param settings The normalized settings.
 * @param paths The paths of the files.
 * @returns The settings with the descriptors that do not fail, the descriptions they make, and the descriptors left out.
 */
function leaveOutFailingDescriptors(
  settings: SettingsNormalized,
  paths: readonly string[]
): { describing: DescribingSettings; failures: DescriptorFailure[] } {
  const failures: DescriptorFailure[] = [];
  const empty = {
    ...settings,
    elementDescriptors: [],
    fileDescriptors: [],
  };
  // Only a descriptor makes `describeEntity` throw: `@boundaries/config` checks the other settings, but not that `capture` and `baseCapture` are lists, which `@boundaries/elements` joins when it builds the matcher
  let describing: DescribingSettings = {
    settings: empty,
    files: describe(empty, paths),
    elementPositions: [],
    filePositions: [],
  };

  settings.elementDescriptors.forEach((descriptor, position) => {
    const next = {
      ...describing.settings,
      elementDescriptors: [
        ...describing.settings.elementDescriptors,
        descriptor,
      ],
    };
    const result = tryDescribe(next, paths);
    if (typeof result === "string") {
      failures.push({ descriptors: "elements", position, message: result });
    } else {
      describing = {
        ...describing,
        settings: next,
        files: result,
        elementPositions: [...describing.elementPositions, position],
      };
    }
  });

  settings.fileDescriptors.forEach((descriptor, position) => {
    const next = {
      ...describing.settings,
      fileDescriptors: [...describing.settings.fileDescriptors, descriptor],
    };
    const result = tryDescribe(next, paths);
    if (typeof result === "string") {
      failures.push({ descriptors: "files", position, message: result });
    } else {
      describing = {
        ...describing,
        settings: next,
        files: result,
        filePositions: [...describing.filePositions, position],
      };
    }
  });

  return { describing, failures };
}

/**
 * Counts the files that each descriptor labels. Each descriptor gets its own type or category, its position, so that descriptors that share one are told apart. Labels take no part in matching, so the files are matched as with the settings.
 * @param describing The settings that describe the files without throwing.
 * @param settings The full settings, whose descriptors are counted.
 * @param paths The paths of the files.
 * @returns How many files each element descriptor and each file descriptor of the full settings labels, 0 for one that is left out.
 */
function countFilesByDescriptor(
  describing: DescribingSettings,
  settings: SettingsNormalized,
  paths: readonly string[]
): Pick<DescribedFiles, "elementDescriptorFiles" | "fileDescriptorFiles"> {
  const { settings: kept, elementPositions, filePositions } = describing;
  const labelled: SettingsNormalized = {
    ...kept,
    elementDescriptors: kept.elementDescriptors.map((descriptor, index) => ({
      ...descriptor,
      type: String(index),
    })),
    fileDescriptors: kept.fileDescriptors.map((descriptor, index) => ({
      ...descriptor,
      category: String(index),
    })),
  };
  const descriptions = [...describe(labelled, paths).values()];
  const elementDescriptorFiles = settings.elementDescriptors.map(() => 0);
  const fileDescriptorFiles = settings.fileDescriptors.map(() => 0);

  elementPositions.forEach((position, index) => {
    elementDescriptorFiles[position] = descriptions.filter(({ element }) =>
      element.types?.includes(String(index))
    ).length;
  });
  filePositions.forEach((position, index) => {
    fileDescriptorFiles[position] = descriptions.filter(({ file }) =>
      file.categories?.includes(String(index))
    ).length;
  });

  return { elementDescriptorFiles, fileDescriptorFiles };
}

/**
 * Describes the files of a sketch as the plugin does, and never throws. A descriptor whose `capture` or `baseCapture` is not a list passes `normalizeConfig`, and then `describeEntity` throws for every file, as ESLint does when it loads a rule of the plugin. Such a descriptor is left out, and the files are described with the others.
 * @param settings The normalized settings.
 * @param paths The paths of the files.
 * @returns The description of each file, how many files each descriptor labels, and the descriptors left out. With no files, nothing is described, so no descriptor is left out.
 */
export function describeFiles(
  settings: SettingsNormalized,
  paths: readonly string[]
): DescribedFiles {
  const result = tryDescribe(settings, paths);
  const { describing, failures } =
    typeof result === "string"
      ? leaveOutFailingDescriptors(settings, paths)
      : {
          describing: {
            settings,
            files: result,
            elementPositions: settings.elementDescriptors.map(
              (_descriptor, position) => position
            ),
            filePositions: settings.fileDescriptors.map(
              (_descriptor, position) => position
            ),
          },
          failures: [],
        };

  return {
    files: describing.files,
    ...countFilesByDescriptor(describing, settings, paths),
    failures,
  };
}
