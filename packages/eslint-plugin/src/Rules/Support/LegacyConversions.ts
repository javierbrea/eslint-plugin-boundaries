import { isObject } from "../../Support";

/**
 * Normalizes a rule that uses the legacy `importKind` option by injecting its value into
 * `dependency.kind`. If `dependency.kind` is already explicitly set in the rule, it takes
 * precedence and `importKind` is simply dropped.
 *
 * @deprecated This function exists only for backward compatibility with the `importKind` rule
 * option deprecated in v6. Remove in next major version once `importKind` is no longer supported.
 */
export function normalizeRuleLegacyOptions(
  rule: Record<string, unknown>
): Record<string, unknown> {
  if (!rule.importKind) {
    return rule;
  }

  const existingDependency = isObject(rule.dependency)
    ? (rule.dependency as Record<string, unknown>)
    : {};

  // If dependency.kind is already explicitly defined, it takes precedence over importKind.
  if (existingDependency.kind !== undefined) {
    return { ...rule, importKind: undefined };
  }

  return {
    ...rule,
    importKind: undefined,
    dependency: { ...existingDependency, kind: rule.importKind },
  };
}
