import type {
  BaseDescription,
  BaseIgnoredDescription,
  BaseKnownDescription,
  BaseUnknownDescription,
  CapturedValues,
} from "../Shared/BaseDescription.types";

/**
 * Base element properties related to captured values
 */
export type ElementDescription = BaseDescription & {
  /** All types of the element. Contains multiple types unless elementsSingleType is enabled. */
  types: string[] | null;
  /**
   * Category of the element
   * @deprecated This property is deprecated and will be removed in future versions.
   */
  category: string | null;
  /**
   * Full filePath of the file related to the element, or null in case it has not related file
   * @deprecated This property has been temporarily added for backward compatibility with legacy mode "file", where the element description included file properties. It will be removed in future versions.
   */
  filePath: string | null;
  /**
   * Internal path of the file relative to the element it belongs to, or null in case it has not related file.
   */
  fileInternalPath: string | null;
  /** Parent elements */
  parents: ElementParent[];
};

/**
 * Parent elements
 */
export type ElementParent = {
  /** All types of the parent element. Contains multiple types unless elementsSingleType is enabled. */
  types: string[] | null;
  /**
   * Category of the parent element
   * @deprecated This property is deprecated and will be removed in future versions.
   */
  category: string | null;
  /** Path of the parent element */
  path: string | null;
  /** Captured values from the parent element's descriptor pattern */
  captured: CapturedValues | null;
};

/**
 * Description of an ignored element
 */
export type IgnoredElementDescription = ElementDescription &
  BaseIgnoredDescription & {
    /** Path of an ignored element is null, because it can't be resolved to any descriptor */
    path: null;
    /** Types of the element */
    types: null;
    /** Category of the element */
    category: null;
    /** File internal path of an ignored element is null, because it can't be resolved to any descriptor */
    fileInternalPath: null;
    /** Parent elements. For ignored elements, parents are an empty array because the element can't be resolved to any descriptor, so we have no information about its parents. */
    parents: [];
  };

/**
 * Description of an unknown local element
 */
export type UnknownElementDescription = ElementDescription &
  BaseUnknownDescription & {
    /** Path of an unknown element is null, because it can't be resolved to any descriptor */
    path: null;
    /** File internal path of an unknown element is null, because it can't be resolved to any descriptor */
    fileInternalPath: null;
    /** Types of the element. For unknown elements, the types is null because it can't be determined without a matching descriptor. */
    types: null;
    /** Category of the element. For unknown elements, the category is null because it can't be determined without a matching descriptor. */
    category: null;
    /** Parent elements. For unknown elements, parents are an empty array because the element can't be resolved to any descriptor, so we have no information about its parents. */
    parents: [];
  };

/*
 * Description of a known element
 */
export type KnownElementDescription = ElementDescription &
  BaseKnownDescription & {
    /** Known elements always have path and categories */
    path: string;
    /** File internal path of a known element */
    fileInternalPath: string;
    /**
     * All types of the element
     **/
    types: string[] | null; // TODO: This should be always string[] when legacy category property is removed
    /** filePath is always string for known elements*/
    filePath: string;
    /** Parent elements. For known elements, parents is an array of parent descriptions, which may be empty if the element has no parents. */
    parents: ElementParent[];
  };
