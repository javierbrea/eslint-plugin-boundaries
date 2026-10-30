import {
  DIAGNOSTIC_LEVELS_MAP,
  PLUGIN_ISSUES_URL,
  RULE_EFFECT_ALLOW,
} from "@boundaries/config";
import type {
  DependenciesPolicyNormalized,
  DependenciesRuleOptionsNormalized,
  Diagnostic,
  SettingsNormalized,
} from "@boundaries/config";
import {
  DEPENDENCY_RELATIONSHIPS_MAP,
  ORIGINS_MAP,
} from "@boundaries/elements";
import type {
  DependencyDescription,
  DependencySingleSelectorMatchResult,
  DependencySingleSelectorNormalized,
  Matcher,
  TemplateData,
} from "@boundaries/elements";

import { getMatcher } from "../Descriptions";
import {
  customErrorMessage,
  dependenciesRuleDefaultErrorMessage,
} from "../Messages";
import { isNull, isObject, isUndefined } from "../Shared";

import { DEPENDENCY_SKIP_REASONS_MAP } from "./Evaluation.types";
import type {
  DependencyEvaluation,
  DependencySkipOptions,
  DependencySkipReason,
  PolicyEvaluation,
} from "./Evaluation.types";
import { precomputePolicy } from "./Selectors";

/**
 * Template data passed to the matcher when legacy templates are disabled. It is a single shared object so the matcher can memoize the data it derives from it per dependency, instead of deriving it again for every policy.
 */
const EMPTY_TEMPLATE_DATA: TemplateData = Object.freeze({});

/**
 * Wraps matcher.getDependencySelectorMatchingDescription catching any errors, so an unexpected error in a selector does not stop the evaluation.
 * @param dep The dependency description.
 * @param matcher The elements matcher.
 * @param selector The dependency selector to match.
 * @param extraTemplateData Extra data to pass to the templates of the selector values.
 * @param diagnostics The diagnostics of the evaluation, which receive the error.
 * @param policyIndex The index of the policy of the selector.
 * @returns The match result, or null when the selector does not match or the matcher throws.
 */
function safeMatch(
  dep: DependencyDescription,
  matcher: Matcher,
  selector: DependencySingleSelectorNormalized,
  extraTemplateData: TemplateData,
  diagnostics: Diagnostic[],
  policyIndex: number
): DependencySingleSelectorMatchResult | null {
  try {
    return matcher.getDependencySelectorMatchingDescription(dep, selector, {
      extraTemplateData,
    });
  } catch (error) {
    diagnostics.push({
      level: DIAGNOSTIC_LEVELS_MAP.WARNING,
      title: `Error occurred while matching dependency. Please report it at: ${PLUGIN_ISSUES_URL}`,
      detail: `${JSON.stringify({
        error: isObject(error)
          ? { message: error.message, stack: error.stack }
          : String(error),
        dependency: dep,
        selector,
        extraTemplateData,
      })}.`,
      paths: [["policies", policyIndex]],
    });
    return null;
  }
}

/**
 * Iterates precomputed selectors of a policy returning the first match, or null.
 * @param options - The selectors and the data to match them.
 * @param options.selectors - Precomputed dependency selectors for the policy.
 * @param options.dep - The dependency description under evaluation.
 * @param options.matcher - The elements matcher instance used to evaluate matches.
 * @param options.templateData - The template data object containing captured values for template rendering.
 * @param options.diagnostics - The diagnostics of the evaluation.
 * @param options.policyIndex - The index of the policy.
 * @returns The match result from the first matching selector, or null if no selectors matched.
 */
function evaluateEffectEntries({
  selectors,
  dep,
  matcher,
  templateData,
  diagnostics,
  policyIndex,
}: {
  selectors: DependencySingleSelectorNormalized[];
  dep: DependencyDescription;
  matcher: Matcher;
  templateData: TemplateData;
  diagnostics: Diagnostic[];
  policyIndex: number;
}): DependencySingleSelectorMatchResult | null {
  for (const selector of selectors) {
    const result = safeMatch(
      dep,
      matcher,
      selector,
      templateData,
      diagnostics,
      policyIndex
    );
    if (result) {
      return result;
    }
  }
  return null;
}

/**
 * Builds template data for legacy `${...}` placeholders from captured values.
 *
 * @param rule - Policy currently being evaluated.
 * @param dep - Dependency description under evaluation.
 * @param legacyTemplates - Whether legacy template mode is enabled.
 * @returns Template data object consumed by matcher template rendering.
 */
