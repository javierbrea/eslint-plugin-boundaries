import type { DocumentNode } from "@humanwhocodes/momoa";

import type { ConfigProblem } from "./Engine.types";

/** The text of a config read as one JSON5 object */
export type ConfigRead = {
  readonly parsed: true;
  /** The tree of the text, to find where each entry is */
  readonly ast: DocumentNode;
  /** The object the text writes */
  readonly value: Readonly<Record<string, unknown>>;
  /** Warnings about what the text writes: the keys that the config ignores */
  readonly problems: readonly ConfigProblem[];
};

/** The text of a config that is not one JSON5 object */
export type ConfigRejected = {
  readonly parsed: false;
  /** What is wrong with the text, in a single problem */
  readonly problems: readonly [ConfigProblem];
};

/** The result of reading the text of a config */
export type ParsedConfig = ConfigRead | ConfigRejected;
