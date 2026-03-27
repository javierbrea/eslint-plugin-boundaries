/**
 * Data to pass to selector templates when they are rendered before matching.
 */
export type TemplateData = Record<string, unknown>;

/**
 * Options for elements and dependencies matchers.
 */
export type MatcherOptions = {
  /** Extra data to pass to captured values templates. By default, data from the element and dependency being matched is passed as to/from. */
  extraTemplateData?: TemplateData;
};

/**
 * Options for entity matcher
 */
export type EntityMatcherOptions = MatcherOptions & {
  /** Optional source of the entity being matched in case it is a dependency */
  source?: string;
};