function getCapturedTemplateData(
  rule: DependenciesPolicyNormalized,
  dep: DependencyDescription,
  legacyTemplates: boolean
): TemplateData {
  if (!legacyTemplates) return EMPTY_TEMPLATE_DATA;
  // Surviving Stryker mutant: replacing "to" with an empty string survives because targetDir is only compared with "from"
  const targetDir = rule.from ? "from" : "to";
  return targetDir === "from"
    ? {
        ...dep.from.element.captured,
        from: dep.from.element.captured,
        to: dep.to.element.captured,
      }
    : {
        ...dep.to.element.captured,
        from: dep.from.element.captured,
        to: dep.to.element.captured,
      };
}

/** A custom message, with the index of the policy that sets it, or null when the options set it. */
type ResolvedCustomMessage = {
  template: string;
  policyIndex: number | null;
};

/**
 * Resolves the custom error message of a violation, preferring the message of the deciding policy over the message of the options.
 * @param policyIndex The index of the policy that decided, if any.
 * @param options The normalized options of the rule.
 * @returns The custom message and where it is set, or undefined when there is none.
 */
export function resolveCustomMessage(
  policyIndex: number | null,
  options: DependenciesRuleOptionsNormalized
): ResolvedCustomMessage | undefined {
  const policyMessage = isNull(policyIndex)
    ? undefined
    : options.policies[policyIndex].message;
  if (!isUndefined(policyMessage)) {
    return { template: policyMessage, policyIndex };
  }
  return isUndefined(options.message)
    ? undefined
    : { template: options.message, policyIndex: null };
}

/**
 * Renders a custom message, naming it and where it is set when it fails to render.
 * @param customMessage The custom message and where it is set.
 * @param customMessage.template
 * @param customMessage.policyIndex
 * @param dependency The dependency description.
 * @param ruleIndex The index of the policy that produced the violation, if any.
 * @param matchResult The result of matching the dependency against the policy selector, if any.
 * @returns The rendered message.
 * @throws An error naming the message and where it is set, with the Handlebars error as its `cause`, when the message fails to render.
 */
function renderCustomMessage(
  { template, policyIndex }: ResolvedCustomMessage,
  dependency: DependencyDescription,
  ruleIndex: number | null,
  matchResult: DependencySingleSelectorMatchResult | null
): string {
  try {
    return customErrorMessage(template, dependency, ruleIndex, matchResult);
  } catch (error) {
    const owner = isNull(policyIndex)
      ? "the rule options"
      : `the policy at index ${policyIndex}`;
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `The custom message ${JSON.stringify(template)} of ${owner} failed to render: ${reason}`,
      { cause: error }
    );
  }
}

type BuildErrorMessageParams = {
  matchResult: DependencySingleSelectorMatchResult | null;
  ruleIndex: number | null;
  customMessage: ResolvedCustomMessage | undefined;
  dependency: DependencyDescription;
};

/**
 * Builds the error message for a dependency violation.
 * @param params Violation information.
 * @param params.matchResult The result of matching the dependency against the policy selector, if any.
 * @param params.ruleIndex The index of the policy that produced the violation, if any.
 * @param params.customMessage The custom message configured for the violation and where it is set, if any.
 * @param params.dependency The dependency description.
 * @returns The error message.
 * @throws An error naming the custom message and where it is set, with the Handlebars error as its `cause`, when the custom message fails to render.
 */
export function buildErrorMessage({
  matchResult,
  ruleIndex,
  customMessage,
  dependency,
}: BuildErrorMessageParams): string {
  if (customMessage?.template) {
    return renderCustomMessage(
      customMessage,
      dependency,
      ruleIndex,
      matchResult
    );
  }
  return dependenciesRuleDefaultErrorMessage(
    matchResult,
    ruleIndex,
    dependency
  );
}

/**
 * Evaluates the policies of the `dependencies` rule against a dependency, as the rule does.
 *
 * For each policy, the outer `from`/`to`/`dependency` fields are merged with each entry in `allow`/`disallow` to build the final dependency selector. Policies follow **last-write-wins** semantics: the last policy that produces a match decides. Within a single policy, `disallow` takes precedence over `allow`: `allow` is not evaluated when `disallow` already matched. When no policy matches, `options.default` decides.
 * @param settings The settings, normalized by `@boundaries/config`.
 * @param options The options of the rule, normalized by `@boundaries/config`.
 * @param dependency The description of the dependency.
 * @returns The verdict, the deciding policy and match, the message of a violation, and the problems found while matching.
 * @throws An error naming the custom `message` and where it is set, with the Handlebars error as its `cause`, when the dependency is not allowed and its custom `message` fails to render, such as one with invalid syntax or an unknown helper.
 */
