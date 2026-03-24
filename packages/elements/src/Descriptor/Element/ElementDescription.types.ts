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
  /** Parent elements */
  parents: ElementParent[] | null;
};

/**
 * Parent elements
 */
export type ElementParent = Pick<
  ElementDescription,
  "type" | "path" | "captured"
>;

/**
 * Description of an ignored element
 */
export type IgnoredElementDescription = ElementDescription &
  BaseIgnoredDescription & {
    /** Type of the element */
    type: null;
  };

/**
 * Description of an unknown local element
 */
export type UnknownElementDescription = ElementDescription &
  BaseUnknownDescription & {
    /** Path of an unknown element is null, because it can't be resolved to any descriptor */
    path: null;
    /** Type of the element. For unknown elements, the type is null because it can't be determined without a matching descriptor. */
    type: null;
    /** Parent elements. For unknown elements, parents are null because the element can't be resolved to any descriptor, so we have no information about its parents. */
    parents: null;
  };

/*
 * Description of a known element
 */
export type KnownElementDescription = ElementDescription &
  BaseKnownDescription & {
    /** Known elements always have path  and categories */
    path: string;
    /** Type of the element */
    type: string;
  };
