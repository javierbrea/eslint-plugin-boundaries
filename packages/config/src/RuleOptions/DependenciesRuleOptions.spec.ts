import type { DependenciesRuleOptions } from "../Shared";

import { normalizeDependenciesRuleOptions } from "./DependenciesRuleOptions";

describe("DependenciesRuleOptions", () => {
  describe("normalizeDependenciesRuleOptions", () => {
    it("applies the defaults when there are no options", () => {
      const result = normalizeDependenciesRuleOptions(undefined);

      expect(result).toEqual({
        default: "disallow",
        message: undefined,
        policies: [],
        checkAllOrigins: false,
        checkUnknownLocals: false,
        checkInternals: false,
      });
    });

    it("keeps the default effect, the message and the check options", () => {
      const result = normalizeDependenciesRuleOptions({
        default: "allow",
        message: "Not allowed",
        checkAllOrigins: true,
        checkUnknownLocals: true,
        checkInternals: true,
      });

      expect(result).toEqual({
        default: "allow",
        message: "Not allowed",
        policies: [],
        checkAllOrigins: true,
        checkUnknownLocals: true,
        checkInternals: true,
      });
    });

    it("uses 'disallow' as default effect when it is not 'allow'", () => {
      const result = normalizeDependenciesRuleOptions({
        default: "disallow",
      });

      expect(result.default).toBe("disallow");
    });

    it("normalizes the selectors of each policy, keeping its message and importKind", () => {
      const result = normalizeDependenciesRuleOptions({
        policies: [
          {
            from: { element: { type: "a" } },
            to: { element: { type: "b" } },
            dependency: { kind: "type" },
            disallow: { to: { element: { type: "c" } } },
            importKind: "value",
            message: "Policy message",
          },
        ],
      });

      expect(result.policies).toEqual([
        {
          from: [{ element: [{ type: "a" }] }],
          to: [{ element: [{ type: "b" }] }],
          dependency: [{ kind: "type" }],
          allow: undefined,
          disallow: [{ to: [{ element: [{ type: "c" }] }] }],
          importKind: "value",
          message: "Policy message",
        },
      ]);
    });

    it("normalizes allow and disallow entries written as entity selectors", () => {
      const result = normalizeDependenciesRuleOptions({
        policies: [
          {
            from: { element: { type: "a" } },
            allow: ["b"],
          },
        ],
      } as unknown as DependenciesRuleOptions);

      expect(result.policies[0].allow).toEqual([{ element: [{ type: "b" }] }]);
      expect(result.policies[0].to).toBeUndefined();
      expect(result.policies[0].dependency).toBeUndefined();
    });

    it("uses the deprecated 'rules' option when 'policies' is not set", () => {
      const result = normalizeDependenciesRuleOptions({
        rules: [{ allow: { to: { element: { type: "a" } } } }],
      });

      expect(result.policies).toHaveLength(1);
    });

    it("ignores the deprecated 'rules' option when 'policies' is set", () => {
      const result = normalizeDependenciesRuleOptions({
        policies: [],
        rules: [{ allow: { to: { element: { type: "a" } } } }],
      });

      expect(result.policies).toEqual([]);
    });

    it("keeps every policy at the index it has in the options", () => {
      const result = normalizeDependenciesRuleOptions({
        policies: [
          { allow: { to: { element: { type: "a" } } } },
          { allow: { to: { element: { type: "b" } } }, message: "second" },
        ],
      });

      expect(result.policies.map(({ message }) => message)).toEqual([
        undefined,
        "second",
      ]);
    });

    it("does not mutate its input", () => {
      const options: DependenciesRuleOptions = {
        policies: [
          {
            from: { element: { type: "a" } },
            allow: { to: { element: { type: "b" } } },
          },
        ],
      };
      const copy = structuredClone(options);

      normalizeDependenciesRuleOptions(options);

      expect(options).toEqual(copy);
    });
  });
});
