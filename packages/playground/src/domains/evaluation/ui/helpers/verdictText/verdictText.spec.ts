import type {
  DependencyVerdict,
  NotEvaluatedReason,
  PolicyRef,
  PolicySummary,
  SkipReason,
  TextRange,
} from "@/domains/evaluation/helpers/engine";

import {
  getNotEvaluatedSentence,
  getPolicyName,
  getPolicyRowName,
  getSkipReasonLabel,
  getSkipReasonSentence,
  getVerdictIcon,
  getVerdictLabel,
  getVerdictMeta,
  getVerdictTone,
} from "./verdictText";

/** A verdict of a dependency that was disallowed */
type DisallowedVerdict = Extract<DependencyVerdict, { status: "disallowed" }>;

const RANGE: TextRange = { from: 10, to: 20, line: 3, column: 5 };

const POLICY_2: PolicyRef = { index: 2, range: RANGE };
const DEFAULT: PolicyRef = { index: null, range: RANGE };

const ALLOWED_BY_POLICY: DependencyVerdict = {
  status: "allowed",
  policy: POLICY_2,
};
const ALLOWED_BY_DEFAULT: DependencyVerdict = {
  status: "allowed",
  policy: DEFAULT,
};
const DISALLOWED_BY_POLICY: DisallowedVerdict = {
  status: "disallowed",
  policy: POLICY_2,
  message: "Not allowed",
  level: "error",
};
const DISALLOWED_BY_DEFAULT: DisallowedVerdict = {
  status: "disallowed",
  policy: DEFAULT,
  message: "Not allowed",
  level: "error",
};
const DISALLOWED_BY_NO_POLICY: DisallowedVerdict = {
  status: "disallowed",
  policy: undefined,
  message: "The custom message failed to render",
  level: "error",
};
const WARNED_BY_POLICY: DisallowedVerdict = {
  status: "disallowed",
  policy: POLICY_2,
  message: "Not allowed",
  level: "warning",
};
const NOT_CHECKED_EXTERNAL: DependencyVerdict = {
  status: "not-checked",
  reason: "not-local",
};
const NOT_CHECKED_INTERNAL: DependencyVerdict = {
  status: "not-checked",
  reason: "internal",
};
const NOT_EVALUATED: DependencyVerdict = { status: "not-evaluated" };

/**
 * Builds the summary of a policy.
 * @param summary What differs from a policy that allows and names nothing.
 * @returns The summary.
 */
function summaryOf(summary: Partial<PolicySummary>): PolicySummary {
  return {
    index: 0,
    action: "allow",
    from: [],
    to: [],
    decided: 0,
    disallowed: 0,
    errors: 0,
    range: RANGE,
    ...summary,
  };
}