export function evaluatePolicies(
  settings: SettingsNormalized,
  options: DependenciesRuleOptionsNormalized,
  dependency: DependencyDescription
): PolicyEvaluation {
  const matcher = getMatcher(settings);
  const diagnostics: Diagnostic[] = [];
  let allowed: boolean | null = null;
  let policyIndex: number | null = null;
  let match: DependencySingleSelectorMatchResult | null = null;

  for (let i = 0; i < options.policies.length; i++) {
    const policy = options.policies[i];
    const templateData = getCapturedTemplateData(
      policy,
      dependency,
      settings.legacyTemplates
    );

    const precomputedPolicy = precomputePolicy(policy);

    let disallowMatched = false;
    if (precomputedPolicy.precomputedDisallow) {
      const disallowMatch = evaluateEffectEntries({
        selectors: precomputedPolicy.precomputedDisallow,
        dep: dependency,
        matcher,
        templateData,
        diagnostics,
        policyIndex: i,
      });
      if (disallowMatch) {
        allowed = false;
        policyIndex = i;
        match = disallowMatch;
        disallowMatched = true;
      }
    }

    // Allow is only evaluated when disallow did not match for this policy
    if (!disallowMatched && precomputedPolicy.precomputedAllow) {
      const allowMatch = evaluateEffectEntries({
        selectors: precomputedPolicy.precomputedAllow,
        dep: dependency,
        matcher,
        templateData,
        diagnostics,
        policyIndex: i,
      });
      if (allowMatch) {
        allowed = true;
        policyIndex = i;
        match = allowMatch;
      }
    }
  }

  if (allowed ?? options.default === RULE_EFFECT_ALLOW) {
    return { allowed: true, policyIndex, match, diagnostics };
  }
  return {
    allowed: false,
    policyIndex,
    match,
    message: buildErrorMessage({
      matchResult: match,
      ruleIndex: policyIndex,
      customMessage: resolveCustomMessage(policyIndex, options),
      dependency,
    }),
    diagnostics,
  };
}

/**
 * Returns why the `dependencies` rule does not evaluate a dependency, checking the reasons in the order of `DependencySkipReason`.
 * @param options The options of the rule, as the user wrote them or normalized. An option that is not set is false.
 * @param dependency The description of the dependency.
 * @returns The first reason that applies, or null when the rule evaluates the dependency.
 */
export function getDependencySkipReason(
  options: DependencySkipOptions | undefined,
  dependency: DependencyDescription
): DependencySkipReason | null {
  if (dependency.from.file.isIgnored) {
    return DEPENDENCY_SKIP_REASONS_MAP.FROM_IGNORED;
  }
  if (dependency.from.file.isUnknown && dependency.from.element.isUnknown) {
    return DEPENDENCY_SKIP_REASONS_MAP.FROM_UNKNOWN;
  }
  const isLocal = dependency.to.module.origin === ORIGINS_MAP.LOCAL;
  if (isLocal && dependency.to.file.isIgnored) {
    return DEPENDENCY_SKIP_REASONS_MAP.TO_IGNORED;
  }
  if (!isLocal && !options?.checkAllOrigins) {
    return DEPENDENCY_SKIP_REASONS_MAP.NOT_LOCAL;
  }
  if (
    isLocal &&
    dependency.to.file.isUnknown &&
    dependency.to.element.isUnknown &&
    !options?.checkUnknownLocals
  ) {
    return DEPENDENCY_SKIP_REASONS_MAP.UNKNOWN_LOCAL;
  }
  if (
    dependency.dependency.relationship.to ===
      DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL &&
    !options?.checkInternals
  ) {
    return DEPENDENCY_SKIP_REASONS_MAP.INTERNAL;
  }
  return null;
}

/**
 * Evaluates a dependency as the `dependencies` rule does: it checks first whether the rule evaluates it, and then evaluates the policies.
 * @param settings The settings, normalized by `@boundaries/config`.
 * @param options The options of the rule, normalized by `@boundaries/config`.
 * @param dependency The description of the dependency.
 * @returns The reason why the dependency is not evaluated, or the evaluation of the policies.
 * @throws An error naming the custom `message` and where it is set, with the Handlebars error as its `cause`, when the dependency is not allowed and its custom `message` fails to render, such as one with invalid syntax or an unknown helper.
 */
export function evaluateDependency(
  settings: SettingsNormalized,
  options: DependenciesRuleOptionsNormalized,
  dependency: DependencyDescription
): DependencyEvaluation {
  const reason = getDependencySkipReason(options, dependency);
  if (reason) {
    return { checked: false, reason };
  }
  return { checked: true, ...evaluatePolicies(settings, options, dependency) };
}
