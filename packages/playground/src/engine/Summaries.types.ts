import type { Diagnostic, SettingsNormalized } from "@boundaries/config";
import type { EntityDescription } from "@boundaries/elements";

import type { ConfigRead } from "./ParseConfig.types";

/** What the summaries of the config are built from */
export type SummariesInput = {
  /** The config as written */
  readonly config: ConfigRead;
  /** The settings that `normalizeConfig` returned for it */
  readonly settings: SettingsNormalized;
  /** The diagnostics that `normalizeConfig` returned for it */
  readonly diagnostics: readonly Diagnostic[];
  /** The description of each file of the sketch */
  readonly descriptions: readonly EntityDescription[];
};
