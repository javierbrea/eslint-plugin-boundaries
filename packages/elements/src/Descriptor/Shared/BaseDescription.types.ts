/**
 * Captured values from an element or file path
 */
export type CapturedValues = Record<string, string>;

/**
 * Base element properties related to captured values
 */
export type BaseDescription = {
  /** Absolute path of the item. It might be null when a dependency path can't be resolved */
  path: string | null;
  /** Captured values from the item, or null if the item descriptor has no capture or the item is ignored or unknown */
  captured: CapturedValues | null;
  /** Indicates if the item is ignored by settings. If true, it will be excluded from processing any other properties. */
  isIgnored: boolean;
  /** Indicates if the item is unknown, which means that it cannot be resolved to any descriptor */
  isUnknown: boolean;
};

/**
 * Description of an ignored item
 */
export type BaseIgnoredDescription = BaseDescription & {
  /** Ignored items have not captured values */
  captured: null;
  /** Indicates if the item is ignored */
  isIgnored: true;
  /** Indicates that the item is unknown */
  isUnknown: true;
};

/**
 * Description of a known item, which has a path and captured values
 */
export type BaseKnownDescription = BaseDescription & {
  /** Known items always have a path */
  path: string;
  /** Indicates if the item is ignored */
  isIgnored: false;
  /** Indicates that the item is known */
  isUnknown: false;
};

/**
 * Description of an unknown item, which has no captured values and is not ignored
 */
export type BaseUnknownDescription = BaseDescription & {
  /** Unknown items have not captured values */
  captured: null;
  /** Indicates that the item is not ignored */
  isIgnored: false;
  /** Indicates that the item is unknown */
  isUnknown: true;
};
