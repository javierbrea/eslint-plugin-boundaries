import type {
  DependencyVerdict,
  DisallowedVerdict,
  NotEvaluatedReason,
  PolicyRef,
  PolicySummary,
  SkipReason,
} from "@/domains/evaluation/helpers/engine";
import type { StateTone } from "@/ui-kit/helpers/tone";

import type { DecidedVerdict, VerdictIcon } from "./verdictText.types";

/** How each skip reason is called next to a verdict. The reasons that are not here are written as they are */
const SKIP_REASON_LABELS: Readonly<Partial<Record<SkipReason, string>>> = {
  "not-local": "external",
  "not-read": "not read",
};

/** Why the rule does not check a dependency, and the option that changes it when there is one */
const SKIP_REASON_SENTENCES: Readonly<Record<SkipReason, string>> = {
  "from-ignored":
    "Not checked: the file that imports is ignored by the boundaries/ignore or boundaries/include settings.",
  "from-unknown":
    "Not checked: the file that imports matches no element and no file category, so the rule does not know what it is.",
  "to-ignored":
    "Not checked: the file it points to is ignored by the boundaries/ignore or boundaries/include settings.",
  "not-local":
    "Not checked: the dependency is not local, and the rule checks external and core modules only with checkAllOrigins.",
  "unknown-local":
    "Not checked: the file it points to matches no element and no file category, and the rule checks those only with checkUnknownLocals.",
  internal:
    "Not checked: both files belong to the same element, and the rule checks those only with checkInternals.",
  "not-read":
    "Not checked: the plugin never reads this kind of statement, because boundaries/dependency-nodes leaves its syntax out.",
};

/** Why no dependency is evaluated, as the note of the problems panel says it */
const NOT_EVALUATED_SENTENCES: Readonly<Record<NotEvaluatedReason, string>> = {
  "config-unparsed":
    "Dependencies are not evaluated while the config cannot be read: without its rules, ESLint checks no dependency.",
  "rules-invalid":
    "Dependencies are not evaluated while the rule options are invalid: ESLint does not run a rule whose options fail its schema.",
  "no-rule":
    "Dependencies are not evaluated while neither boundaries/dependencies nor boundaries/element-types is in the rules: ESLint runs no rule that checks them.",
  "rule-off":
    "Dependencies are not evaluated while the rule is off: ESLint does not run a rule whose severity is off.",
  "no-options":
    "Dependencies are not evaluated while the rule has no options: it checks nothing until its entry has an options object, even an empty one.",
};

/** What a policy does, as a row of the inspector writes it in place of the elements it names */
const ACTION_LABELS: Readonly<Record<PolicySummary["action"], string>> = {
  allow: "allow",
  disallow: "disallow",
  both: "allow, disallow",
};

/**
 * Picks the color of a verdict.
 * @param verdict What the engine says about a dependency.
 * @returns `ok` for an allowed dependency, `bad` for a disallowed one, `warn` when the rule is a warning, and `faint` for one that is not checked, not evaluated or not evaluated yet.
 */
export function getVerdictTone(verdict: DependencyVerdict): StateTone {
  if (verdict.status === "allowed") {
    return "ok";
  }
  if (verdict.status === "disallowed") {
    return verdict.level === "warning" ? "warn" : "bad";
  }
  return "faint";
}

/**
 * Picks the icon of a verdict.
 * @param verdict What the engine says about a dependency.
 * @returns `check` for an allowed dependency, `cross` for a disallowed one, `warn` when the rule is a warning, and `skip` for one that is not checked or not evaluated.
 */
export function getVerdictIcon(verdict: DecidedVerdict): VerdictIcon {
  if (verdict.status === "allowed") {
    return "check";
  }
  if (verdict.status === "disallowed") {
    return verdict.level === "warning" ? "warn" : "cross";
  }
  return "skip";
}

/**
 * Names the policy that decided a dependency.
 * @param policy The policy, or `undefined` when none is known because the custom message failed to render.
 * @returns `policy 2` for the policy with the index 2, `default` for the default and `custom message` when there is none.
 */
export function getPolicyName(policy: PolicyRef | undefined): string {
  if (policy === undefined) {
    return "custom message";
  }
  return policy.index === null ? "default" : `policy ${policy.index}`;
}

/**
 * Names a skip reason next to a verdict.
 * @param reason Why the rule does not check a dependency.
 * @returns `external` for `not-local`, `not read` for `not-read` and the reason as it is for the others.
 */
export function getSkipReasonLabel(reason: SkipReason): string {
  return SKIP_REASON_LABELS[reason] ?? reason;
}

/**
 * Writes a verdict as the file pane shows it after the icon.
 * @param verdict What the engine says about a dependency.
 * @returns The policy that decided, as `getPolicyName` writes it, for an allowed or a disallowed dependency; `not checked · <reason>` for one that is not checked; and `not evaluated` otherwise.
 */
export function getVerdictLabel(verdict: DecidedVerdict): string {
  if (verdict.status === "allowed" || verdict.status === "disallowed") {
    return getPolicyName(verdict.policy);
  }
  return verdict.status === "not-checked"
    ? `not checked · ${getSkipReasonLabel(verdict.reason)}`
    : "not evaluated";
}

/**
 * Explains a skip reason in a sentence, for the tooltip of a verdict and for the dependency tab.
 * @param reason Why the rule does not check a dependency.
 * @returns Why the rule does not check it and, when an option changes that, which one.
 */
export function getSkipReasonSentence(reason: SkipReason): string {
  return SKIP_REASON_SENTENCES[reason];
}

/**
 * Explains in a sentence why no dependency is evaluated, for the note of the problems panel.
 * @param reason Why no dependency is evaluated.
 * @returns The sentence.
 */
export function getNotEvaluatedSentence(reason: NotEvaluatedReason): string {
  return NOT_EVALUATED_SENTENCES[reason];
}

/**
 * Writes the meta line of the row of a problem for a disallowed dependency.
 * @param verdict A dependency that was disallowed.
 * @returns `disallowed · policy 2`, `disallowed · default` or `disallowed · custom message`.
 */
export function getVerdictMeta(verdict: DisallowedVerdict): string {
  return `disallowed · ${getPolicyName(verdict.policy)}`;
}

/**
 * Names the row of a policy in the inspector of the config.
 * @param summary The policy of the evaluated rule, or its default.
 * @returns `<index> · <from> → <to>`, where `from` is the names of the element types and file categories that its `from` selectors name, or what the policy does when it names none, and `to` is the names its `to` selectors name, or `*` when it names none. The default is `default · <action>`.
 */
export function getPolicyRowName(summary: PolicySummary): string {
  const action = ACTION_LABELS[summary.action];
  if (summary.index === null) {
    return `default · ${action}`;
  }
  const from = summary.from.length > 0 ? summary.from.join(", ") : action;
  const to = summary.to.length > 0 ? summary.to.join(", ") : "*";
  return `${summary.index} · ${from} → ${to}`;
}
