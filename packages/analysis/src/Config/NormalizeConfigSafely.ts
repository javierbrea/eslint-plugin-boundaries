import {
  normalizeConfig,
  normalizeDependenciesRuleOptions,
  RULE_NAMES_MAP,
  RULE_SEVERITIES_MAP,
  validateRuleOptions,
} from "@boundaries/config";
import type {
  ConfigNormalized,
  ConfigResult,
  DependenciesPolicy,
  Diagnostic,
  NormalizeConfigOptions,
  RuleName,
} from "@boundaries/config";

import { asRecord } from "../WrittenConfig";

/** What the plugin does with an entry that `normalizeConfig` throws for, which the analysis has to say because the throw itself says nothing about it */
const THROWN_DETAIL =
  "ESLint stops with this error at the first dependency that the rule checks.";

/** The rules whose options `normalizeConfig` normalizes, so the only ones whose policies can make it throw: it keeps the options of the other rules as written */
const RULES_WITH_POLICIES: ReadonlySet<string> = new Set([
  RULE_NAMES_MAP.DEPENDENCIES,
  RULE_NAMES_MAP.ELEMENT_TYPES,
]);

/** The entry of a rule read as a list, with its key in `rules`. A severity written alone is a list of one item: `normalizeConfig` validates its empty list of options against the schema of the rule, so it can throw too */
type ListEntry = {
  /** The key in `rules`, such as `boundaries/dependencies` */
  readonly ruleId: string;
  /** The severity, then the options when they are written */
  readonly entry: readonly unknown[];
};

/** The entry of a rule that is on and throws alone, with what explains the throw */
type ThrowingEntry = ListEntry & {
  /** An error at each of its policies that throws alone, with paths from the root of the config */
  readonly policyErrors: readonly Diagnostic[];
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
 * @param ruleEntry The key in `rules` and the entry as written.
 * @param options The options of `normalizeConfig`.
 * @returns `true` when `normalizeConfig` throws for a config that has only this entry.
 */
function throwsAlone(
  settings: unknown,
  ruleEntry: [string, unknown],
  options: Pick<NormalizeConfigOptions, "rootPath">
): boolean {
  const [ruleId, entry] = ruleEntry;
  return (
    getThrownMessage(() =>
      normalizeConfig({ settings, rules: { [ruleId]: entry } }, options)
    ) !== undefined
  );
}

/**
 * Tells whether the entry of a rule is off.
 * @param listEntry The entry and its key in `rules`.
 * @param listEntry.entry The severity, then the options when they are written.
 * @returns `true` when its severity is `0` or `"off"`.
 */
function isOff({ entry }: ListEntry): boolean {
  const [severity] = entry;
  return severity === 0 || severity === RULE_SEVERITIES_MAP.OFF;
}

/**
 * Finds the policies of the entry of a rule that throw when `normalizeDependenciesRuleOptions` normalizes each one alone, which is how `normalizeConfig` throws for a policy half written, such as one being typed in an editor.
 * @param listEntry The entry and its key in `rules`.
 * @param listEntry.ruleId The key in `rules`.
 * @param listEntry.entry The severity, then the options when they are written.
 * @returns An error at each policy that throws, with the message of the error and a period as its title, and its path from the root of the config. None when `normalizeConfig` does not normalize the options of the rule, when the entry has no options, or when they have no list of policies.
 */
function getPolicyErrors({ ruleId, entry }: ListEntry): Diagnostic[] {
  const options = asRecord(entry[1]);
  if (!RULES_WITH_POLICIES.has(ruleId) || options === undefined) {
    return [];
  }

  const policiesKey = options.policies ? "policies" : "rules";
  const policies: unknown = options[policiesKey];
  if (!Array.isArray(policies)) {
    return [];
  }

  return (policies as DependenciesPolicy[]).flatMap(
    (policy, index): Diagnostic[] => {
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
              paths: [["rules", ruleId, 1, policiesKey, index]],
            },
          ];
    }
  );
}

/**
 * Describes why the entry of a rule throws: the diagnostics that `normalizeConfig` would have given its options, and the errors of its policies that throw.
 * @param throwingEntry The entry that throws, its key in `rules` and the errors of its policies.
 * @param throwingEntry.ruleId The key in `rules`.
 * @param throwingEntry.entry The severity and the options.
 * @param throwingEntry.policyErrors An error at each policy that throws.
 * @param legacyWarnings Whether the options are checked for legacy syntax, from the normalized settings.
 * @returns The diagnostics of the options, then the errors of the policies, with paths from the root of the config.
 */
