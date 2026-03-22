/**
 * Map of the modes to interpret the pattern in an ElementDescriptor.
 */
export const ELEMENT_DESCRIPTOR_MODES_MAP = {
  /** Mode to interpret the pattern as a folder */
  FOLDER: "folder",
  /** Mode to interpret the pattern as a file */
  FILE: "file",
} as const;

/**
 * Mode to interpret the pattern in an ElementDescriptor.
 */
export type ElementDescriptorMode =
  (typeof ELEMENT_DESCRIPTOR_MODES_MAP)[keyof typeof ELEMENT_DESCRIPTOR_MODES_MAP];

/**
 * Pattern(s) to match files for an element descriptor.
 */
export type ElementDescriptorPattern = string | string[];

/**
 * Map of the priorities to select descriptor matches when more than one descriptor matches at the same level.
 */
export const ELEMENT_DESCRIPTORS_PRIORITY_MAP = {
  /** Priority to select the first matching descriptor */
  FIRST: "first",
  /** Priority to select the last matching descriptor */
  LAST: "last",
} as const;

/**
 * Priority used to select descriptor matches when more than one descriptor matches.
 */
export type ElementDescriptorsPriority =
  (typeof ELEMENT_DESCRIPTORS_PRIORITY_MAP)[keyof typeof ELEMENT_DESCRIPTORS_PRIORITY_MAP];

/**
 * Descriptor for an element (or layer) in the project.
 * Defines the type of the element, the pattern to match files, and optional settings like mode and capture groups.
 */
export type BaseElementDescriptor = {
  /** Micromatch pattern(s) to match files belonging to this element. */
  pattern: ElementDescriptorPattern;
  /**
   * Optional micromatch pattern. If provided, the left side of the element path must match also with this pattern from the root of the project (like if pattern is [basePattern]/** /[pattern]).
   * This option is useful when using the option mode with file or folder values, but capturing fragments from the rest of the full path is also needed
   **/
  basePattern?: string;
  /**
   * Mode to interpret the pattern. Can be "folder" (default) or "file".
   * - "folder": Default value. the element type will be assigned to the first file's parent folder matching the pattern.
   *             In the practice, it is like adding ** /* to the given pattern, but the plugin makes it by itself because it needs to know exactly which parent folder has to be considered the element.
   * - "file": The given pattern will not be modified, but the plugin will still try to match the last part of the path.
   *           So, a pattern like *.model.js would match with paths src/foo.model.js, src/modules/foo/foo.model.js, src/modules/foo/models/foo.model.js, etc.
   */
  mode?: ElementDescriptorMode;
  /**
   * When true, the pattern is matched against the full file path from project root.
   * When false (default), the pattern is applied as a folder descriptor (like adding /** /* to the pattern).
   * This flag is an alternative to mode: "full" and will eventually replace the mode option.
   */
  fullMatch?: boolean;
  /**
   * It allows to capture values of some fragments in the matching path to use them later in the rules configuration.
   * Must be an array of strings representing the names of the capture groups in the pattern.
   * The number of capture names must be equal to the number of capturing groups in the pattern.
   * For example, if the pattern is "src/modules/(* *)/(* *).service.js" the capture could be ["module", "service"].
   * Then, in the rules configuration, you could use ["service", { module: "auth" }] to match only services from the auth module.
   */
  capture?: string[];
  /**
   * Like capture, but for the basePattern.
   * This allows to capture values from the left side of the path, which is useful when using the basePattern option.
   * The captured values will be merged with the ones from the capture option. If the same name is used in both captures, the value from capture will take precedence.
   */
  baseCapture?: string[];
};

/**
 * Element descriptor with a type.
 */
export type ElementDescriptorWithType = BaseElementDescriptor & {
  /** Type of the element (e.g., "service", "component", "util"). */
  type: string;
};

/**
 * Element descriptor, defined by type.
 */
export type ElementDescriptor = BaseElementDescriptor & {
  /** Type of the element (e.g., "service", "component", "util"). */
  type: string;
};

/**
 * Array of element descriptors.
 */
export type ElementDescriptors = ElementDescriptor[];

/**
 * File descriptor for classifying files within elements.
 * Files can match multiple FileDescriptors to accumulate multiple categories.
 * Like ElementDescriptor, it uses pattern matching and can capture values.
 */
export type FileDescriptor = BaseElementDescriptor & {
  /**
   * File descriptors always work in file mode and do not accept custom mode.
   */
  mode?: never;
  /** Category/categories assigned to matching files (e.g., "presentation", "infrastructure", "test"). */
  category: string | string[];
};

/**
 * Array of file descriptors.
 */
export type FileDescriptors = FileDescriptor[];

