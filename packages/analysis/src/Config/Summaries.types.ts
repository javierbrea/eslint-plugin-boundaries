import type { Diagnostic, SettingsNormalized } from "@boundaries/config";

import type { ProjectConfig } from "./Config.types";
import type { EvaluatedRuleName } from "./EvaluatedRule.types";

/** What the summaries of the config are built from */
export type SummariesInput = {
  /** The config object as written */
  readonly config: ProjectConfig;
  /** The settings that `normalizeConfig` returned for it */
  readonly settings: SettingsNormalized;
  /** The diagnostics that `normalizeConfig` returned for it */
  readonly diagnostics: readonly Diagnostic[];
  /** The rule whose dependencies the analysis evaluates, as `selectRule` chose it, or `undefined` when none is written */
  readonly evaluatedRuleName: EvaluatedRuleName | undefined;
};
