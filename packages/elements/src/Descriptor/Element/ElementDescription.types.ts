import type {
  BaseDescription,
  BaseIgnoredDescription,
  BaseKnownDescription,
  BaseUnknownDescription,
} from "../Shared/BaseDescription.types";

/**
 * Base element properties related to captured values
 */
export type ElementDescription = BaseDescription & {
  /** Type of the element */
  type: string | null;
  /**
   * Category of the element
   * @deprecated This property is deprecated and will be removed in future versions.
   */
  category: string | null;
  /** Internal path of the file relative to the element it belongs to, or null in case it has not related file */
  fileInternalPath: string | null;
  /** Parent elements */
  parents: ElementParent[];
};

/**
 * Parent elements
 */
export type ElementParent = Pick<
  ElementDescription,
  "type" | "category" | "path" | "captured"
>;

/**
 * Description of an ignored element
 */
export type IgnoredElementDescription = ElementDescription &
  BaseIgnoredDescription & {
    /** Path of an ignored element is null, because it can't be resolved to any descriptor */
    path: null;
    /** Type of the element */
    type: null;
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
    /** Type of the element. For unknown elements, the type is null because it can't be determined without a matching descriptor. */
    type: null;
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
     * Type of the element
     **/
    type: string | null; // TODO: This should be always string when legacy category property is removed
    /** Parent elements. For known elements, parents is an array of parent descriptions, which may be empty if the element has no parents. */
    parents: ElementParent[];
  };
