import type { ConfigNormalized, ConfigResult } from "@boundaries/config";

import type { ConfigProblem } from "./Engine.types";
import type { ParsedConfig } from "./ParseConfig.types";

/** What the engine knows about a config text, kept so that an edit of the tree does not read the config again */
export type ConfigAnalysis = {
  /** The text it was made from */
  readonly text: string;
  /** The text read as one JSON5 object, or why it is not one */
  readonly parsed: ParsedConfig;
  /** The config normalized, with its diagnostics. An unparsable text is normalized as an empty config, so the files are still described */
  readonly normalized: ConfigResult<ConfigNormalized>;
  /** The problems of the text, placed in it. Kept with the analysis so that the same array reaches the panes while the text does not change */
  readonly problems: readonly ConfigProblem[];
};
