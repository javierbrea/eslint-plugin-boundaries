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
  /** Internal path of the file relative to the element it belongs to, or null in case it has not related element */
  elementInternalPath: string | null;
  /** Categories of the file, or null if the file is ignored or unknown */
  categories: string[] | null;
  /** Indicates if the file is external, which means that it may have been flagged as external by settings */
  isExternal: boolean;
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
    /** Path of an unknown file is null, because it can't be resolved to any descriptor */
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
