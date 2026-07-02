import type {
  DependencyDescription,
  DependencySingleSelectorMatchResult,
  ElementDescription,
  ElementParent,
  EntitySingleSelectorMatchResult,
} from "@boundaries/elements";

/**
 * Policy selector entity context exposed to custom message templates.
 *
 * For backward compatibility with V6 dependency selectors, element selector
 * properties are also exposed at the root level (for example `type`) in
 * addition to `element.type`.
 */
export type CustomMessageTemplatePolicyEntitySelectorContext = Omit<
  EntitySingleSelectorMatchResult,
  "origin"
> &
  Partial<NonNullable<EntitySingleSelectorMatchResult["element"]>> & {
    element?: EntitySingleSelectorMatchResult["element"];
    elementPath?: NonNullable<
      EntitySingleSelectorMatchResult["element"]
    >["filePath"];
    internalPath?: NonNullable<
      EntitySingleSelectorMatchResult["element"]
    >["fileInternalPath"];
  };

export type CustomMessageTemplatePolicyContext = {
  /** Index of the policy that triggered the error */
  index: number | null;
  /**
   * Selector of the policy that matched the dependency.
   *
   * For backward compatibility with V6 dependency selectors, `from` and `to`
   * expose element selector fields at the root level.
   */
  selector:
    | (Omit<DependencySingleSelectorMatchResult, "from" | "to"> & {
        from?: CustomMessageTemplatePolicyEntitySelectorContext;
        to?: CustomMessageTemplatePolicyEntitySelectorContext;
      })
    | null;
} | null;

/**
 * Context about the rule that matched the dependency, if any.
 * @deprecated Use `CustomMessageTemplatePolicyContext` instead.
 */
export type CustomMessageTemplateRuleContext =
  CustomMessageTemplatePolicyContext;

/** Type alias for the normalized selector exposed in `policy.selector`. */
export type CustomMessageTemplatePolicySelectorContext =
  NonNullable<CustomMessageTemplatePolicyContext>["selector"];

/** Context received by custom message templates */
export type CustomMessageTemplateContext = {
  /** Information about the dependency importer element */
  from: ElementDescription & {
    elementPath: string | null;
    internalPath: string | null;
    parents: ElementParent[];
  } & DependencyDescription["from"];
  /** Information about the dependency target element */
  to: ElementDescription & {
    elementPath: string | null;
    internalPath: string | null;
    parents: ElementParent[];
  } & DependencyDescription["to"];
  /** Information about the dependency itself */
  dependency: DependencyDescription["dependency"];
  /** Context about the policy that matched the dependency, if any */
  policy: CustomMessageTemplatePolicyContext;
  /** Context about the policy that matched the dependency, if any. @deprecated Use `policy` instead. */
  rule: CustomMessageTemplatePolicyContext;
};
