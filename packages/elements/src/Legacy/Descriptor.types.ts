import type {
  DescriptorsConfig,
  ElementDescriptor,
  ElementDescriptors,
  ElementDescriptorMode,
} from "../Descriptor";

export type LegacyElementDescriptor = Omit<ElementDescriptor, "mode"> & {
  /**
   * The mode to interpret the pattern in the descriptor. It can be "folder", "file", or "full".
   * @deprecated The mode property is deprecated and will be removed in future versions. For file descriptors, the mode is always "file". For element descriptors, the mode is always "folder". Use the `requireFullMatch` property in element descriptors to require full path matching instead.
   */
  mode: ElementDescriptorMode;
};

export type LegacyElementDescriptors = LegacyElementDescriptor[];

export type BackwardCompatibleElementDescriptors =
  | LegacyElementDescriptors
  | ElementDescriptors;

export type LegacyDescriptorsConfig = {
  /** Optional element descriptors. If not provided, no abstract layer of elements will be created and only file descriptors will be used to describe the files in the project. */
  elements: LegacyElementDescriptors;
  /** Optional file descriptors. If not provided, only element descriptors will be used to describe the files in the project. Legacy element descriptors cannot be used with file descriptors, so if file descriptors are provided, this property must be an empty array or not provided at all. */
  files?: never;
};

export type BackwardCompatibleDescriptorsConfig =
  | DescriptorsConfig
  | LegacyDescriptorsConfig;