/**
 * Serialized cache of element descriptions.
 */
export type DescriptionsSerializedCache = Record<
  string,
  ElementDescription | null
>;

/**
 * Serialized cache of file elements.
 */
export type FileElementsSerializedCache = Record<
  string,
  ElementDescription | null
>;

/**
 * Serialized cache for ElementsDescriptor class.
 */
export type ElementsDescriptorSerializedCache = {
  /** Serialized descriptions cache */
  descriptions: DescriptionsSerializedCache;
  /** Serialized files cache */
  files: FileElementsSerializedCache;
};

/**
 * Captured values from an element path.
 */
export type CapturedValues = Record<string, string>;

/**
 * Origins of a file
 */
export const FILE_ORIGINS_MAP = {
  /** Origin of local files */
  LOCAL: "local",
  /** Origin of external files (libraries) */
  EXTERNAL: "external",
  /** Origin of core files */
  CORE: "core",
} as const;

/**
 * Kind of file origin, either local, external, or core.
 */
export type FileOrigin =
  (typeof FILE_ORIGINS_MAP)[keyof typeof FILE_ORIGINS_MAP];

/**
 * Ordered values assigned to type/category in element descriptions.
 * Values include only matching descriptor values for that key.
 */
export type ElementDescriptionMatchValues = string[] | null;

/**
 * Base element properties related to captured values.
 */
export type BaseElementDescription = {
  /** Path of the element. */
  path: string;
  /** Type assigned to the element */
  type: string;
  /** Captured values from the element, or null if the element descriptor has no capture */
  captured: CapturedValues | null;
  /** Parent elements */
  parents: ElementParent[];
};

/**
 * Parent elements
 */
export type ElementParent = {
  /** Type of the parent element */
  type: string | null;
  /** Path of the parent element */
  path: string;
  /** Captured values from the parent element */
  captured: CapturedValues | null;
};

/**
 * Description of an element
 */
export type ElementDescription = BaseElementDescription;

// ============================================================================
// FILE DESCRIPTIONS (for file-level classifications)
// ============================================================================

/**
 * Ordered categories assigned to a file from FileDescriptor matches.
 * Files can have multiple categories (multi-match) unlike elements which have single types.
 */
export type FileCategories = string[] | null;

/**
 * Base file description properties.
 * Represents a file with its element reference and file-level classifications.
 */
export type BaseFileDescription = {
  /** Absolute path of the file */
  path: string | null;
  /** Path of the file relative to the element path (null if element is null) */
  internalPath: string | null;
  /** Categories assigned to the file by matching FileDescriptors */
  category: FileCategories;
  /** Captured values from file descriptor matches */
  captured: CapturedValues | null;
  /** The element this file belongs to (null if no ElementDescriptor matched) */
  element: ElementDescription | null;
  /** Origin of the file (local, external, core) */
  origin: FileOrigin | null;
  /** Whether the file is ignored by settings */
  isIgnored: boolean;
  /** Whether the file is unknown (no element matched the containing path) */
  isUnknown: boolean;
};

/**
 * Description of an ignored file
 */
export type IgnoredFile = BaseFileDescription & {
  category: null;
  captured: null;
  origin: null;
  isIgnored: true;
  isUnknown: true;
};

/**
 * Description of an unknown local file (matched no ElementDescriptor)
 */
export type LocalFileUnknown = BaseFileDescription & {
  path: string | null;
  category: FileCategories;
  origin: typeof FILE_ORIGINS_MAP.LOCAL;
  isIgnored: false;
  isUnknown: true;
  element: null;
};

/**
 * Description of a known local file (matched by ElementDescriptor)
 */
export type LocalFileKnown = BaseFileDescription & {
  path: string;
  internalPath: string;
  category: FileCategories;
  origin: typeof FILE_ORIGINS_MAP.LOCAL;
  isIgnored: false;
  isUnknown: false;
  element: ElementDescription;
};

/**
 * Description of an external file
 */
export type ExternalFileDescription = BaseFileDescription & {
  origin: typeof FILE_ORIGINS_MAP.EXTERNAL;
  isIgnored: false;
};

/**
 * Description of a core file
 */
export type CoreFileDescription = BaseFileDescription & {
  origin: typeof FILE_ORIGINS_MAP.CORE;
  isIgnored: false;
};

/**
 * Description of a file with its classifications and containing element
 */
export type FileDescription =
  | LocalFileKnown
  | LocalFileUnknown
  | IgnoredFile
  | ExternalFileDescription
  | CoreFileDescription;

/**
 * Serialized cache of file descriptions.
 */
export type FileDescriptionsSerializedCache = Record<string, FileDescription>;
