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
  /** Categories of the file, or null if the file is ignored or unknown */
  categories: string[] | null;
};

/**
 * Description of an ignored file
 */
export type IgnoredFileDescription = FileDescription &
  BaseIgnoredDescription & {
    /** Categories of the file */
    categories: null;
  };

/**
 * Description of an unknown local element
 */
export type UnknownFileDescription = FileDescription &
  BaseUnknownDescription & {
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