describe("VerdictText", () => {
  describe("getVerdictTone", () => {
    it.each<[string, DependencyVerdict, string]>([
      ["allowed by a policy", ALLOWED_BY_POLICY, "ok"],
      ["allowed by the default", ALLOWED_BY_DEFAULT, "ok"],
      ["disallowed by an error", DISALLOWED_BY_POLICY, "bad"],
      ["disallowed with no policy", DISALLOWED_BY_NO_POLICY, "bad"],
      ["disallowed by a warning", WARNED_BY_POLICY, "warn"],
      ["not checked", NOT_CHECKED_EXTERNAL, "faint"],
      ["not evaluated", NOT_EVALUATED, "faint"],
    ])("should color a dependency %s", (_title, verdict, tone) => {
      // Act
      const result = getVerdictTone(verdict);

      // Assert
      expect(result).toBe(tone);
    });
  });

  describe("getVerdictIcon", () => {
    it.each<[string, DependencyVerdict, string]>([
      ["allowed by a policy", ALLOWED_BY_POLICY, "check"],
      ["allowed by the default", ALLOWED_BY_DEFAULT, "check"],
      ["disallowed by an error", DISALLOWED_BY_POLICY, "cross"],
      ["disallowed with no policy", DISALLOWED_BY_NO_POLICY, "cross"],
      ["disallowed by a warning", WARNED_BY_POLICY, "warn"],
      ["not checked", NOT_CHECKED_EXTERNAL, "skip"],
      ["not evaluated", NOT_EVALUATED, "skip"],
    ])(
      "should draw a dependency %s with the icon %s",
      (_title, verdict, icon) => {
        // Act
        const result = getVerdictIcon(verdict);

        // Assert
        expect(result).toBe(icon);
      }
    );
  });

  describe("getPolicyName", () => {
    it.each<[string, PolicyRef | undefined, string]>([
      ["a policy", POLICY_2, "policy 2"],
      ["the first policy", { index: 0, range: RANGE }, "policy 0"],
      ["the default", DEFAULT, "default"],
      ["no policy", undefined, "custom message"],
    ])("should name %s", (_title, policy, expected) => {
      // Act
      const result = getPolicyName(policy);

      // Assert
      expect(result).toBe(expected);
    });
  });

  describe("getSkipReasonLabel", () => {
    it.each<[SkipReason, string]>([
      ["not-local", "external"],
      ["not-read", "not read"],
      ["from-ignored", "from-ignored"],
      ["from-unknown", "from-unknown"],
      ["to-ignored", "to-ignored"],
      ["unknown-local", "unknown-local"],
      ["internal", "internal"],
    ])("should label the reason %s as %s", (reason, label) => {
      // Act
      const result = getSkipReasonLabel(reason);

      // Assert
      expect(result).toBe(label);
    });
  });

  describe("getVerdictLabel", () => {
    it.each<[string, DependencyVerdict, string]>([
      ["allowed by a policy", ALLOWED_BY_POLICY, "policy 2"],
      ["allowed by the default", ALLOWED_BY_DEFAULT, "default"],
      ["disallowed by a policy", DISALLOWED_BY_POLICY, "policy 2"],
      ["disallowed by the default", DISALLOWED_BY_DEFAULT, "default"],
      ["disallowed with no policy", DISALLOWED_BY_NO_POLICY, "custom message"],
      [
        "not checked as external",
        NOT_CHECKED_EXTERNAL,
        "not checked · external",
      ],
      [
        "not checked as internal",
        NOT_CHECKED_INTERNAL,
        "not checked · internal",
      ],
      [
        "not checked as not read",
        { status: "not-checked", reason: "not-read" },
        "not checked · not read",
      ],
      ["not evaluated", NOT_EVALUATED, "not evaluated"],
    ])("should write a dependency %s", (_title, verdict, label) => {
      // Act
      const result = getVerdictLabel(verdict);

      // Assert
      expect(result).toBe(label);
    });
  });

  describe("getSkipReasonSentence", () => {
    it.each<[SkipReason, string]>([
      [
        "from-ignored",
        "Not checked: the file that imports is ignored by the boundaries/ignore or boundaries/include settings.",
      ],
      [
        "from-unknown",
        "Not checked: the file that imports matches no element and no file category, so the rule does not know what it is.",
      ],
      [
        "to-ignored",
        "Not checked: the file it points to is ignored by the boundaries/ignore or boundaries/include settings.",
      ],
      [
        "not-local",
        "Not checked: the dependency is not local, and the rule checks external and core modules only with checkAllOrigins.",
      ],
      [
        "unknown-local",
        "Not checked: the file it points to matches no element and no file category, and the rule checks those only with checkUnknownLocals.",
      ],
      [
        "internal",
        "Not checked: both files belong to the same element, and the rule checks those only with checkInternals.",
      ],
      [
        "not-read",
        "Not checked: the plugin never reads this kind of statement, because boundaries/dependency-nodes leaves its syntax out.",
      ],
    ])("should explain the reason %s", (reason, sentence) => {
      // Act
      const result = getSkipReasonSentence(reason);

      // Assert
      expect(result).toBe(sentence);
    });
  });

  describe("getNotEvaluatedSentence", () => {
    it.each<[NotEvaluatedReason, string]>([
      [
        "config-unparsed",
        "Dependencies are not evaluated while the config cannot be read: without its rules, ESLint checks no dependency.",
      ],
      [
        "rules-invalid",
        "Dependencies are not evaluated while the rule options are invalid: ESLint does not run a rule whose options fail its schema.",
      ],
      [
        "no-rule",
        "Dependencies are not evaluated while neither boundaries/dependencies nor boundaries/element-types is in the rules: ESLint runs no rule that checks them.",
      ],
      [
        "rule-off",
        "Dependencies are not evaluated while the rule is off: ESLint does not run a rule whose severity is off.",
      ],
      [
        "no-options",
        "Dependencies are not evaluated while the rule has no options: it checks nothing until its entry has an options object, even an empty one.",
      ],
    ])("should explain the reason %s", (reason, sentence) => {
      // Act
      const result = getNotEvaluatedSentence(reason);

      // Assert
      expect(result).toBe(sentence);
    });
  });

  describe("getVerdictMeta", () => {
    it.each<[string, DisallowedVerdict, string]>([
      ["a policy", DISALLOWED_BY_POLICY, "disallowed · policy 2"],
      ["the default", DISALLOWED_BY_DEFAULT, "disallowed · default"],
      ["no policy", DISALLOWED_BY_NO_POLICY, "disallowed · custom message"],
      ["a warning", WARNED_BY_POLICY, "disallowed · policy 2"],
    ])(
      "should write the meta line of a dependency disallowed by %s",
      (_title, verdict, meta) => {
        // Act
        const result = getVerdictMeta(verdict);

        // Assert
        expect(result).toBe(meta);
      }
    );
  });

  describe("getPolicyRowName", () => {
    it.each<[string, PolicySummary, string]>([
      [
        "a policy that names a type on each side",
        summaryOf({ index: 0, from: ["component"], to: ["helper"] }),
        "0 · component → helper",
      ],
      [
        "a policy that names several types",
        summaryOf({
          index: 1,
          from: ["module"],
          to: ["component", "helper"],
        }),
        "1 · module → component, helper",
      ],
      [
        "a policy that names several types on both sides",
        summaryOf({
          index: 4,
          from: ["page", "layout"],
          to: ["widget", "test"],
        }),
        "4 · page, layout → widget, test",
      ],
      [
        "a disallow that names only what it disallows",
        summaryOf({ index: 2, action: "disallow", to: ["test"] }),
        "2 · disallow → test",
      ],
      [
        "an allow that names only what it allows",
        summaryOf({ index: 3, action: "allow", to: ["helper"] }),
        "3 · allow → helper",
      ],
      [
        "a policy that allows and disallows and names only what it imports",
        summaryOf({ index: 5, action: "both", to: ["helper"] }),
        "5 · allow, disallow → helper",
      ],
      [
        "a policy that names nothing on the side of what it imports",
        summaryOf({ index: 6, from: ["module"], to: [] }),
        "6 · module → *",
      ],
      [
        "a policy that names nothing",
        summaryOf({ index: 7, action: "disallow" }),
        "7 · disallow → *",
      ],
      [
        "the default that disallows",
        summaryOf({ index: null, action: "disallow" }),
        "default · disallow",
      ],
      [
        "the default that allows",
        summaryOf({ index: null, action: "allow" }),
        "default · allow",
      ],
    ])("should name the row of %s", (_title, summary, expected) => {
      // Act
      const result = getPolicyRowName(summary);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
