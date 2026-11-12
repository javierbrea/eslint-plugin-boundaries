import type { Diagnostic, SettingsNormalized } from "@boundaries/config";

import type { DescribedFiles } from "./describeFiles.types";
import type { EvaluatedRuleName } from "./evaluatedRule.types";
import type { ConfigRead } from "./parseConfig.types";

/** What the summaries of the config are built from */
export type SummariesInput = {
  /** The config as written */
  readonly config: ConfigRead;
  /** The settings that `normalizeConfig` returned for it */
  readonly settings: SettingsNormalized;
  /** The diagnostics that `normalizeConfig` returned for it */
  readonly diagnostics: readonly Diagnostic[];
  /** The files of the sketch described, with how many each descriptor labels and the descriptors left out */
  readonly described: DescribedFiles;
  /** The rule whose dependencies the playground evaluates, as `selectRule` chose it, or `undefined` when none is written */
  readonly evaluatedRuleName: EvaluatedRuleName | undefined;
};
