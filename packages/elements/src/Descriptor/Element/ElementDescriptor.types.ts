import type { BaseDescriptor } from "../Shared";

import type { ElementDescription } from "./ElementDescription.types";

/**
 * Map of the modes to interpret the pattern in a Descriptor.
 */
export const DESCRIPTOR_MODES_MAP = {
  /** Mode to interpret the pattern as a folder */
  FOLDER: "folder",
  /** Mode to interpret the pattern as a file */
  FILE: "file",
  /** Mode to interpret the pattern as a full path */
  FULL: "full",
} as const;

/**
 * Mode to interpret the pattern in a Descriptor.
 */
export type DescriptorMode =
  (typeof DESCRIPTOR_MODES_MAP)[keyof typeof DESCRIPTOR_MODES_MAP];

/**
 * Element descriptor, which must define a pattern and a type. The pattern is used to match files and capture values, while the type is used to categorize the element.
 */
export type ElementDescriptor = BaseDescriptor & {
  /** Type of the element (e.g., "service", "component", "util"). */
  type: string;
  /**
   * Mode to interpret the pattern. Can be "folder" (default), "file", or "full".
   * - "folder": Default value. the descriptor will match to the first file's parent folder matching the pattern.
   *             In the practice, it is like adding ** /* to the given pattern, but the plugin makes it by itself because it needs to know exactly which parent folder has to be considered the descriptor.
   * - "file": The given pattern will not be modified, but the plugin will still try to match the last part of the path.
   *           So, a pattern like *.model.js would match with paths src/foo.model.js, src/modules/foo/foo.model.js, src/modules/foo/models/foo.model.js, etc.
   * - "full": The given pattern will only match with patterns matching the full path.
   *           This means that you will have to provide patterns matching from the base project path.
   *           So, in order to match src/modules/foo/foo.model.js you'll have to provide patterns like ** /*.model.js, ** /* /*.model.js, src/* /* /*.model.js, etc. (the chosen pattern will depend on what do you want to capture from the path)
   */
  mode?: DescriptorMode;
};

/**
 * Array of element descriptors.
 */
export type ElementDescriptors = ElementDescriptor[];

/**
 * Serialized cache of element descriptions.
 */
export type ElementDescriptionsSerializedCache = Record<
  string,
  ElementDescription
>;

/**
 * Serialized cache of file elements.
 */
export type FileElementsSerializedCache = Record<string, ElementDescription>;

/**
 * Serialized cache for ElementsDescriptor class.
 */
export type ElementDescriptorSerializedCache = {
  /** Serialized descriptions cache */
  descriptions: ElementDescriptionsSerializedCache;
  /** Serialized files cache */
  files: FileElementsSerializedCache;
};
