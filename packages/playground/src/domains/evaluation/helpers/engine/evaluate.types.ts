import type { ConfigAnalysis } from "@boundaries/analysis";

import type { ConfigProblem, PolicyRef } from "./engine.types";
import type { ParsedConfig } from "./parseConfig.types";

/** What the engine knows about a config text, kept so that an edit of the tree does not read the config again */
export type TextAnalysis = {
  /** The text it was made from */
  readonly text: string;
  /** The text read as one JSON5 object, or why it is not one */
  readonly parsed: ParsedConfig;
  /** The analysis of the config that the text writes. An unparsable text is analyzed as a config with no settings and no rules, so the files are still described */
  readonly analysis: ConfigAnalysis;
  /** The problems of the text, placed in it. Kept with the analysis so that the same array reaches the panes while the text does not change */
  readonly problems: readonly ConfigProblem[];
  /** The policies of the evaluated rule placed in the text, in the order of `analysis.policies`: its policies, then its default. Kept with the analysis so that the verdicts of the sketches with the same text point to the same objects */
  readonly policies: readonly PolicyRef[];
};
