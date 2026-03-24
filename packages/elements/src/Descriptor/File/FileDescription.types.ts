import type { BaseDescription, BaseIgnoredDescription } from "../Shared";

/**
 * Base file properties related to captured values
 */
export type BaseFileDescription = BaseDescription & {
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
export type IgnoredFileDescription = BaseFileDescription &
  BaseIgnoredDescription & {
    /** Categories of the file */
    categories: null;
  };

/**
 * Description of an unknown local element
 */
export type UnknownFileDescription = IgnoredFileDescription & {
  /** Indicates that the file is not ignored */
  isIgnored: false;
  /** Indicates that the element is unknown */
  isUnknown: true;
};

/*
 * Description of a known file
 */
export type KnownFileDescription = BaseFileDescription & {
  /** Known files always have path  and categories */
  path: string;
  /** Categories of the file */
  categories: string[];
  /** Indicates that the file is not ignored */
  isIgnored: false;
  /** Indicates that the element is known */
  isUnknown: false;
};

/**
 * Description of a file, either ignored, known, or unknown
 */
export type FileDescription =
  | IgnoredFileDescription
  | KnownFileDescription
  | UnknownFileDescription;