function diagnoseThrowingEntry(
  { ruleId, entry, policyErrors }: ThrowingEntry,
  legacyWarnings: boolean
): Diagnostic[] {
  const entryPath = ["rules", ruleId, 1];

  const optionsDiagnostics = validateRuleOptions(ruleId as RuleName, entry[1], {
    legacyWarnings,
    // The options already passed the schema, as `normalizeConfig` does before it normalizes them
    schema: false,
  }).map(({ paths, ...diagnostic }) => ({
    ...diagnostic,
    paths: paths.map((path) => [...entryPath, ...path]),
  }));

  return [...optionsDiagnostics, ...policyErrors];
}

/**
 * Normalizes the config without the entries that throw, and says where they throw. The throw of an entry is explained when the rule is off, or when at least one of its policies throws alone. An entry that is off is left out with no diagnostic: ESLint does not run it, so it never meets the error, and the plugin reports nothing for the options of an off rule.
 * @param config The config object, as written.
 * @param config.settings The settings.
 * @param config.rules The rules, which are an object because only the normalization of their entries throws.
 * @param options The options of `normalizeConfig`.
 * @returns The normalized config without the entries that throw, and its diagnostics followed by those of the entries that throw and are on. `undefined` when an entry that is on throws for a reason that none of its policies explains, such as a schema that the validator cannot compile where code generation from strings is forbidden: leaving the entry out would show a project without problems.
 */
function normalizeWithoutThrowingEntries(
  {
    settings,
    rules,
  }: {
    settings: unknown;
    rules: unknown;
  },
  options: Pick<NormalizeConfigOptions, "rootPath">
): ConfigResult<ConfigNormalized> | undefined {
  const entries = Object.entries(rules as Record<string, unknown>);
  const throwing = entries
    .filter((ruleEntry) => throwsAlone(settings, ruleEntry, options))
    .map(
      ([ruleId, entry]): ListEntry => ({
        ruleId,
        entry: Array.isArray(entry) ? entry : [entry],
      })
    );
  const throwingIds = new Set(throwing.map(({ ruleId }) => ruleId));
  const throwingOn = throwing
    .filter((listEntry) => !isOff(listEntry))
    .map(
      (listEntry): ThrowingEntry => ({
        ...listEntry,
        policyErrors: getPolicyErrors(listEntry),
      })
    );
  if (throwingOn.some(({ policyErrors }) => policyErrors.length === 0)) {
    return undefined;
  }

  const rest = normalizeConfig(
    {
      settings,
      rules: Object.fromEntries(
        entries.filter(([ruleId]) => !throwingIds.has(ruleId))
      ),
    },
    options
  );
  const { legacyWarnings } = rest.value.settings;

  return {
    value: rest.value,
    diagnostics: [
      ...rest.diagnostics,
      ...throwingOn.flatMap((entry) =>
        diagnoseThrowingEntry(entry, legacyWarnings)
      ),
    ],
  };
}

/**
 * Normalizes a config as `normalizeConfig` does, and keeps the diagnostics of a config with a policy half written, such as one being typed in an editor. `normalizeConfig` throws `Invalid entity selector` for a policy whose selector `@boundaries/elements` cannot normalize, such as `{ disallow: {} }`, and the throw drops every diagnostic of the config. The entries of the rules that throw are left out and the rest is normalized.
 * @param config The config object, as written.
 * @param config.settings The settings.
 * @param config.rules The rules.
 * @param options The options of `normalizeConfig`: only the root path that the caller resolved. The rules are read with the `boundaries` prefix, the default of `normalizeConfig`.
 * @returns The normalized config and its diagnostics. For each entry that throws and is on, they end with the diagnostics of its options and an error at each policy that throws, with the message of the error and a period as its title. An entry that throws and is off is left out with no diagnostic.
 * @throws What `normalizeConfig` threw for the config, the same object, when an entry that is on throws for a reason that none of its policies explains, such as a schema that the validator cannot compile where code generation from strings is forbidden, so that the evaluation fails instead of showing a project without problems. What `normalizeConfig` throws for the config without the entries that throw goes through too.
 */
export function normalizeConfigSafely(
  config: {
    settings: unknown;
    rules: unknown;
  },
  options: Pick<NormalizeConfigOptions, "rootPath"> = {}
): ConfigResult<ConfigNormalized> {
  try {
    return normalizeConfig(config, options);
  } catch (error) {
    const normalized = normalizeWithoutThrowingEntries(config, options);
    if (normalized === undefined) {
      throw error;
    }
    return normalized;
  }
}
