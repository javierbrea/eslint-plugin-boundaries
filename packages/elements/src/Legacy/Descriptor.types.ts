import type { ElementDescriptor } from "../Descriptor";

/**
 * Map of the modes to interpret the pattern in an ElementDescriptor.
 */
export const ELEMENT_DESCRIPTOR_MODES_MAP = {
  /** Mode to interpret the pattern as a folder */
  FOLDER: "folder",
  /** Mode to interpret the pattern as a file */
  FILE: "file",
  /** Mode to interpret the pattern as a full path */
  FULL: "full",
} as const;

/**
 * Mode to interpret the pattern in an ElementDescriptor.
 */
export type ElementDescriptorMode =
  (typeof ELEMENT_DESCRIPTOR_MODES_MAP)[keyof typeof ELEMENT_DESCRIPTOR_MODES_MAP];

export type LegacyElementDescriptor = ElementDescriptor & {
  /**
   * The category of the element.
   * @deprecated The category property is deprecated and will be removed in future versions. Use the category property in file descriptors instead.
   */
  // TODO: Add to Element Descriptors and flag as deprecated?
  category?: string;
  /**
   * The mode to interpret the pattern in the descriptor. It can be "folder", "file", or "full".
   * @deprecated The mode property is deprecated and will be removed in future versions. For file descriptors, the mode is always "file". For element descriptors, the mode is always "folder". Use the `requireFullMatch` property in element descriptors to require full path matching instead.
   */
  mode?: ElementDescriptorMode;
};

export type LegacyElementDescriptors = (
  | LegacyElementDescriptor
  | ElementDescriptor
)[];
