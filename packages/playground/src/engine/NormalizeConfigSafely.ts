import {
  normalizeConfig,
  normalizeDependenciesRuleOptions,
  RULE_SEVERITIES_MAP,
  validateRuleOptions,
} from "@boundaries/config";
import type {
  ConfigNormalized,
  ConfigResult,
  DependenciesPolicy,
  DependenciesRuleOptions,
  Diagnostic,
  RuleName,
} from "@boundaries/config";

/** What the plugin does with an entry that `normalizeConfig` throws for, which the editor has to say because the throw itself says nothing about it */
const THROWN_DETAIL =
  "ESLint stops with this error at the first dependency that the rule checks.";

/** The entry of a rule written as a list, with its key in `rules`. Only a list has options to normalize, so a severity alone cannot throw */
type ListEntry = {
  /** The key in `rules`, such as `boundaries/dependencies` */
  readonly ruleId: string;
  /** The severity and the options */
  readonly entry: readonly unknown[];
};

/**
 * Runs a normalization and tells why it throws.
 * @param normalize What to run.
 * @returns The message of what it throws, or `undefined` when it does not throw.
 */
function getThrownMessage(normalize: () => unknown): string | undefined {
  try {
    normalize();
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/**
 * Tells whether the entry of a rule throws when it is normalized with the settings.
 * @param settings The settings as written.
 * @param listEntry The entry and its key in `rules`.
 * @returns `true` when `normalizeConfig` throws for a config that has only this entry.
 */
function throwsAlone(settings: unknown, listEntry: ListEntry): boolean {
  const { ruleId, entry } = listEntry;
  return (
    getThrownMessage(() =>
      normalizeConfig({ settings, rules: { [ruleId]: entry } })
    ) !== undefined
  );
}

/**
 * Describes why the entry of a rule throws: the diagnostics that `normalizeConfig` would have given it, and an error for each policy that throws.
 * @param listEntry The entry that throws, and its key in `rules`.
 * @param listEntry.ruleId The key in `rules`.
 * @param listEntry.entry The severity and the options.
 * @param legacyWarnings Whether the options are checked for legacy syntax, from the normalized settings.
 * @returns The diagnostics of the options, then one error per policy that throws, with paths from the root of the config. None when the rule is off: ESLint does not run it, so it never meets the error, and the plugin reports nothing for the options of an off rule.
 */
function diagnoseThrowingEntry(
  { ruleId, entry }: ListEntry,
  legacyWarnings: boolean
): Diagnostic[] {
  // An entry that throws passed the schema, which has the options as an object with a list of policies
  const [severity, options] = entry as [unknown, DependenciesRuleOptions];
  if (severity === 0 || severity === RULE_SEVERITIES_MAP.OFF) {
    return [];
  }

  const entryPath = ["rules", ruleId, 1];
  const policiesKey = options.policies ? "policies" : "rules";
  const policies = options[policiesKey] as DependenciesPolicy[];

  const optionsDiagnostics = validateRuleOptions(ruleId as RuleName, options, {
    legacyWarnings,
    // The options already passed the schema, as `normalizeConfig` does before it normalizes them
    schema: false,
  }).map(({ paths, ...diagnostic }) => ({
    ...diagnostic,
    paths: paths.map((path) => [...entryPath, ...path]),
  }));

  const policyErrors = policies.flatMap((policy, index): Diagnostic[] => {
    const message = getThrownMessage(() =>
      normalizeDependenciesRuleOptions({ policies: [policy] })
    );
    return message === undefined
      ? []
      : [
          {
            level: "error",
            // The message of the error has no closing period, and a problem row joins the title and the detail
            title: `${message}.`,
            detail: THROWN_DETAIL,
            paths: [[...entryPath, policiesKey, index]],
          },
        ];
  });

  return [...optionsDiagnostics, ...policyErrors];
}

/**
 * Normalizes the config without the entries that throw, and says where they throw.
 * @param config The config object, as written.
 * @param config.settings The settings.
 * @param config.rules The rules, which are an object because only the normalization of their entries throws.
 * @returns The normalized config without the entries that throw, and its diagnostics followed by those of the entries that throw.
 */
function normalizeWithoutThrowingEntries({
  settings,
  rules,
}: {
  settings: unknown;
  rules: unknown;
}): ConfigResult<ConfigNormalized> {
  const entries = Object.entries(rules as Record<string, unknown>);
  const throwing = entries
    .filter(([, entry]) => Array.isArray(entry))
    .map(
      ([ruleId, entry]): ListEntry => ({
        ruleId,
        entry: entry as unknown[],
      })
    )
    .filter((listEntry) => throwsAlone(settings, listEntry));
  const throwingIds = new Set(throwing.map(({ ruleId }) => ruleId));

  const rest = normalizeConfig({
    settings,
    rules: Object.fromEntries(
      entries.filter(([ruleId]) => !throwingIds.has(ruleId))
    ),
  });
  const { legacyWarnings } = rest.value.settings;

  return {
    value: rest.value,
    diagnostics: [
      ...rest.diagnostics,
      ...throwing.flatMap((entry) =>
        diagnoseThrowingEntry(entry, legacyWarnings)
      ),
    ],
  };
}

/**
 * Normalizes a config as `normalizeConfig` does, and never throws. `normalizeConfig` throws `Invalid entity selector` for a policy whose selector `@boundaries/elements` cannot normalize, such as `{ disallow: {} }`, which a policy half typed in the editor is, and the throw drops every diagnostic of the config. The entries of the rules that throw are left out and the rest is normalized.
 * @param config The config object, as written.
 * @param config.settings The settings.
 * @param config.rules The rules.
 * @returns The normalized config and its diagnostics. For each entry that throws, they end with the diagnostics of its options and an error at each policy that throws, with the message of the error and a period as its title.
 */
export function normalizeConfigSafely(config: {
  settings: unknown;
  rules: unknown;
}): ConfigResult<ConfigNormalized> {
  try {
    return normalizeConfig(config);
  } catch {
    return normalizeWithoutThrowingEntries(config);
  }
}
