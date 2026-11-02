jest.mock("../Debug", () => {
  const mockWarnOnce = jest.fn();
  return {
    warnOnce: mockWarnOnce,
    // Prints through the mocked warnOnce, as the real one does
    warnDiagnostics: jest.fn(
      (diagnostics: { title: string; detail?: string }[]) => {
        for (const { title, detail } of diagnostics) {
          mockWarnOnce(title, detail);
        }
      }
    ),
  };
});

import { warnOnce } from "../Debug";
import { RULE_NAMES_MAP } from "../Shared";
import type {
  DependenciesRuleOptions,
  RuleOptionsWithPolicies,
} from "../Shared";

import {
  getDependenciesRuleOptions,
  validateAndWarnRuleOptions,
  warnMigrationToDependencies,
} from "./Rules";

const mockedWarnOnce = jest.mocked(warnOnce);

describe("Settings/Rules", () => {
  beforeEach(() => {
    mockedWarnOnce.mockClear();
  });

  describe("validateAndWarnRuleOptions", () => {
    const legacyOptions = (): RuleOptionsWithPolicies => ({
      policies: [
        {
          from: "legacy-string",
          to: { element: { type: "b" } },
        },
      ],
    });

    it("does nothing when options are undefined", () => {
      validateAndWarnRuleOptions(undefined, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("prints the problems of the policies", () => {
      validateAndWarnRuleOptions(
        legacyOptions(),
        RULE_NAMES_MAP.DEPENDENCIES,
        true
      );

      expect(mockedWarnOnce).toHaveBeenCalledWith(
        `[${RULE_NAMES_MAP.DEPENDENCIES}] Detected legacy string element selectors in 1 policy at indices: 0.`,
        expect.any(String)
      );
    });

    it("does not validate the options against the rule schema, which ESLint does", () => {
      const options = {
        policies: [],
        unknownOption: true,
      } as unknown as RuleOptionsWithPolicies;

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("does not warn again for the same options object on subsequent invocations", () => {
      const options = legacyOptions();

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, true);
      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
    });

    it("still caches via WeakSet: second call with same options is skipped even when legacyWarnings changes", () => {
      const options = legacyOptions();

      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, false);
      mockedWarnOnce.mockClear();
      validateAndWarnRuleOptions(options, RULE_NAMES_MAP.DEPENDENCIES, true);

      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });
  });

  describe("getDependenciesRuleOptions", () => {
    it("returns the default options when there are none", () => {
      const result = getDependenciesRuleOptions(undefined);

      expect(result).toEqual({
        default: "disallow",
        message: undefined,
        policies: [],
        checkAllOrigins: false,
        checkUnknownLocals: false,
        checkInternals: false,
      });
    });

    it("returns the normalized options", () => {
      const result = getDependenciesRuleOptions({
        default: "allow",
        policies: [{ allow: { to: { element: { type: "a" } } } }],
      });

      expect(result.default).toBe("allow");
      expect(result.policies).toEqual([
        expect.objectContaining({
          allow: [{ to: [{ element: [{ type: "a" }] }] }],
        }),
      ]);
    });

    it("caches the normalized options per options reference", () => {
      const options: DependenciesRuleOptions = {
        policies: [{ allow: { to: { element: { type: "a" } } } }],
      };

      const first = getDependenciesRuleOptions(options);
      const second = getDependenciesRuleOptions(options);

      expect(first).toBe(second);
    });
  });

  describe("warnMigrationToDependencies", () => {
    it("warns about deprecation and points to the dependencies rule", () => {
      warnMigrationToDependencies(RULE_NAMES_MAP.ELEMENT_TYPES);

      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining(RULE_NAMES_MAP.ELEMENT_TYPES),
        expect.stringContaining(RULE_NAMES_MAP.DEPENDENCIES)
      );
    });
  });
});
