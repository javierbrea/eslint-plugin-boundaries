import type {
  BaseDescription,
  BaseIgnoredDescription,
  BaseKnownDescription,
  BaseUnknownDescription,
} from "../Shared";

/**
 * Base file properties related to captured values
 */
export type FileDescription = BaseDescription & {
  /**
   * @deprecated Used only for backward compatibility with legacy element descriptors with mode "file". This property will be removed in future versions.
   */
  type: string | null;
  /** Categories of the file, or null if the file is ignored or unknown */
  categories: string[] | null;
};

/**
 * Description of an ignored file
 */
export type IgnoredFileDescription = FileDescription &
  BaseIgnoredDescription & {
    /**
     * @deprecated Used only for backward compatibility with legacy element descriptors with mode "file". This property will be removed in future versions.
     */
    type: null;
    /** Categories of the file */
    categories: null;
  };

/**
 * Description of an unknown local element
 */
export type UnknownFileDescription = FileDescription &
  BaseUnknownDescription & {
    /** @deprecated Used only for backward compatibility with legacy element descriptors with mode "file". This property will be removed in future versions. */
    type: null;
    /** Categories of the file */
    categories: null;
  };

/*
 * Description of a known file
 */
export type KnownFileDescription = FileDescription &
  BaseKnownDescription & {
    /** Known files always have path  and categories */
    path: string;
    /** Categories of the file */
    categories: string[];
  };
